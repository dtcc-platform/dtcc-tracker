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
    link = models.URLField(max_length=200, null=True, blank=True)
    submission_deadline = models.CharField(max_length=255, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    year = models.CharField(max_length=255, null=True, blank=True)
    period = models.CharField(max_length=50, null=True, blank=True)
    type_of_engagement = models.CharField(max_length=255, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    documents = models.URLField(max_length=200, null=True, blank=True)
    slug = models.SlugField(max_length=200, null=True, blank=True)

    def __str__(self):
        return self.title

class Paper(models.Model):
    author_name = models.CharField(max_length=255)
    doi = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    journal = models.CharField(max_length=255)
    date = models.CharField(max_length=255)

    def __str__(self):
        return self.name