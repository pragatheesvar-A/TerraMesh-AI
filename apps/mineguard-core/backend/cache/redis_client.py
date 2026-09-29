"""
TerraMesh AI — Redis Cache & Pub-Sub Client
=============================================
Provides:
  1. Dashboard overview cache (TTL 2s)      — reduces recomputation per request
  2. Node latest-state cache (TTL 10s)      — fast sensor lookups (wired into the
                                              telemetry pipeline)
  3. Pub-Sub publisher                      — WebSocket fan-out across processes

Provenance / freshness:
  Every cached payload is wrapped with `cached_at` (epoch seconds). Consumers
  can always tell whether data is current. The in-memory fallback ALSO
  enforces TTLs, so a stale snapshot can never masquerade as live telemetry
  even when Redis is unavailable.

Graceful degradation (honest):
  * REDIS_URL empty           -> status "disabled"  (in-memory fallback)
  * Redis unreachable at boot -> status "reconnecting"; a background loop
                                 retries with exponential backoff (2s -> 30s)
  * Redis dies mid-run        -> per-call failures mark the client
                                 unavailable; the reconnect loop restores it
  * Failures are logged at WARNING level (never hidden at DEBUG)

Usage:
    from cache.redis_client import redis_cache
    await redis_cache.connect()
    await redis_cache.set_dashboard(data)
    data = await redis_cache.get_dashboard()
    await redis_cache.publish_event({"type": "TELEMETRY_UPDATE", ...})
    redis_cache.status       # "connected" | "reconnecting" | "disabled"
"""

from __future__ import annotations
import asyncio
import json
import os
import time
import logging
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger("terramesh.redis")

try:
    import redis.asyncio as aioredis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False
    logger.warning("redis[asyncio] not installed — running without Redis (in-memory fallback)")


class RedisCache:
    """Async Redis client with reconnection and TTL-enforced in-memory fallback."""

    DASHBOARD_KEY = "terramesh:dashboard:overview"
    DASHBOARD_TTL = 2          # seconds — dashboard overview refresh rate
    NODE_KEY_PREFIX = "terramesh:node:"
    NODE_TTL = 10              # seconds — node state cache
    PUBSUB_CHANNEL = "terramesh.dashboard.events"

    _BACKOFF_MIN = 2.0
    _BACKOFF_MAX = 30.0

    def __init__(self):
        self._client: Optional[Any] = None
        self._redis_url: str = os.getenv("REDIS_URL", "")
        self._available: bool = False
        self._disabled: bool = False          # no redis lib or no REDIS_URL
        self._reconnect_task: Optional[asyncio.Task] = None
        # In-memory fallback store: key -> (expires_at_epoch, wrapped_json)
        self._mem_store: Dict[str, Tuple[float, str]] = {}

    # ── Lifecycle ────────────────────────────────────────────────────────────

    async def connect(self) -> bool:
        """Attempt to connect. Returns True if connected. Safe to call multiple times.
        On failure, schedules a background reconnect loop with backoff.

        NOTE: if the host is `localhost` and the async client cannot connect
        (a known issue when a broker is published on IPv4 loopback only, as
        docker-compose does), one retry is made with 127.0.0.1 — documented
        workaround, logged honestly.
        """
        if not HAS_REDIS or not self._redis_url:
            self._disabled = True
            logger.info("Redis disabled (REDIS_URL not set or redis lib missing). In-memory fallback active.")
            return False

        if not await self._try_connect(self._redis_url):
            host = self._redis_host(self._redis_url)
            if host == "localhost":
                fallback = self._redis_url.replace("//localhost", "//127.0.0.1")
                logger.warning("Redis connection to 'localhost' failed (IPv6 resolution against an "
                               "IPv4-only published port is a known Docker issue) — retrying with 127.0.0.1")
                if await self._try_connect(fallback):
                    self._redis_url = fallback
                    return True
            self._available = False
            logger.warning("Redis unavailable. In-memory fallback active; background reconnect armed.")
            self._start_reconnect_loop()
            return False
        return True

    def _redis_host(self, url: str) -> str:
        try:
            from urllib.parse import urlparse
            return urlparse(url).hostname or ""
        except Exception:
            return ""

    async def _try_connect(self, url: str) -> bool:
        try:
            self._client = aioredis.from_url(
                url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                health_check_interval=30,   # ping the connection periodically
            )
            await self._client.ping()
            self._available = True
            logger.info("Redis connected: %s", url)
            self._stop_reconnect_loop()
            return True
        except Exception as e:
            self._available = False
            logger.warning("Redis connection attempt failed (%s).", e)
            return False

    async def disconnect(self) -> None:
        self._stop_reconnect_loop()
        if self._client:
            try:
                await self._client.aclose()
            except Exception:
                pass
            self._client = None
        self._available = False

    def _start_reconnect_loop(self) -> None:
        if self._disabled or self._reconnect_task and not self._reconnect_task.done():
            return
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return
        self._reconnect_task = loop.create_task(self._reconnect_loop())

    def _stop_reconnect_loop(self) -> None:
        if self._reconnect_task and not self._reconnect_task.done():
            self._reconnect_task.cancel()
        self._reconnect_task = None

    async def _reconnect_loop(self) -> None:
        """Background reconnect with exponential backoff (2s -> 30s)."""
        backoff = self._BACKOFF_MIN
        while True:
            await asyncio.sleep(backoff)
            if self._disabled:
                return
            if await self._try_connect(self._redis_url):
                backoff = self._BACKOFF_MIN
                logger.info("Redis reconnected after outage.")
                return  # loop exits; per-call failures will re-arm it
            logger.warning("Redis still unreachable. Next retry in %.0fs.", min(backoff * 2, self._BACKOFF_MAX))
            backoff = min(backoff * 2, self._BACKOFF_MAX)

    # ── Internal helpers ─────────────────────────────────────────────────────

    @staticmethod
    def _wrap(data: Dict) -> str:
        return json.dumps({"cached_at": time.time(), "data": data})

    @staticmethod
    def _unwrap(raw: Optional[str]) -> Optional[Dict]:
        if raw is None:
            return None
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict) and "data" in parsed and "cached_at" in parsed:
                return parsed["data"]
            return parsed  # legacy unwrapped payload
        except (json.JSONDecodeError, TypeError):
            return None

    def _mem_get(self, key: str) -> Optional[str]:
        entry = self._mem_store.get(key)
        if not entry:
            return None
        expires_at, raw = entry
        if expires_at and time.time() > expires_at:
            # TTL enforcement in fallback: expired data is GONE, never stale-served
            self._mem_store.pop(key, None)
            return None
        return raw

    def _mem_set(self, key: str, raw: str, ttl: int) -> None:
        self._mem_store[key] = (time.time() + ttl, raw)

    def _fail(self, context: str, e: Exception) -> None:
        """Mark unavailable and arm the reconnect loop after a mid-run failure."""
        self._available = False
        logger.warning("Redis %s failed (%s). In-memory fallback active.", context, e)
        self._start_reconnect_loop()

    # ── Dashboard Cache ──────────────────────────────────────────────────────

    async def get_dashboard(self) -> Optional[Dict]:
        """Cached dashboard overview, or None on miss/expiry."""
        if self._available and self._client:
            try:
                return self._unwrap(await self._client.get(self.DASHBOARD_KEY))
            except Exception as e:
                self._fail("get_dashboard", e)
        return self._unwrap(self._mem_get(self.DASHBOARD_KEY))

    async def set_dashboard(self, data: Dict) -> None:
        wrapped = self._wrap(data)
        if self._available and self._client:
            try:
                await self._client.setex(self.DASHBOARD_KEY, self.DASHBOARD_TTL, wrapped)
                return
            except Exception as e:
                self._fail("set_dashboard", e)
        self._mem_set(self.DASHBOARD_KEY, wrapped, self.DASHBOARD_TTL)

    # ── Node State Cache ─────────────────────────────────────────────────────

    async def get_node(self, node_id: str) -> Optional[Dict]:
        key = f"{self.NODE_KEY_PREFIX}{node_id}"
        if self._available and self._client:
            try:
                return self._unwrap(await self._client.get(key))
            except Exception as e:
                self._fail("get_node", e)
        return self._unwrap(self._mem_get(key))

    async def set_node(self, node_id: str, data: Dict) -> None:
        key = f"{self.NODE_KEY_PREFIX}{node_id}"
        wrapped = self._wrap(data)
        if self._available and self._client:
            try:
                await self._client.setex(key, self.NODE_TTL, wrapped)
                return
            except Exception as e:
                self._fail("set_node", e)
        self._mem_set(key, wrapped, self.NODE_TTL)

    async def invalidate_node(self, node_id: str) -> None:
        key = f"{self.NODE_KEY_PREFIX}{node_id}"
        if self._available and self._client:
            try:
                await self._client.delete(key)
            except Exception as e:
                self._fail("invalidate_node", e)
        self._mem_store.pop(key, None)

    async def get_node_with_meta(self, node_id: str) -> Optional[Dict]:
        """Node state including cache metadata (`cached_at`) for freshness audits."""
        key = f"{self.NODE_KEY_PREFIX}{node_id}"
        raw = None
        if self._available and self._client:
            try:
                raw = await self._client.get(key)
            except Exception as e:
                self._fail("get_node_with_meta", e)
        if raw is None:
            raw = self._mem_get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return None

    # ── Pub-Sub Publisher ────────────────────────────────────────────────────

    async def publish_event(self, event: Dict) -> None:
        """Publish a dashboard event for multi-process WebSocket fan-out."""
        if self._available and self._client:
            try:
                await self._client.publish(self.PUBSUB_CHANNEL, json.dumps(event))
            except Exception as e:
                self._fail("publish_event", e)
        # No in-memory pub/sub fallback — the in-process WebSocket manager
        # handles fan-out directly when running single-process.

    # ── Introspection ─────────────────────────────────────────────────────────

    @property
    def is_available(self) -> bool:
        return self._available

    @property
    def status(self) -> str:
        """Honest status even before connect() has been called."""
        if not HAS_REDIS or not self._redis_url:
            return "disabled"
        if self._available:
            return "connected"
        return "reconnecting"


# Module-level singleton
redis_cache = RedisCache()
