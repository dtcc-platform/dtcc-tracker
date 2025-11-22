from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from httpOnly cookies
    instead of Authorization header
    """

    def get_raw_token(self, request):
        """
        Extracts the JWT token from the httpOnly cookie
        """
        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            return None
        return raw_token.encode('utf-8')

    def authenticate(self, request):
        """
        Authenticate the request using JWT token from cookies
        """
        raw_token = self.get_raw_token(request)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token