from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):
    project_name = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    pi = models.CharField(max_length=255, null=True, blank=True)
    funding_body = models.CharField(max_length=255, null=True, blank=True)
    documents = models.CharField(max_length=255, null=True, blank=True)
    additional_authors = models.JSONField(default=list)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'project_name')
    def __str__(self):
        return self.project_name

class Paper(models.Model):
    author_name = models.CharField(max_length=255)
    doi = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    journal = models.CharField(max_length=255)
    date = models.CharField(max_length=255)
    additional_authors = models.JSONField(default=list)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta: 
        unique_together = ('user', 'doi')
    def __str__(self):
        return self.doi
    
class ChatMessage(models.Model):
    ROLE_CHOICES = (
        ("user", "User"),
        ("assistant", "Assistant"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.role}): {self.content[:30]}"