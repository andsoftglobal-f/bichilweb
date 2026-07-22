from django.conf import settings
from django.db import models


class AdminProfile(models.Model):
    """
    Extra, admin-panel-specific state for a stock `auth.User`.

    Deliberately NOT a swap of AUTH_USER_MODEL — this project already has
    migrations applied against the default `auth.User` table, and changing
    the user model afterwards is high-risk. A one-to-one profile is the
    standard, safe way to attach extra fields to users after the fact.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_profile',
    )
    must_change_password = models.BooleanField(
        default=True,
        help_text='If true, the admin panel forces a password change on next login.',
    )
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Admin profile'
        verbose_name_plural = 'Admin profiles'

    def __str__(self):
        return f'AdminProfile({self.user.username})'
