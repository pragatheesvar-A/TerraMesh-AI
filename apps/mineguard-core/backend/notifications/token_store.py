"""
TerraMesh AI — FCM Token Store
================================
Device-token registry for Firebase push delivery.

Persistence:
  * Primary: PostgreSQL `fcm_tokens` table (models.FCMTokenModel) — tokens
    survive process restarts.
  * Overlay: in-process dict for fast lookups; hydrated from the DB at boot
    and written through on every mutation.

A token maps worker_id -> latest device token (+ zone). Multi-device per
worker is NOT supported by the legacy API shape (one token per worker).
"""

from __future__ import annotations
import logging
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger("terramesh.fcm.tokens")


class TokenStore:
    def __init__(self):
        # worker_id -> {"token", "zone", "platform"}
        self._tokens: Dict[str, Dict] = {}
        self._zone_tokens: Dict[str, List[str]] = {}
        self._loaded = False

    # ── DB hydration ─────────────────────────────────────────────────────────

    def _load_from_db(self) -> None:
        if self._loaded:
            return
        try:
            import database
            from models import FCMTokenModel
            db = database.SessionLocal()
            try:
                rows = db.query(FCMTokenModel).all()
                for r in rows:
                    if r.token:
                        self._tokens[r.worker_id] = {
                            "token": r.token, "zone": r.zone, "platform": r.platform,
                        }
                        if r.zone:
                            self._zone_tokens.setdefault(r.zone, []).append(r.token)
            finally:
                db.close()
            logger.info("Loaded %d FCM tokens from the database", len(self._tokens))
        except Exception as e:
            logger.warning("FCM token DB hydration skipped (%s) — in-memory only", e)
        self._loaded = True

    def _persist(self, worker_id: str, token: str, zone: Optional[str], platform: str) -> None:
        try:
            import database
            from models import FCMTokenModel
            db = database.SessionLocal()
            try:
                row = db.query(FCMTokenModel).filter(FCMTokenModel.worker_id == worker_id).first()
                if row:
                    row.token = token
                    row.zone = zone
                    row.platform = platform
                    row.last_updated = datetime.utcnow()
                else:
                    db.add(FCMTokenModel(worker_id=worker_id, token=token,
                                         zone=zone, platform=platform,
                                         last_updated=datetime.utcnow()))
                db.commit()
            finally:
                db.close()
        except Exception as e:
            logger.warning("FCM token persist failed (%s) — in-memory only", e)

    # ── Public API (unchanged contract) ──────────────────────────────────────

    def register(self, worker_id: str, token: str, zone: str, platform: str = "android") -> bool:
        self._load_from_db()
        existing = self._tokens.get(worker_id)
        if existing and existing["token"] == token:
            return True  # idempotent

        # If zone changed, remove from old zone index
        if existing and existing.get("zone") and existing["zone"] != zone:
            try:
                self._zone_tokens.get(existing["zone"], []).remove(existing["token"])
            except ValueError:
                pass

        self._tokens[worker_id] = {"token": token, "zone": zone, "platform": platform}
        if zone:
            lst = self._zone_tokens.setdefault(zone, [])
            if token not in lst:
                lst.append(token)
        self._persist(worker_id, token, zone, platform)
        return True

    def deregister(self, worker_id: str) -> bool:
        self._load_from_db()
        entry = self._tokens.pop(worker_id, None)
        if not entry:
            return False
        if entry.get("zone"):
            try:
                self._zone_tokens.get(entry["zone"], []).remove(entry["token"])
            except ValueError:
                pass
        try:
            import database
            from models import FCMTokenModel
            db = database.SessionLocal()
            try:
                db.query(FCMTokenModel).filter(FCMTokenModel.worker_id == worker_id).delete()
                db.commit()
            finally:
                db.close()
        except Exception as e:
            logger.warning("FCM token DB deregister failed (%s)", e)
        return True

    def deregister_by_token(self, token: str) -> bool:
        """Remove whichever worker owns this device token (invalid-token
        cleanup path used by the FCM service after UNREGISTERED errors)."""
        self._load_from_db()
        owner = next((wid for wid, e in self._tokens.items() if e.get("token") == token), None)
        if owner is None:
            return False
        return self.deregister(owner)

    def get_token(self, worker_id: str) -> Optional[str]:
        self._load_from_db()
        entry = self._tokens.get(worker_id)
        return entry["token"] if entry else None

    def get_tokens_for_zone(self, zone: str) -> List[str]:
        self._load_from_db()
        return list(self._zone_tokens.get(zone, []))

    def get_all_tokens(self) -> List[str]:
        self._load_from_db()
        return [e["token"] for e in self._tokens.values()]

    @property
    def token_count(self) -> int:
        self._load_from_db()
        return len(self._tokens)


# Module-level singleton
token_store = TokenStore()
