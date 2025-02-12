from rest_framework import serializers
from .models import Paper, Project

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

    def validate(self, data):
        # Ensure required fields are present
        required_fields = ['author_name', 'doi', 'title', 'category', 'status']
        for field in required_fields:
            if field not in data or not data[field]:
                raise serializers.ValidationError({field: f"{field} is required."})

        return data

class PaperSerializer(serializers.ModelSerializer):

    class Meta:
        model = Paper
        fields = '__all__'
