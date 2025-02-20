# Generated by Django 5.1.5 on 2025-01-29 10:31

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Paper',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('author_name', models.CharField(max_length=255)),
                ('doi', models.CharField(max_length=255)),
                ('title', models.CharField(max_length=255)),
                ('journal', models.CharField(max_length=255)),
                ('date', models.CharField(max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('author_name', models.CharField(max_length=255)),
                ('doi', models.CharField(max_length=255)),
                ('title', models.CharField(max_length=255)),
                ('category', models.CharField(max_length=100)),
                ('status', models.CharField(max_length=50)),
                ('pi', models.CharField(blank=True, max_length=255, null=True)),
                ('funding_body', models.CharField(blank=True, max_length=255, null=True)),
                ('funding_program', models.CharField(blank=True, max_length=255, null=True)),
                ('funding_call', models.CharField(blank=True, max_length=255, null=True)),
                ('topic', models.CharField(blank=True, max_length=255, null=True)),
                ('link', models.URLField(blank=True, null=True)),
                ('submission_deadline', models.CharField(blank=True, max_length=255, null=True)),
                ('amount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('year', models.CharField(blank=True, max_length=255, null=True)),
                ('period', models.CharField(blank=True, max_length=50, null=True)),
                ('type_of_engagement', models.CharField(blank=True, max_length=255, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('documents', models.URLField(blank=True, null=True)),
                ('slug', models.SlugField(blank=True, max_length=200, null=True)),
            ],
        ),
    ]
