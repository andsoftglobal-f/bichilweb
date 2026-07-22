from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.throttling import ScopedRateThrottle

from .models import AdminProfile
from .permissions import IsSuperAdmin
from .serializers import (
    AdminTokenObtainPairSerializer,
    ChangeOwnPasswordSerializer,
    MeSerializer,
    PermissionSerializer,
    RoleSerializer,
    SetPasswordSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/token/ — issues an access+refresh token pair."""

    serializer_class = AdminTokenObtainPairSerializer
    # Login is the highest-value brute-force/credential-stuffing target in
    # the whole API — replace the general anon rate (shared with every other
    # public read) with a much tighter dedicated budget. See 'login' in
    # DEFAULT_THROTTLE_RATES (settings.py) and NUM_PROXIES for why this is
    # only meaningful once the real client IP reaches Django through the
    # Next.js BFF proxy.
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'


class MeView(APIView):
    """GET /api/v1/auth/me/ — the currently authenticated user's identity."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class ChangeOwnPasswordView(APIView):
    """POST /api/v1/auth/change-password/ — a user changes their own password."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangeOwnPasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        AdminProfile.objects.update_or_create(user=user, defaults={'must_change_password': False})
        return Response({'detail': 'Нууц үг амжилттай солигдлоо.'})


class UserViewSet(viewsets.ModelViewSet):
    """
    Admin-panel user management. The whole resource is Super Admin-only,
    including read access — per the report, User & Role Management is a
    Super Admin area of the admin panel, not something every Admin sees.

    Hard delete is intentionally not exposed: "Хэрэглэгч ... идэвхгүй болгох"
    means deactivate (is_active=False via PATCH), not remove — that keeps
    audit trails (created records still referencing the user) intact.
    """

    queryset = User.objects.all().prefetch_related('groups').order_by('username')
    permission_classes = [IsSuperAdmin]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        deactivating_self = (
            instance.id == request.user.id
            and 'is_active' in request.data
            and str(request.data.get('is_active')).lower() in ('false', '0')
        )
        if deactivating_self:
            return Response(
                {'detail': 'Та өөрийн эрхийг идэвхгүй болгох боломжгүй.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(instance).data)

    @action(detail=True, methods=['post'], url_path='set-password')
    def set_password(self, request, pk=None):
        target = self.get_object()
        serializer = SetPasswordSerializer(data=request.data, context={'target_user': target})
        serializer.is_valid(raise_exception=True)
        target.set_password(serializer.validated_data['password'])
        target.save(update_fields=['password'])
        AdminProfile.objects.update_or_create(user=target, defaults={'must_change_password': True})
        return Response({'detail': 'Нууц үг шинэчлэгдлээ.'})


class RoleViewSet(viewsets.ModelViewSet):
    """Role management (Django Groups). Super Admin-only, like UserViewSet."""

    queryset = Group.objects.all().prefetch_related('permissions').order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [IsSuperAdmin]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']


class PermissionListView(APIView):
    """
    GET /api/v1/accounts/permissions/ — the full catalogue of assignable
    permissions (every add/change/delete/view permission on the content
    app), grouped by model in the response. This is the authoritative
    source for the Role Management UI's permission picker — it must not be
    derived from whatever a particular role happens to have assigned, since
    that set can legitimately shrink to zero.
    """

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        permissions = Permission.objects.filter(
            content_type__app_label='app'
        ).select_related('content_type').order_by('content_type__model', 'codename')
        return Response(PermissionSerializer(permissions, many=True).data)
