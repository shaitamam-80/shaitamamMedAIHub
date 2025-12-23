"""
Tests for Cache Service

Tests both MemoryCache and the cache_service module functions.
Redis tests are skipped if Redis is not available.
"""

import asyncio
from datetime import timedelta
from unittest.mock import AsyncMock, patch

import pytest

from app.services.cache_service import (
    CacheInterface,
    MemoryCache,
    create_cache,
    get_cached_or_compute,
    mesh_cache_key,
    translation_cache_key,
)

# ============================================================================
# MemoryCache Tests
# ============================================================================


class TestMemoryCache:
    """Tests for in-memory cache implementation"""

    @pytest.fixture
    def cache(self):
        """Create a fresh MemoryCache for each test"""
        return MemoryCache(max_size=100)

    @pytest.mark.asyncio
    async def test_set_and_get_basic(self, cache):
        """Test basic set and get operations"""
        await cache.set("key1", {"data": "value1"})
        result = await cache.get("key1")
        assert result == {"data": "value1"}

    @pytest.mark.asyncio
    async def test_get_missing_key_returns_none(self, cache):
        """Test that missing keys return None"""
        result = await cache.get("nonexistent_key")
        assert result is None

    @pytest.mark.asyncio
    async def test_set_overwrites_existing(self, cache):
        """Test that set overwrites existing values"""
        await cache.set("key1", "value1")
        await cache.set("key1", "value2")
        result = await cache.get("key1")
        assert result == "value2"

    @pytest.mark.asyncio
    async def test_delete_removes_key(self, cache):
        """Test delete operation"""
        await cache.set("key1", "value1")
        await cache.delete("key1")
        result = await cache.get("key1")
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_key_returns_true(self, cache):
        """Test deleting a key that doesn't exist"""
        result = await cache.delete("nonexistent")
        assert result is True

    @pytest.mark.asyncio
    async def test_clear_removes_all_keys(self, cache):
        """Test clear operation"""
        await cache.set("key1", "value1")
        await cache.set("key2", "value2")
        await cache.set("key3", "value3")

        await cache.clear()

        assert await cache.get("key1") is None
        assert await cache.get("key2") is None
        assert await cache.get("key3") is None

    @pytest.mark.asyncio
    async def test_exists_returns_true_for_existing_key(self, cache):
        """Test exists operation for existing key"""
        await cache.set("key1", "value1")
        result = await cache.exists("key1")
        assert result is True

    @pytest.mark.asyncio
    async def test_exists_returns_false_for_missing_key(self, cache):
        """Test exists operation for missing key"""
        result = await cache.exists("nonexistent")
        assert result is False

    @pytest.mark.asyncio
    async def test_ttl_expiration(self, cache):
        """Test that TTL expiration works"""
        # Set with very short TTL
        await cache.set("expiring_key", "value", ttl=timedelta(milliseconds=50))

        # Should exist immediately
        assert await cache.get("expiring_key") == "value"

        # Wait for expiration
        await asyncio.sleep(0.1)

        # Should be expired now
        assert await cache.get("expiring_key") is None

    @pytest.mark.asyncio
    async def test_eviction_on_max_size(self, cache):
        """Test LRU-like eviction when max size is reached"""
        small_cache = MemoryCache(max_size=20)

        # Fill cache beyond capacity
        for i in range(25):
            await small_cache.set(f"key{i}", f"value{i}")

        # Cache should have evicted some entries
        stats = await small_cache.get_stats()
        assert stats["size"] <= 20

    @pytest.mark.asyncio
    async def test_lru_access_pattern(self, cache):
        """Test that recently accessed items are kept"""
        small_cache = MemoryCache(max_size=5)

        # Add 5 items
        for i in range(5):
            await small_cache.set(f"key{i}", f"value{i}")

        # Access key0 to make it recently used
        await small_cache.get("key0")

        # Add more items to trigger eviction
        await small_cache.set("new_key", "new_value")

        # key0 should still exist (it was recently accessed)
        assert await small_cache.get("key0") is not None

    @pytest.mark.asyncio
    async def test_get_stats(self, cache):
        """Test statistics collection"""
        await cache.set("key1", "value1")
        await cache.get("key1")  # Hit
        await cache.get("key1")  # Hit
        await cache.get("nonexistent")  # Miss

        stats = await cache.get_stats()

        assert stats["type"] == "MemoryCache"
        assert stats["size"] == 1
        assert stats["hits"] == 2
        assert stats["misses"] == 1
        assert stats["hit_rate_percent"] > 0

    @pytest.mark.asyncio
    async def test_complex_data_types(self, cache):
        """Test caching complex data structures"""
        complex_data = {
            "mesh_terms": [
                {"descriptor_name": "Diabetes Mellitus", "entry_terms": ["DM", "Sugar Disease"]},
                {"descriptor_name": "Type 2 Diabetes", "entry_terms": ["T2D", "NIDDM"]},
            ],
            "free_text_terms": ["diabetes", "diabetic"],
            "entry_terms": ["DM", "Sugar Disease"],
            "original_term": "diabetes",
        }

        await cache.set("complex_key", complex_data)
        result = await cache.get("complex_key")

        assert result == complex_data
        assert len(result["mesh_terms"]) == 2
        assert result["mesh_terms"][0]["descriptor_name"] == "Diabetes Mellitus"


# ============================================================================
# Cache Key Generation Tests
# ============================================================================


class TestCacheKeyGeneration:
    """Tests for cache key generation functions"""

    def test_mesh_cache_key_consistency(self):
        """Test that same term always produces same key"""
        key1 = mesh_cache_key("Diabetes Mellitus")
        key2 = mesh_cache_key("Diabetes Mellitus")
        assert key1 == key2

    def test_mesh_cache_key_case_insensitive(self):
        """Test that key generation is case insensitive"""
        key1 = mesh_cache_key("diabetes")
        key2 = mesh_cache_key("DIABETES")
        key3 = mesh_cache_key("Diabetes")
        assert key1 == key2 == key3

    def test_mesh_cache_key_strips_whitespace(self):
        """Test that whitespace is normalized"""
        key1 = mesh_cache_key("diabetes")
        key2 = mesh_cache_key("  diabetes  ")
        key3 = mesh_cache_key("diabetes ")
        assert key1 == key2 == key3

    def test_mesh_cache_key_different_terms(self):
        """Test that different terms produce different keys"""
        key1 = mesh_cache_key("diabetes")
        key2 = mesh_cache_key("hypertension")
        assert key1 != key2

    def test_mesh_cache_key_prefix(self):
        """Test that key has correct prefix"""
        key = mesh_cache_key("diabetes")
        assert key.startswith("mesh:")

    def test_translation_cache_key_consistency(self):
        """Test translation cache key consistency"""
        key1 = translation_cache_key("סוכרת", "he", "en")
        key2 = translation_cache_key("סוכרת", "he", "en")
        assert key1 == key2

    def test_translation_cache_key_different_languages(self):
        """Test that different language pairs produce different keys"""
        key1 = translation_cache_key("text", "he", "en")
        key2 = translation_cache_key("text", "en", "he")
        assert key1 != key2

    def test_translation_cache_key_prefix(self):
        """Test translation cache key prefix"""
        key = translation_cache_key("text", "he", "en")
        assert key.startswith("trans:")
        assert "he_en:" in key


# ============================================================================
# get_cached_or_compute Tests
# ============================================================================


class TestGetCachedOrCompute:
    """Tests for the get_cached_or_compute utility function"""

    @pytest.mark.asyncio
    async def test_returns_cached_value_on_hit(self):
        """Test that cached value is returned without computing"""
        mock_cache = AsyncMock(spec=CacheInterface)
        mock_cache.get.return_value = {"cached": "data"}

        compute_called = False

        async def compute_fn():
            nonlocal compute_called
            compute_called = True
            return {"computed": "data"}

        with patch("app.services.cache_service.get_cache", return_value=mock_cache):
            result = await get_cached_or_compute("test_key", compute_fn)

        assert result == {"cached": "data"}
        assert not compute_called  # compute_fn should not be called

    @pytest.mark.asyncio
    async def test_computes_and_caches_on_miss(self):
        """Test that value is computed and cached on miss"""
        mock_cache = AsyncMock(spec=CacheInterface)
        mock_cache.get.return_value = None  # Cache miss
        mock_cache.set.return_value = True

        async def compute_fn():
            return {"computed": "data"}

        with patch("app.services.cache_service.get_cache", return_value=mock_cache):
            result = await get_cached_or_compute("test_key", compute_fn, ttl=timedelta(hours=1))

        assert result == {"computed": "data"}
        mock_cache.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_passes_ttl_to_set(self):
        """Test that TTL is passed to cache set"""
        mock_cache = AsyncMock(spec=CacheInterface)
        mock_cache.get.return_value = None
        mock_cache.set.return_value = True

        ttl = timedelta(days=30)

        async def compute_fn():
            return "value"

        with patch("app.services.cache_service.get_cache", return_value=mock_cache):
            await get_cached_or_compute("key", compute_fn, ttl=ttl)

        # Check that set was called with the TTL (positional arg)
        mock_cache.set.assert_called_once_with("key", "value", ttl)


# ============================================================================
# Cache Factory Tests
# ============================================================================


class TestCacheFactory:
    """Tests for cache factory function"""

    def test_creates_memory_cache_without_redis_url(self):
        """Test that MemoryCache is created when REDIS_URL is not set"""

        # Mock getenv to return None for REDIS_URL and "10000" for CACHE_MAX_SIZE
        def mock_getenv(key, default=None):
            if key == "REDIS_URL":
                return None
            if key == "CACHE_MAX_SIZE":
                return "10000"
            return default

        with patch("app.services.cache_service.os.getenv", side_effect=mock_getenv):
            cache = create_cache()
            assert isinstance(cache, MemoryCache)

    def test_creates_redis_cache_with_redis_url(self):
        """Test that RedisCache is created when REDIS_URL is set"""
        # Skip if redis is not installed
        pytest.importorskip("redis")

        with patch.dict("os.environ", {"REDIS_URL": "redis://localhost:6379"}):
            with patch("os.getenv", return_value="redis://localhost:6379"):
                from app.services.cache_service import RedisCache

                cache = create_cache()
                assert isinstance(cache, RedisCache)

    def test_respects_cache_max_size_env(self):
        """Test that CACHE_MAX_SIZE env var is respected"""
        with (
            patch.dict("os.environ", {"CACHE_MAX_SIZE": "5000"}),
            patch(
                "os.getenv", side_effect=lambda k, d=None: "5000" if k == "CACHE_MAX_SIZE" else d
            ),
        ):
            cache = create_cache()
            assert isinstance(cache, MemoryCache)
            assert cache._max_size == 5000


# ============================================================================
# Integration Tests
# ============================================================================


class TestCacheIntegration:
    """Integration tests for cache service"""

    @pytest.mark.asyncio
    async def test_full_mesh_caching_workflow(self):
        """Test complete MeSH term caching workflow"""
        cache = MemoryCache()

        # Simulate MeSH lookup result
        mesh_result = {
            "original_term": "diabetes mellitus",
            "mesh_terms": [
                {
                    "descriptor_ui": "D003920",
                    "descriptor_name": "Diabetes Mellitus",
                    "entry_terms": ["DM", "Diabetes"],
                    "tree_numbers": ["C18.452.394.750"],
                    "scope_note": "A group of metabolic diseases...",
                }
            ],
            "free_text_terms": ['"diabetes mellitus"', "diabetes*"],
            "entry_terms": ["DM", "Diabetes"],
        }

        key = mesh_cache_key("diabetes mellitus")

        # Cache the result
        await cache.set(key, mesh_result, ttl=timedelta(days=30))

        # Retrieve and verify
        cached = await cache.get(key)
        assert cached is not None
        assert cached["original_term"] == "diabetes mellitus"
        assert len(cached["mesh_terms"]) == 1
        assert cached["mesh_terms"][0]["descriptor_name"] == "Diabetes Mellitus"

    @pytest.mark.asyncio
    async def test_concurrent_access(self):
        """Test concurrent cache access doesn't cause issues"""
        cache = MemoryCache()

        async def write_and_read(i):
            key = f"concurrent_key_{i}"
            await cache.set(key, {"value": i})
            await asyncio.sleep(0.01)  # Simulate async work
            result = await cache.get(key)
            return result

        # Run 50 concurrent operations
        tasks = [write_and_read(i) for i in range(50)]
        results = await asyncio.gather(*tasks)

        # All operations should succeed
        for i, result in enumerate(results):
            assert result == {"value": i}
