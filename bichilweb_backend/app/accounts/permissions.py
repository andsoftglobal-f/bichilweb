"""
Reusable DRF permission classes for role-based access control.

The project's global default (see REST_FRAMEWORK.DEFAULT_PERMISSION_CLASSES
in settings.py) is IsAuthenticatedOrReadOnly, chosen because it is safe on
every view style used in this codebase (ModelViewSet, plain ViewSet,
function-based @api_view, APIView) without needing queryset/model
introspection. The classes below add the finer-grained rules that specific
views opt into explicitly.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsSuperAdmin(BasePermission):
    """Only Super Admins (Django superusers) may access the view at all."""

    message = 'Зөвхөн Super Admin эрхтэй хэрэглэгч энэ үйлдлийг хийх боломжтой.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class ReadOnlyOrAuthenticated(BasePermission):
    """
    Anonymous GET/HEAD/OPTIONS allowed (public content), any other method
    requires a logged-in user. Use on views that have no `queryset`/model to
    introspect (plain ViewSet, APIView) — DjangoModelPermissions* would raise
    an AssertionError on those, so this is the safe equivalent for them.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


class IsAuthenticatedForWrite(BasePermission):
    """
    Fully admin-only view: even GET requires authentication. For endpoints
    with no legitimate public/anonymous use case (analytics dashboards,
    generic file upload, user & role management).
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class PublicCreateStaffManage(BasePermission):
    """
    For customer-facing submission forms (loan requests, job applications):
    anyone may submit (POST/create), but only authenticated staff may list,
    read, update, or delete the submitted records — they contain personal
    data (name, phone, resume, etc.) that must not be publicly listable.
    """

    def has_permission(self, request, view):
        if request.method == 'POST':
            return True
        return bool(request.user and request.user.is_authenticated)
