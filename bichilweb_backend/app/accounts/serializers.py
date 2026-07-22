from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import AdminProfile

User = get_user_model()


class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Standard SimpleJWT login, plus a `user` block in the response body so the
    Next.js login route can set the session cookie and render the signed-in
    user's identity in one round trip.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        profile = getattr(self.user, 'admin_profile', None)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'is_superuser': self.user.is_superuser,
            'role_label': 'Super Admin' if self.user.is_superuser else (
                ', '.join(g.name for g in self.user.groups.all()) or 'No role assigned'
            ),
            'must_change_password': bool(profile and profile.must_change_password),
        }
        return data


class PermissionSerializer(serializers.ModelSerializer):
    model = serializers.CharField(source='content_type.model', read_only=True)
    app_label = serializers.CharField(source='content_type.app_label', read_only=True)

    class Meta:
        model = Permission
        fields = ('id', 'name', 'codename', 'app_label', 'model')


class RoleSerializer(serializers.ModelSerializer):
    """A Django Group, presented to the admin UI as a "Role"."""

    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        source='permissions', queryset=Permission.objects.all(), many=True, write_only=True, required=False,
    )
    user_count = serializers.IntegerField(source='user_set.count', read_only=True)

    class Meta:
        model = Group
        fields = ('id', 'name', 'permissions', 'permission_ids', 'user_count')

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Role name is required.')
        return value


class RoleSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('id', 'name')


class UserSerializer(serializers.ModelSerializer):
    groups = RoleSummarySerializer(many=True, read_only=True)
    role_label = serializers.SerializerMethodField()
    must_change_password = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_superuser', 'is_staff',
            'date_joined', 'last_login',
            'groups', 'role_label', 'must_change_password',
        )
        read_only_fields = ('is_superuser', 'is_staff', 'date_joined', 'last_login')

    def get_role_label(self, obj):
        if obj.is_superuser:
            return 'Super Admin'
        names = [g.name for g in obj.groups.all()]
        return ', '.join(names) if names else 'No role assigned'

    def get_must_change_password(self, obj):
        profile = getattr(obj, 'admin_profile', None)
        return bool(profile and profile.must_change_password)


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Creates a new admin-panel user. Only reachable by Super Admins (enforced
    at the view/permission layer, not here) — this is the report's "Зөвхөн
    Super Admin шинэ хэрэглэгч үүсгэх эрхтэй" requirement.
    """

    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    group_ids = serializers.PrimaryKeyRelatedField(
        source='groups', queryset=Group.objects.all(), many=True, required=False,
    )

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'password', 'is_active', 'group_ids',
        )

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        groups = validated_data.pop('groups', [])
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)  # hashed with bcrypt — see PASSWORD_HASHERS
        user.is_staff = False
        user.is_superuser = False
        user.save()
        if groups:
            user.groups.set(groups)
        AdminProfile.objects.update_or_create(user=user, defaults={'must_change_password': True})
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    group_ids = serializers.PrimaryKeyRelatedField(
        source='groups', queryset=Group.objects.all(), many=True, required=False,
    )

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'is_active', 'group_ids')


class SetPasswordSerializer(serializers.Serializer):
    """Super Admin resets another user's password — no old password required."""

    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate_password(self, value):
        try:
            validate_password(value, user=self.context.get('target_user'))
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value


class ChangeOwnPasswordSerializer(serializers.Serializer):
    """A user changes their own password — requires the current password."""

    old_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Одоогийн нууц үг буруу байна.')
        return value

    def validate_new_password(self, value):
        user = self.context['request'].user
        try:
            validate_password(value, user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value


class MeSerializer(serializers.ModelSerializer):
    groups = RoleSummarySerializer(many=True, read_only=True)
    permissions = serializers.SerializerMethodField()
    must_change_password = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_superuser', 'groups', 'permissions', 'must_change_password',
        )

    def get_permissions(self, obj):
        if obj.is_superuser:
            return ['*']
        return sorted(obj.get_all_permissions())

    def get_must_change_password(self, obj):
        profile = getattr(obj, 'admin_profile', None)
        return bool(profile and profile.must_change_password)
