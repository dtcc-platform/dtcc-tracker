"""
Security middleware for adding security headers to all responses
"""
from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers to every response
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Content Security Policy - Prevent XSS attacks
        # Adjust according to your needs (this is a strict policy)
        if not settings.DEBUG:
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "  # Allow inline scripts if needed
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "  # Allow inline styles
                "font-src 'self' https://fonts.gstatic.com data:; "
                "img-src 'self' data: https:; "
                "connect-src 'self' http://localhost:* http://127.0.0.1:*; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
            response['Content-Security-Policy'] = csp_policy

        # X-Frame-Options - Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'

        # X-Content-Type-Options - Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'

        # Referrer-Policy - Control referrer information
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # X-XSS-Protection - Enable XSS filter (for older browsers)
        response['X-XSS-Protection'] = '1; mode=block'

        # Permissions-Policy (formerly Feature-Policy) - Control browser features
        response['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=(), '
            'usb=(), '
            'magnetometer=(), '
            'accelerometer=()'
        )

        # Strict-Transport-Security - Force HTTPS (only in production)
        if not settings.DEBUG:
            # max-age=31536000 (1 year), includeSubDomains
            response['Strict-Transport-Security'] = (
                'max-age=31536000; includeSubDomains; preload'
            )

        return response


class RemoveServerHeaderMiddleware:
    """
    Middleware to remove server information headers
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Remove headers that expose server information
        if hasattr(response, 'headers'):
            response.headers.pop('Server', None)
            response.headers.pop('X-Powered-By', None)
        elif hasattr(response, '__delitem__'):
            try:
                del response['Server']
            except KeyError:
                pass
            try:
                del response['X-Powered-By']
            except KeyError:
                pass

        return response