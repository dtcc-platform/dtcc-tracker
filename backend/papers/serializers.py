from rest_framework import serializers
from .models import Paper, Project
from rest_framework_simplejwt.serializers import TokenVerifySerializer
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import User

class ProjectSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    submitted_by = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Project
        fields = '__all__'
        extra_kwargs = {
            'id': {'read_only': True},
        }




class PaperSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    submitted_by = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Paper
        fields = '__all__'


class CustomTokenVerifySerializer(TokenVerifySerializer):
    """
    Extends the built-in TokenVerifySerializer to also return user info 
    (e.g., is_superuser and username).
    """

    def validate(self, attrs):
        # First, call the built-in validation to ensure token is structurally valid
        data = super().validate(attrs)
        
        token_str = attrs["token"]
        
        # Manually decode and verify the token using UntypedToken
        try:
            validated_token = UntypedToken(token_str)
        except TokenError as e:
            raise ValidationError({"detail": str(e)})
        
        # Once decoded, the payload is in validated_token.payload (a dict)
        user_id = validated_token.payload.get("user_id")
        if not user_id:
            raise ValidationError({"detail": "No user_id claim in token."})

        # Fetch the user from your database
        user = User.objects.get(id=user_id)

        # Add extra info to the final response
        data["is_superuser"] = user.is_superuser
        data["username"] = user.username
        return data



