import os
from django.core.wsgi import get_wsgi_application

# Replace 'your_project_name' with your actual Django project name
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_paper.settings')
application = get_wsgi_application()