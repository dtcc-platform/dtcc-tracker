from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

urlpatterns = [
    path("auth/login/", login_view, name="login"),
    path("auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path('papers/', PaperListCreateView.as_view(), name='paper-list-create'),
    path('papers/delete/<int:pk>/', PaperDeleteView.as_view(), name='paper-delete'),
    path('papers/update/<int:pk>/', PaperUpdateView.as_view(), name='paper-update'),  # PUT Route

    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/delete/<int:pk>/', ProjectDeleteView.as_view(), name='project-delete'),
    path('projects/update/<int:pk>/', ProjectUpdateView.as_view(), name='project-update'),  # PUT Route

    path('doi-info/', DOIInfoView.as_view(), name='doi-info'),
]
