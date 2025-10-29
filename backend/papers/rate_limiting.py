"""
Rate limiting configuration for all API endpoints
"""
from django_ratelimit.decorators import ratelimit
from functools import wraps
from django.http import JsonResponse


# Rate limit configurations for different endpoint types
RATE_LIMITS = {
    # Authentication endpoints (stricter)
    'auth': '5/m',  # 5 requests per minute
    'password_reset': '3/m',  # 3 requests per minute

    # Read endpoints (more lenient)
    'list': '100/m',  # 100 requests per minute
    'detail': '200/m',  # 200 requests per minute

    # Write endpoints (moderate)
    'create': '30/m',  # 30 creates per minute
    'update': '50/m',  # 50 updates per minute
    'delete': '20/m',  # 20 deletes per minute

    # Search/filter endpoints
    'search': '60/m',  # 60 searches per minute
    'doi_fetch': '20/m',  # 20 DOI lookups per minute

    # Chat/AI endpoints (expensive)
    'chat': '10/m',  # 10 chat messages per minute

    # Default for unspecified endpoints
    'default': '60/m',  # 60 requests per minute
}


def rate_limit_handler(request, exception):
    """
    Custom handler for rate limit exceeded
    """
    return JsonResponse({
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please slow down and try again later.',
        'retry_after': '60 seconds'
    }, status=429)


def api_rate_limit(rate_type='default', method='ALL'):
    """
    Decorator to apply rate limiting to API views

    Args:
        rate_type: Type of rate limit to apply (from RATE_LIMITS dict)
        method: HTTP method(s) to rate limit ('GET', 'POST', 'ALL', etc.)
    """
    def decorator(view_func):
        rate = RATE_LIMITS.get(rate_type, RATE_LIMITS['default'])

        @wraps(view_func)
        def wrapped_view(*args, **kwargs):
            # Apply rate limiting
            limited_view = ratelimit(
                key='ip',  # Rate limit by IP address
                rate=rate,
                method=method
            )(view_func)

            # Check if rate limit was hit
            request = args[0] if args else kwargs.get('request')
            if request and getattr(request, 'limited', False):
                return rate_limit_handler(request, None)

            return limited_view(*args, **kwargs)

        return wrapped_view
    return decorator


# Class-based view mixin
class RateLimitMixin:
    """
    Mixin for applying rate limiting to class-based views
    """
    rate_limit_type = 'default'
    rate_limit_method = 'ALL'

    def dispatch(self, request, *args, **kwargs):
        # Get rate limit for this view
        rate = RATE_LIMITS.get(self.rate_limit_type, RATE_LIMITS['default'])

        # Check rate limit
        from django_ratelimit.core import is_ratelimited
        if is_ratelimited(
            request,
            key='ip',
            rate=rate,
            method=self.rate_limit_method,
            increment=True
        ):
            return rate_limit_handler(request, None)

        return super().dispatch(request, *args, **kwargs)