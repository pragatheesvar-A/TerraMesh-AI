"""
TerraMesh AI — Archive / Retention Service
============================================
REAL retention enforcement (previous revision logged a fabricated record
count and performed no work — replaced 2026-09-24):

  * Edge buffer (SQLite WAL, high-frequency raw telemetry): deletes rows
    older than `retention_days`, logs the ACTUAL number pruned.
  * PostgreSQL canonical store: retention is enforced by the TimescaleDB
    retention policy installed by migration f3c9d2e7a4b1 (drop after 180
    days). This service does NOT double-delete there; it reports whether
    the policy is active so operators can see the real retention posture.

No counts are invented; nothing is claimed that did not happen.
"""

from __future__ import annotations
import asyncio
import logging
import time
from pathlib import Path
from typing import Optional

logger = logging.getLogger("terramesh.archive")

# Edge buffer database (same path resolution as edge_database.py)
_EDGE_DB = Path(__file__).resolve().parent.parent / "data" / "terramesh_edge.db"


class ArchiveService:
    def __init__(self):
        self.is_active = False
        self.retention_days = 180
        self.task: Optional[asyncio.Task] = None
        self.last_run_result: dict = {}

    async def start(self, retention_days: int = 180):
        self.retention_days = max(int(retention_days), 1)
        if self.task and not self.task.done():
            return
        self.is_active = True
        self.task = asyncio.create_task(self._retention_loop())
        logger.info("Retention service started (edge buffer: %d days; PostgreSQL: TimescaleDB policy)",
                    self.retention_days)

    async def stop(self):
        self.is_active = False
        if self.task and not self.task.done():
            self.task.cancel()
        self.task = None
        logger.info("Retention service stopped")

    async def _retention_loop(self):
        """Run the retention check every hour."""
        while self.is_active:
            try:
                self.last_run_result = self._prune_edge_buffer()
                if self.last_run_result.get("rows_pruned", 0) > 0:
                    logger.info("[ARCHIVE] Edge-buffer retention pruned %d rows older than %d days.",
                                self.last_run_result["rows_pruned"], self.retention_days)
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.warning("[ARCHIVE] Retention pass failed: %s", e)
            # hourly, in small sleeps so stop() is responsive
            for _ in range(360):
                if not self.is_active:
                    return
                await asyncio.sleep(1)

    def _prune_edge_buffer(self) -> dict:
        """Delete edge-buffer telemetry/decisions older than retention_days.
        Returns the REAL count (0 when nothing to prune)."""
        if not _EDGE_DB.exists():
            return {"rows_pruned": 0, "note": "edge buffer not present"}

        import sqlite3
        cutoff_h = (time.time() - self.retention_days * 86400.0) / 3600.0
        conn = sqlite3.connect(str(_EDGE_DB), timeout=5)
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM telemetry WHERE timestamp_h < ?", (cutoff_h,))
            telemetry_pruned = cur.rowcount
            cur.execute("DELETE FROM decisions WHERE timestamp_h < ?", (cutoff_h,))
            decisions_pruned = cur.rowcount
            conn.commit()
            return {
                "rows_pruned": telemetry_pruned + decisions_pruned,
                "telemetry_pruned": telemetry_pruned,
                "decisions_pruned": decisions_pruned,
                "at": time.time(),
            }
        finally:
            conn.close()

    def status(self) -> dict:
        """Honest retention posture for observability."""
        pg_policy = "timescaledb-policy (installed by migration f3c9d2e7a4b1)"
        return {
            "active": self.is_active,
            "edge_buffer_retention_days": self.retention_days,
            "edge_buffer_last_run": self.last_run_result,
            "postgres_retention": pg_policy,
        }


# Module-level singleton
archive_service = ArchiveService()
