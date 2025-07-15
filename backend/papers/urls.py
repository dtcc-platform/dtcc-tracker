from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

urlpatterns = [
    path("auth/login/", login_view, name="login"),
    path("auth/token/verify/", CustomTokenVerifyView.as_view(), name="token_verify"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path('forgot_password/', forgot_password, name='forgot_password'),

    path('papers/', PaperListCreateView.as_view(), name='paper-list-create'),
    path('papers/delete/<int:pk>/', PaperDeleteView.as_view(), name='paper-delete'),
    path('papers/update/<int:pk>/', PaperUpdateView.as_view(), name='paper-update'),  # PUT Route

    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/delete/<int:pk>/', ProjectDeleteView.as_view(), name='project-delete'),
    path('projects/update/<int:pk>/', ProjectUpdateView.as_view(), name='project-update'),  # PUT Route

    path('doi-info/', DOIInfoView.as_view(), name='doi-info'),

    path('users/', UserListCreateAPIView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserDetailAPIView.as_view(), name='user-detail'),

    path('chat/', ChatbotView.as_view(), name='chat_placeholder'),
    path("clear_chat_history/", ClearChatHistory.as_view(), name="clear_history"),

    # Superuser paper management
    path('superuser/papers/', SuperuserPaperListView.as_view(), name='superuser-papers'),
    path('superuser/papers/<int:pk>/', SuperuserPaperUpdateView.as_view(), name='superuser-paper-update'),
    path('superuser/papers/bulk-update/', SuperuserBulkUpdateView.as_view(), name='superuser-bulk-update'),
    path('superuser/papers/stats/', SuperuserSubmissionStatsView.as_view(), name='superuser-stats'),


]
