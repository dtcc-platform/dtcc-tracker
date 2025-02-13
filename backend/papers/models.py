from django.db import models

class Project(models.Model):
    author_name = models.CharField(max_length=255)
    doi = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    status = models.CharField(max_length=50)
    pi = models.CharField(max_length=255, null=True, blank=True)
    funding_body = models.CharField(max_length=255, null=True, blank=True)
    funding_program = models.CharField(max_length=255, null=True, blank=True)
    funding_call = models.CharField(max_length=255, null=True, blank=True)
    topic = models.CharField(max_length=255, null=True, blank=True)
    link = models.CharField(max_length=255, null=True, blank=True)
    submission_deadline = models.CharField(max_length=255, null=True, blank=True)
    amount = models.CharField(max_length=255, null=True, blank=True)
    year = models.CharField(max_length=255, null=True, blank=True)
    period = models.CharField(max_length=50, null=True, blank=True)
    type_of_engagement = models.CharField(max_length=255, null=True, blank=True)
    notes = models.CharField(max_length=255, null=True, blank=True)
    documents = models.CharField(max_length=255, null=True, blank=True)
    slug = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.title
class Author(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class Paper(models.Model):
    author_name = models.CharField(max_length=255)
    doi = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    journal = models.CharField(max_length=255)
    date = models.CharField(max_length=255)
    additional_authors = models.JSONField(default=list)

    def __str__(self):
        return self.name