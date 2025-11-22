"""
Celery configuration for async task processing
"""
import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_paper.settings')

# Create the Celery app
app = Celery('backend_paper')

# Load configuration from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks()

# Configure task routing
app.conf.task_routes = {
    'papers.tasks.fetch_doi_metadata_async': {'queue': 'doi_fetch'},
    'papers.tasks.send_email_async': {'queue': 'email'},
    'papers.tasks.process_bulk_papers': {'queue': 'bulk'},
}

# Task time limits
app.conf.task_time_limit = 300  # 5 minutes hard limit
app.conf.task_soft_time_limit = 240  # 4 minutes soft limit

@app.task(bind=True)
def debug_task(self):
    """Debug task to test Celery is working"""
    print(f'Request: {self.request!r}')