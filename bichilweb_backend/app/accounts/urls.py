from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from .views import (
    ChangeOwnPasswordView,
    LoginView,
    MeView,
    PermissionListView,
    RoleViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r'accounts/users', UserViewSet, basename='accounts-user')
router.register(r'accounts/roles', RoleViewSet, basename='accounts-role')

auth_urlpatterns = [
    path('auth/token/', LoginView.as_view(), name='token-obtain-pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/token/blacklist/', TokenBlacklistView.as_view(), name='token-blacklist'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/change-password/', ChangeOwnPasswordView.as_view(), name='auth-change-password'),
    path('accounts/permissions/', PermissionListView.as_view(), name='accounts-permissions'),
]
