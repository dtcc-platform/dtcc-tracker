from django.urls import path
from .views import *

urlpatterns = [
    path('papers/', PaperListCreateView.as_view(), name='paper-list-create'),
    path('papers/delete/<path:doi>/', PaperDeleteView.as_view(), name='paper-delete'),
    path('papers/update/<path:doi>/', PaperUpdateView.as_view(), name='paper-update'),  # PUT Route

    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/delete/<path:doi>/', ProjectDeleteView.as_view(), name='project-delete'),
    path('projects/update/<path:doi>/', ProjectUpdateView.as_view(), name='project-update'),  # PUT Route

    path('doi-info/', DOIInfoView.as_view(), name='doi-info'),
]
