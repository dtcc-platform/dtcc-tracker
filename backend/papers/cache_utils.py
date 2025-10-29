"""
Cache utilities for optimizing API performance
"""
from django.core.cache import cache
from django.conf import settings
from functools import wraps
import hashlib
import json


def make_cache_key(prefix, *args, **kwargs):
    """
    Generate a cache key from prefix and arguments
    """
    key_parts = [prefix]

    # Add positional arguments
    for arg in args:
        if isinstance(arg, (dict, list)):
            key_parts.append(hashlib.md5(
                json.dumps(arg, sort_keys=True).encode()
            ).hexdigest()[:8])
        else:
            key_parts.append(str(arg))

    # Add keyword arguments
    for k, v in sorted(kwargs.items()):
        if isinstance(v, (dict, list)):
            key_parts.append(f"{k}:{hashlib.md5(json.dumps(v, sort_keys=True).encode()).hexdigest()[:8]}")
        else:
            key_parts.append(f"{k}:{v}")

    return ":".join(key_parts)


def cache_result(prefix, timeout=None):
    """
    Decorator to cache function results

    Args:
        prefix: Cache key prefix
        timeout: Cache timeout in seconds (None for default)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Skip caching if cache is disabled
            if not getattr(settings, 'USE_CACHE', True):
                return func(*args, **kwargs)

            # Generate cache key
            cache_key = make_cache_key(prefix, *args, **kwargs)

            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result

            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout=timeout)

            return result
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern):
    """
    Invalidate all cache keys matching a pattern

    Args:
        pattern: Pattern to match (e.g., "papers:*")
    """
    # For Redis backend
    if hasattr(cache, '_cache'):
        client = cache._cache.get_client()
        keys = client.keys(f"{cache.key_prefix}:{pattern}")
        if keys:
            client.delete(*keys)
    else:
        # Fallback for other cache backends
        cache.clear()


def cached_queryset(timeout=300):
    """
    Decorator for caching queryset results in ViewSets
    """
    def decorator(viewset_class):
        original_list = viewset_class.list

        def cached_list(self, request, *args, **kwargs):
            # Generate cache key based on query parameters
            cache_key = make_cache_key(
                f"{viewset_class.__name__}:list",
                request.GET.dict(),
                user_id=request.user.id if request.user.is_authenticated else 'anonymous'
            )

            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                return cached_response

            # Get actual response
            response = original_list(self, request, *args, **kwargs)

            # Cache successful responses
            if response.status_code == 200:
                cache.set(cache_key, response, timeout=timeout)

            return response

        viewset_class.list = cached_list
        return viewset_class

    return decorator


class CacheMixin:
    """
    Mixin for ViewSets to add caching capabilities
    """
    cache_timeout = 300  # Default 5 minutes
    cache_key_prefix = None

    def get_cache_key_prefix(self):
        """Get cache key prefix for this viewset"""
        if self.cache_key_prefix:
            return self.cache_key_prefix
        return self.__class__.__name__.lower()

    def get_list_cache_key(self, request):
        """Generate cache key for list operations"""
        prefix = self.get_cache_key_prefix()
        return make_cache_key(
            f"{prefix}:list",
            request.GET.dict(),
            user_id=request.user.id if request.user.is_authenticated else 'anonymous'
        )

    def get_detail_cache_key(self, pk, request=None):
        """Generate cache key for detail operations"""
        prefix = self.get_cache_key_prefix()
        user_id = request.user.id if request and request.user.is_authenticated else 'anonymous'
        return make_cache_key(f"{prefix}:detail", pk=pk, user_id=user_id)

    def invalidate_list_cache(self):
        """Invalidate all list caches for this viewset"""
        prefix = self.get_cache_key_prefix()
        invalidate_cache_pattern(f"{prefix}:list:*")

    def invalidate_detail_cache(self, pk):
        """Invalidate detail cache for specific object"""
        prefix = self.get_cache_key_prefix()
        invalidate_cache_pattern(f"{prefix}:detail:pk:{pk}:*")


# Pre-configured cache decorators for common use cases
cache_for_minute = cache_result(timeout=60)
cache_for_hour = cache_result(timeout=3600)
cache_for_day = cache_result(timeout=86400)