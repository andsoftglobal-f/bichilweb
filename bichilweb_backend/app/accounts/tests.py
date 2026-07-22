"""
Tests for the auth/RBAC overhaul: JWT login, 401 vs 403 semantics, bcrypt
password hashing, and Super Admin-only user & role management.

Run in isolation from the real database:

    python manage.py test app.accounts --settings=bichilglobusweb.settings_test
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .management.commands.create_admin import ensure_default_admin_role
from .models import AdminProfile
from .permissions import PublicCreateStaffManage, ReadOnlyOrAuthenticated

User = get_user_model()


class LoginAndTokenTests(APITestCase):
    def setUp(self):
        self.password = 'S3curePass!2026'
        self.user = User.objects.create_user(username='ariunaa', password=self.password, is_active=True)

    def test_login_with_correct_credentials_returns_tokens(self):
        response = self.client.post(reverse('token-obtain-pair'), {
            'username': 'ariunaa', 'password': self.password,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'ariunaa')

    def test_login_with_wrong_password_is_rejected(self):
        response = self.client.post(reverse('token-obtain-pair'), {
            'username': 'ariunaa', 'password': 'wrong-password',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_with_inactive_user_is_rejected(self):
        self.user.is_active = False
        self.user.save(update_fields=['is_active'])
        response = self.client.post(reverse('token-obtain-pair'), {
            'username': 'ariunaa', 'password': self.password,
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_request_with_garbage_token_is_401(self):
        # A fresh, uncontaminated client — force_authenticate() on self.client
        # in a sibling test must never be able to leak into this assertion.
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Bearer not-a-real-token')
        response = client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_request_with_no_token_on_protected_view_is_401(self):
        client = APIClient()
        response = client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_returns_current_user_after_login(self):
        # Real header-based auth (not force_authenticate) — this also
        # exercises PublicApiCacheMiddleware exactly as production traffic
        # would, which matters for the cache-isolation test below.
        login = self.client.post(reverse('token-obtain-pair'), {
            'username': 'ariunaa', 'password': self.password,
        })
        access = login.data['access']
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'ariunaa')

    def test_authenticated_response_is_never_cached_for_the_next_anonymous_request(self):
        """
        Regression test: PublicApiCacheMiddleware (app/public_api_cache.py)
        used to cache ANY 200 JSON GET under /api/v1/ purely by path, with no
        regard for who asked — so one user's authenticated response could be
        replayed to the next, possibly anonymous, caller. It must bypass the
        cache entirely whenever a request carries an Authorization header.
        """
        login = self.client.post(reverse('token-obtain-pair'), {
            'username': 'ariunaa', 'password': self.password,
        })
        access = login.data['access']
        authed_client = APIClient()
        authed_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        first = authed_client.get(reverse('auth-me'))
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        anon_client = APIClient()
        second = anon_client.get(reverse('auth-me'))
        self.assertEqual(second.status_code, status.HTTP_401_UNAUTHORIZED)


BCRYPT_HASHERS = [
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
]


class PasswordHashingTests(APITestCase):
    """
    settings_test.py swaps in a fast MD5 hasher globally so the rest of the
    suite doesn't pay bcrypt's cost on every user creation. These two tests
    are specifically about hashing, so they restore the real (bcrypt-first)
    PASSWORD_HASHERS from settings.py to verify the production behavior.
    """

    @override_settings(PASSWORD_HASHERS=BCRYPT_HASHERS)
    def test_new_password_is_hashed_with_bcrypt(self):
        user = User.objects.create_user(username='bolor', password='AnotherSecure!1')
        self.assertTrue(user.password.startswith('bcrypt'))

    @override_settings(PASSWORD_HASHERS=BCRYPT_HASHERS)
    def test_create_admin_command_hashes_with_bcrypt(self):
        from django.core.management import call_command
        call_command('create_admin', username='rootadmin', email='root@example.com',
                      password='SuperSecure!2026', noinput=True)
        user = User.objects.get(username='rootadmin')
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.password.startswith('bcrypt'))
        # bootstrap also seeds the default "Admin" role
        self.assertTrue(Group.objects.filter(name='Admin').exists())


class UserManagementRBACTests(APITestCase):
    """
    'Зөвхөн Super Admin шинэ хэрэглэгч үүсгэх эрхтэй' — only a Super Admin
    may create/manage other users; a regular authenticated Admin gets 403.
    """

    def setUp(self):
        self.super_admin = User.objects.create_user(
            username='super', password='SuperSecure!2026', is_superuser=True, is_staff=True,
        )
        self.regular_admin = User.objects.create_user(username='regular', password='RegularSecure!2026')

    def test_anonymous_user_gets_401_creating_a_user(self):
        response = self.client.post(reverse('accounts-user-list'), {
            'username': 'newperson', 'password': 'Whatever!2026',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_admin_gets_403_creating_a_user(self):
        self.client.force_authenticate(user=self.regular_admin)
        response = self.client.post(reverse('accounts-user-list'), {
            'username': 'newperson', 'password': 'Whatever!2026',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_super_admin_can_create_user(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.post(reverse('accounts-user-list'), {
            'username': 'newperson', 'email': 'new@example.com', 'password': 'Whatever!2026Xy',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        created = User.objects.get(username='newperson')
        self.assertFalse(created.is_superuser)
        self.assertTrue(AdminProfile.objects.get(user=created).must_change_password)

    def test_super_admin_cannot_deactivate_own_account(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.patch(
            reverse('accounts-user-detail', args=[self.super_admin.id]),
            {'is_active': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_regular_admin_gets_403_listing_users(self):
        self.client.force_authenticate(user=self.regular_admin)
        response = self.client.get(reverse('accounts-user-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class RoleManagementTests(APITestCase):
    def setUp(self):
        self.super_admin = User.objects.create_user(
            username='super2', password='SuperSecure!2026', is_superuser=True, is_staff=True,
        )

    def test_super_admin_can_create_role_with_permissions(self):
        self.client.force_authenticate(user=self.super_admin)
        perm_ids = list(Permission.objects.filter(content_type__app_label='accounts').values_list('id', flat=True)[:2])
        response = self.client.post(reverse('accounts-role-list'), {
            'name': 'Editor', 'permission_ids': perm_ids,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(Group.objects.filter(name='Editor').exists())


class EnsureDefaultAdminRoleTests(APITestCase):
    def test_ensure_default_admin_role_grants_app_permissions(self):
        group = ensure_default_admin_role()
        self.assertEqual(group.name, 'Admin')
        self.assertGreater(group.permissions.count(), 0)
        for perm in group.permissions.all():
            self.assertEqual(perm.content_type.app_label, 'app')

    def test_ensure_default_admin_role_is_idempotent(self):
        first = ensure_default_admin_role()
        first_count = first.permissions.count()
        second = ensure_default_admin_role()
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(second.permissions.count(), first_count)


class PermissionClassSemanticsTests(APITestCase):
    """
    Direct unit tests of the custom permission classes against a lightweight
    DRF request/view pair, independent of any specific business model — so
    these stay correct even as content models change.
    """

    def setUp(self):
        self.user = User.objects.create_user(username='staffperson', password='Secure!2026Xy')

    def _request(self, method, authenticated=False):
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        req = getattr(factory, method.lower())('/fake/')
        from rest_framework.request import Request
        drf_request = Request(req)
        drf_request.user = self.user if authenticated else None
        return drf_request

    def test_read_only_or_authenticated_allows_anonymous_get(self):
        perm = ReadOnlyOrAuthenticated()
        self.assertTrue(perm.has_permission(self._request('GET'), None))

    def test_read_only_or_authenticated_blocks_anonymous_post(self):
        perm = ReadOnlyOrAuthenticated()
        self.assertFalse(perm.has_permission(self._request('POST'), None))

    def test_read_only_or_authenticated_allows_authenticated_post(self):
        perm = ReadOnlyOrAuthenticated()
        self.assertTrue(perm.has_permission(self._request('POST', authenticated=True), None))

    def test_public_create_staff_manage_allows_anonymous_create(self):
        perm = PublicCreateStaffManage()
        self.assertTrue(perm.has_permission(self._request('POST'), None))

    def test_public_create_staff_manage_blocks_anonymous_list(self):
        perm = PublicCreateStaffManage()
        self.assertFalse(perm.has_permission(self._request('GET'), None))

    def test_public_create_staff_manage_allows_authenticated_list(self):
        perm = PublicCreateStaffManage()
        self.assertTrue(perm.has_permission(self._request('GET', authenticated=True), None))
