from rest_framework_simplejwt.tokens import AccessToken

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQwNDAzMzgzLCJpYXQiOjE3NDA0MDMwODMsImp0aSI6ImFmYjk2OWM4ZjQwZTQ2OTlhY2NiNzQwOGI3MjY5OTgwIiwidXNlcl9pZCI6MX0.fciPjuNQXm-ldiI-__uRLpxrAEd4TXwReIZgkhDpbRk"

try:
    decoded_token = AccessToken(token)
    print(f"Decoded Token: {decoded_token}")
except Exception as e:
    print(f"Token error: {e}")
