"""
MedAI Hub - Cache Service

Abstract cache interface with Memory and Redis implementations.
Zero-config default: Uses in-memory cache.
Auto-upgrade: Uses Redis if REDIS_URL environment variable is set.

Usage:
    from app.services.cache_service import cache_service, mesh_cache_key

    # Store a value
    await cache_service.set("key", {"data": "value"}, ttl=timedelta(days=30))

    # Retrieve a value
    value = await cache_service.get("key")

    # For MeSH terms specifically
    key = mesh_cache_key("diabetes mellitus")
    await cache_service.set(key, expanded_terms_dict)
"""

import hashlib
import json
import logging
import os
import time
from abc import ABC, abstractmethod
from collections import OrderedDict
from datetime import timedelta
from typing import Any

logger = logging.getLogger(__name__)


class CacheInterface(ABC):
    """
    Abstract cache interface.

    All cache implementations must provide these methods.
    Operations are async to support both memory and network-based caches.
    """

    @abstractmethod
    async def get(self, key: str) -> Any | None:
        """
        Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/expired
        """
        pass

    @abstractmethod
    async def set(self, key: str, value: Any, ttl: timedelta | None = None) -> bool:
        """
        Set value in cache with optional TTL.

        Args:
            key: Cache key
            value: Value to store (must be JSON-serializable)
            ttl: Time-to-live (optional, None = no expiration for memory, default for Redis)

        Returns:
            True if stored successfully
        """
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.

        Args:
            key: Cache key

        Returns:
            True if deleted (or didn't exist)
        """
        pass

    @abstractmethod
    async def clear(self) -> bool:
        """
        Clear all cache entries.

        Returns:
            True if cleared successfully
        """
        pass

    @abstractmethod
    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.

        Args:
            key: Cache key

        Returns:
            True if key exists and hasn't expired
        """
        pass

    async def get_stats(self) -> dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dict with cache statistics (implementation-specific)
        """
        return {"type": self.__class__.__name__}


class MemoryCache(CacheInterface):
    """
    In-memory cache implementation.

    Features:
    - No external dependencies
    - LRU-like eviction when max_size reached
    - Optional TTL support
    - Perfect for single-process deployments

    Limitations:
    - Lost on process restart
    - Not shared across multiple workers
    - Uses process memory
    """

    def __init__(self, max_size: int = 10000):
        """
        Initialize memory cache.

        Args:
            max_size: Maximum number of entries before eviction
        """
        self._cache: OrderedDict[str, dict[str, Any]] = OrderedDict()
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    async def get(self, key: str) -> Any | None:
        """Get value from cache with TTL check."""
        if key not in self._cache:
            self._misses += 1
            return None

        entry = self._cache[key]

        # Check TTL
        if entry.get("expires_at") and time.time() > entry["expires_at"]:
            del self._cache[key]
            self._misses += 1
            return None

        # Move to end (LRU)
        self._cache.move_to_end(key)
        self._hits += 1
        return entry["value"]

    async def set(self, key: str, value: Any, ttl: timedelta | None = None) -> bool:
        """Set value in cache with optional TTL."""
        # Eviction when max size reached
        if len(self._cache) >= self._max_size and key not in self._cache:
            # Remove oldest 10%
            num_to_remove = max(1, self._max_size // 10)
            for _ in range(num_to_remove):
                self._cache.popitem(last=False)

        # Calculate expiration time
        expires_at = None
        if ttl:
            expires_at = time.time() + ttl.total_seconds()

        self._cache[key] = {"value": value, "expires_at": expires_at, "created_at": time.time()}

        # Move to end (most recently used)
        self._cache.move_to_end(key)
        return True

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if key in self._cache:
            del self._cache[key]
        return True

    async def clear(self) -> bool:
        """Clear all cache entries."""
        self._cache.clear()
        self._hits = 0
        self._misses = 0
        return True

    async def exists(self, key: str) -> bool:
        """Check if key exists and hasn't expired."""
        if key not in self._cache:
            return False

        entry = self._cache[key]
        if entry.get("expires_at") and time.time() > entry["expires_at"]:
            del self._cache[key]
            return False

        return True

    async def get_stats(self) -> dict[str, Any]:
        """Get cache statistics."""
        total_requests = self._hits + self._misses
        hit_rate = (self._hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "type": "MemoryCache",
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate_percent": round(hit_rate, 2),
        }


class RedisCache(CacheInterface):
    """
    Redis cache implementation.

    Features:
    - Persistent across restarts
    - Shared across multiple workers/processes
    - Native TTL support
    - Scalable for production

    Requirements:
    - Redis server running
    - REDIS_URL environment variable set
    - redis[hiredis] package installed
    """

    def __init__(self, redis_url: str):
        """
        Initialize Redis cache.

        Args:
            redis_url: Redis connection URL (e.g., redis://localhost:6379)
        """
        try:
            import redis.asyncio as redis

            self._client = redis.from_url(
                redis_url, decode_responses=True, socket_connect_timeout=5, socket_timeout=5
            )
            self._prefix = "medai:"
            self._available = True
            logger.info(f"Redis cache initialized with URL: {redis_url[:20]}...")
        except ImportError:
            logger.error("redis package not installed. Run: pip install redis[hiredis]")
            self._available = False
        except Exception as e:
            logger.error(f"Failed to initialize Redis: {e}")
            self._available = False

    async def get(self, key: str) -> Any | None:
        """Get value from Redis."""
        if not self._available:
            return None

        try:
            data = await self._client.get(f"{self._prefix}{key}")
            if data:
                return json.loads(data)
            return None
        except json.JSONDecodeError as e:
            logger.warning(f"Redis JSON decode error for key {key}: {e}")
            return None
        except Exception as e:
            logger.warning(f"Redis get failed for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: timedelta | None = None) -> bool:
        """Set value in Redis with optional TTL."""
        if not self._available:
            return False

        try:
            data = json.dumps(value, default=str)
            full_key = f"{self._prefix}{key}"

            if ttl:
                await self._client.setex(full_key, int(ttl.total_seconds()), data)
            else:
                # Default TTL of 30 days for Redis to prevent unbounded growth
                await self._client.setex(full_key, 30 * 24 * 60 * 60, data)

            return True
        except Exception as e:
            logger.warning(f"Redis set failed for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from Redis."""
        if not self._available:
            return False

        try:
            await self._client.delete(f"{self._prefix}{key}")
            return True
        except Exception as e:
            logger.warning(f"Redis delete failed for key {key}: {e}")
            return False

    async def clear(self) -> bool:
        """Clear all MedAI cache entries from Redis."""
        if not self._available:
            return False

        try:
            # Only delete keys with our prefix
            cursor = 0
            while True:
                cursor, keys = await self._client.scan(
                    cursor=cursor, match=f"{self._prefix}*", count=100
                )
                if keys:
                    await self._client.delete(*keys)
                if cursor == 0:
                    break
            return True
        except Exception as e:
            logger.warning(f"Redis clear failed: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis."""
        if not self._available:
            return False

        try:
            return await self._client.exists(f"{self._prefix}{key}") > 0
        except Exception as e:
            logger.warning(f"Redis exists check failed for key {key}: {e}")
            return False

    async def get_stats(self) -> dict[str, Any]:
        """Get Redis cache statistics."""
        if not self._available:
            return {"type": "RedisCache", "available": False}

        try:
            info = await self._client.info("stats")
            keys_count = await self._client.dbsize()

            return {
                "type": "RedisCache",
                "available": True,
                "total_keys": keys_count,
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
            }
        except Exception as e:
            logger.warning(f"Redis stats failed: {e}")
            return {"type": "RedisCache", "available": False, "error": str(e)}


class FallbackCache(CacheInterface):
    """
    Fallback cache that tries Redis first, falls back to memory.

    Useful for graceful degradation when Redis is temporarily unavailable.
    """

    def __init__(self, redis_url: str, max_memory_size: int = 10000):
        self._redis = RedisCache(redis_url)
        self._memory = MemoryCache(max_size=max_memory_size)

    async def get(self, key: str) -> Any | None:
        # Try Redis first
        result = await self._redis.get(key)
        if result is not None:
            return result
        # Fall back to memory
        return await self._memory.get(key)

    async def set(self, key: str, value: Any, ttl: timedelta | None = None) -> bool:
        # Try to set in both
        redis_success = await self._redis.set(key, value, ttl)
        memory_success = await self._memory.set(key, value, ttl)
        return redis_success or memory_success

    async def delete(self, key: str) -> bool:
        await self._redis.delete(key)
        await self._memory.delete(key)
        return True

    async def clear(self) -> bool:
        await self._redis.clear()
        await self._memory.clear()
        return True

    async def exists(self, key: str) -> bool:
        return await self._redis.exists(key) or await self._memory.exists(key)

    async def get_stats(self) -> dict[str, Any]:
        return {
            "type": "FallbackCache",
            "redis": await self._redis.get_stats(),
            "memory": await self._memory.get_stats(),
        }


def create_cache() -> CacheInterface:
    """
    Factory function - creates appropriate cache based on environment.

    Logic:
    1. If REDIS_URL is set → Use Redis
    2. Otherwise → Use in-memory cache

    Returns:
        CacheInterface implementation
    """
    redis_url = os.getenv("REDIS_URL")

    if redis_url:
        logger.info("REDIS_URL found - using Redis cache")
        return RedisCache(redis_url)
    else:
        logger.info("No REDIS_URL - using in-memory cache")
        max_size = int(os.getenv("CACHE_MAX_SIZE", "10000"))
        return MemoryCache(max_size=max_size)


# Global singleton - created lazily
_cache_instance: CacheInterface | None = None


def get_cache() -> CacheInterface:
    """Get the global cache instance (lazy initialization)."""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = create_cache()
    return _cache_instance


# Convenience accessor
cache_service = get_cache()


# ============================================================================
# Helper Functions for MeSH Caching
# ============================================================================


def mesh_cache_key(term: str) -> str:
    """
    Generate consistent cache key for MeSH term lookup.

    Normalizes the term (lowercase, stripped) and hashes it for consistent keys.

    Args:
        term: Original search term

    Returns:
        Cache key string (e.g., "mesh:a1b2c3d4...")
    """
    normalized = term.lower().strip()
    # Use MD5 for short, consistent keys (not for security)
    hash_value = hashlib.md5(normalized.encode()).hexdigest()[:16]
    return f"mesh:{hash_value}"


def translation_cache_key(text: str, source_lang: str = "he", target_lang: str = "en") -> str:
    """
    Generate cache key for translation results.

    Args:
        text: Text to translate
        source_lang: Source language code
        target_lang: Target language code

    Returns:
        Cache key string
    """
    normalized = text.lower().strip()
    hash_value = hashlib.md5(normalized.encode()).hexdigest()[:16]
    return f"trans:{source_lang}_{target_lang}:{hash_value}"


async def get_cached_or_compute(key: str, compute_fn, ttl: timedelta | None = None) -> Any:
    """
    Get value from cache or compute and store it.

    Utility function for the common pattern:
    1. Try cache
    2. If miss, compute value
    3. Store in cache
    4. Return value

    Args:
        key: Cache key
        compute_fn: Async function to compute value if not cached
        ttl: Time-to-live for cached value

    Returns:
        Cached or computed value
    """
    cache = get_cache()

    # Try cache first
    cached = await cache.get(key)
    if cached is not None:
        logger.debug(f"Cache hit for key: {key[:30]}...")
        return cached

    # Compute value
    logger.debug(f"Cache miss for key: {key[:30]}..., computing...")
    value = await compute_fn()

    # Store in cache
    await cache.set(key, value, ttl)

    return value
