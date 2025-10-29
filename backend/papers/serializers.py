from rest_framework import serializers
from .models import Paper, Project
from rest_framework_simplejwt.serializers import TokenVerifySerializer
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
import re
import bleach

class ProjectSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    submitted_by = serializers.ReadOnlyField(source='user.username')

    # Add field-level validators
    project_name = serializers.CharField(
        max_length=255,
        min_length=3,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9\s\-._]+$',
                message='Project name can only contain letters, numbers, spaces, hyphens, dots, and underscores.'
            )
        ]
    )

    status = serializers.ChoiceField(
        choices=['Draft', 'Submitted', 'Approved'],
        error_messages={'invalid_choice': 'Status must be Draft, Submitted, or Approved'}
    )

    funding_body = serializers.ChoiceField(
        choices=['EU', 'VR', 'Vinnova', 'Formas', 'Trafikverket', 'Energimyndigheten'],
        required=False,
        allow_blank=True,
        error_messages={'invalid_choice': 'Invalid funding body selected'}
    )

    class Meta:
        model = Project
        fields = '__all__'
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def validate_project_name(self, value):
        """Additional validation for project name"""
        # Sanitize input to prevent XSS
        cleaned_value = bleach.clean(value, tags=[], strip=True)
        if cleaned_value != value:
            raise ValidationError("Project name contains invalid HTML/script content")
        return value

    def validate_additional_authors(self, value):
        """Validate additional authors list"""
        if value and isinstance(value, list):
            if len(value) > 50:
                raise ValidationError("Too many additional authors (max 50)")
            # Sanitize each author name
            cleaned_authors = []
            for author in value:
                if not isinstance(author, str):
                    raise ValidationError("Each author must be a string")
                cleaned = bleach.clean(author, tags=[], strip=True)
                if len(cleaned) > 100:
                    raise ValidationError("Author name too long (max 100 characters)")
                cleaned_authors.append(cleaned)
            return cleaned_authors
        return value




from django.contrib.auth.models import User

class PaperSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    submitted_by = serializers.ReadOnlyField(source='user.username')

    # DOI validation
    doi = serializers.CharField(
        max_length=255,
        validators=[
            RegexValidator(
                regex=r'^10\.\d{4,9}/[-._;()/:A-Z0-9]+$',
                message='Invalid DOI format. DOI should start with "10." followed by publisher code.',
                flags=re.IGNORECASE
            )
        ]
    )

    # Title validation
    title = serializers.CharField(
        max_length=500,
        min_length=3,
        error_messages={
            'max_length': 'Title too long (max 500 characters)',
            'min_length': 'Title too short (min 3 characters)'
        }
    )

    # Author name validation
    author_name = serializers.CharField(
        max_length=255,
        min_length=2,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z\s\-.\',]+$',
                message='Author name can only contain letters, spaces, hyphens, dots, commas and apostrophes.'
            )
        ]
    )

    # Journal validation
    journal = serializers.CharField(
        max_length=255,
        min_length=2
    )

    # Date validation
    date = serializers.DateField(
        input_formats=['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y'],
        error_messages={
            'invalid': 'Date must be in format YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY'
        }
    )

    # Publication type validation
    publication_type = serializers.ChoiceField(
        choices=['Article in journal', 'Monograph', 'Conference proceedings', 'Other'],
        error_messages={'invalid_choice': 'Invalid publication type'}
    )

    # Milestone project validation
    milestone_project = serializers.ChoiceField(
        choices=[
            'Crowd movement',
            'Digital twins for circularity',
            'Data models for digital twin cities',
            'Twinable',
            'Urban environmental comfort design',
            'Digital twin of construction site',
            'Design and data',
            '4D digital twin for underground and natural hazards',
            'Twin re-fab',
            'Digital twin platform',
            'Other'
        ],
        required=False,
        allow_blank=True
    )

    class Meta:
        model = Paper
        fields = '__all__'
        extra_kwargs = {
            'submission_year': {'read_only': True},  # Only superuser can modify via special endpoints
            'is_master_copy': {'read_only': True},
        }

    def validate_doi(self, value):
        """Additional DOI validation and sanitization"""
        # Remove any potential XSS
        cleaned_value = bleach.clean(value, tags=[], strip=True)
        if cleaned_value != value:
            raise ValidationError("DOI contains invalid HTML/script content")
        # Normalize DOI format
        return value.strip().lower()

    def validate_title(self, value):
        """Sanitize title to prevent XSS"""
        cleaned_value = bleach.clean(value, tags=[], strip=True)
        if cleaned_value != value:
            raise ValidationError("Title contains invalid HTML/script content")
        return cleaned_value

    def validate_author_name(self, value):
        """Sanitize author name"""
        cleaned_value = bleach.clean(value, tags=[], strip=True)
        if cleaned_value != value:
            raise ValidationError("Author name contains invalid HTML/script content")
        return cleaned_value

    def validate_journal(self, value):
        """Sanitize journal name"""
        cleaned_value = bleach.clean(value, tags=[], strip=True)
        return cleaned_value

    def validate_additional_authors(self, value):
        """Validate additional authors list"""
        if value and isinstance(value, list):
            if len(value) > 100:
                raise ValidationError("Too many additional authors (max 100)")
            cleaned_authors = []
            for author in value:
                if not isinstance(author, str):
                    raise ValidationError("Each author must be a string")
                cleaned = bleach.clean(author, tags=[], strip=True)
                if len(cleaned) > 100:
                    raise ValidationError("Author name too long (max 100 characters)")
                cleaned_authors.append(cleaned)
            return cleaned_authors
        return value
    
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        
        if user and user.is_superuser:
            # Superuser creates a master copy directly
            validated_data['is_master_copy'] = True
            paper = super().create(validated_data)
        else:
            # Regular user creates normal paper
            validated_data['is_master_copy'] = False
            paper = super().create(validated_data)
            
            # Auto-copy to superuser if not already exists
            self._create_superuser_copy(paper)
        
        return paper
    
    def _create_superuser_copy(self, paper):
        """Create a master copy for the superuser if it doesn't exist"""
        try:
            superuser = User.objects.filter(is_superuser=True).first()
            if not superuser:
                return  # No superuser found
            
            # Check if superuser already has this DOI
            if not Paper.objects.filter(
                doi=paper.doi, 
                user=superuser, 
                is_master_copy=True
            ).exists():
                # Create master copy for superuser
                Paper.objects.create(
                    doi=paper.doi,
                    title=paper.title,
                    author_name=paper.author_name,
                    publication_type=paper.publication_type,
                    milestone_project=getattr(paper, 'milestone_project', ''),
                    journal=getattr(paper, 'journal', ''),
                    date=getattr(paper, 'date', ''),
                    additional_authors=getattr(paper, 'additional_authors', ''),
                    user=superuser,
                    is_master_copy=True,
                    submission_year=None  # Default to not submitted
                )
        except Exception as e:
            # Log error but don't fail the original paper creation
            print(f"Error creating superuser copy: {e}")
            # You might want to use proper logging here
            import logging
            logging.error(f"Error creating superuser copy: {e}")


class SuperuserPaperSerializer(serializers.ModelSerializer):
    """Serializer for superuser to manage submissions"""
    submitted_by = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Paper
        fields = '__all__'
        
    def update(self, instance, validated_data):
        # When superuser updates submission year, sync to all copies
        if 'submission_year' in validated_data:
            submission_year = validated_data['submission_year']
            # Update all papers with the same DOI
            Paper.objects.filter(doi=instance.doi).update(
                submission_year=submission_year
            )
        
        return super().update(instance, validated_data)


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

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # You can customize which fields to expose
        fields = [
            'id', 'username', 'email', 'is_superuser', 'is_staff', 
            'password'
        ]
        # Make 'id' read-only and possibly exclude 'password' from being read back
        read_only_fields = ['id']

    # By default, if you want to handle password creation or updating properly,
    # you need to override how password is set so it’s hashed:
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


