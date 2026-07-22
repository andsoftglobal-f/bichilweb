"""
Bootstrap command for the very first Super Admin account.

Modeled on Django's own `createsuperuser`: no credentials are ever baked
into code or committed files. Run it once after `migrate`:

    python manage.py create_admin --username admin --email admin@example.com
    python manage.py create_admin            # fully interactive

It also ensures a default "Admin" role (Django Group) exists with the full
set of content-management permissions, so the panel is immediately usable
once the Super Admin starts inviting regular admins — without that seed
step, every newly created non-superuser would be locked out of every write
until someone manually assigned permissions in Role Management.
"""

import getpass

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.management.base import BaseCommand, CommandError

from app.accounts.models import AdminProfile

User = get_user_model()

DEFAULT_ADMIN_ROLE = 'Admin'


def ensure_default_admin_role():
    """Idempotently create the "Admin" role with full permissions on the
    content app (app_label='app') — everything except account management,
    which stays Super Admin-only by permission class, not by group."""
    group, _ = Group.objects.get_or_create(name=DEFAULT_ADMIN_ROLE)
    content_permissions = Permission.objects.filter(content_type__app_label='app')
    group.permissions.set(content_permissions)
    return group


class Command(BaseCommand):
    help = 'Create the first Super Admin user for the admin panel.'

    def add_arguments(self, parser):
        parser.add_argument('--username', dest='username', default=None)
        parser.add_argument('--email', dest='email', default=None)
        parser.add_argument('--password', dest='password', default=None)
        parser.add_argument(
            '--noinput', '--no-input', dest='noinput', action='store_true',
            help='Fail instead of prompting if any value is missing (for scripted deploys).',
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        noinput = options['noinput']

        if not username:
            if noinput:
                raise CommandError('--username is required with --noinput.')
            username = input('Username: ').strip()
        if not username:
            raise CommandError('Username is required.')

        if User.objects.filter(username=username).exists():
            raise CommandError(f'User "{username}" already exists.')

        if not email:
            if noinput:
                raise CommandError('--email is required with --noinput.')
            email = input('Email: ').strip()

        if not password:
            if noinput:
                raise CommandError('--password is required with --noinput.')
            password = getpass.getpass('Password: ')
            password_confirm = getpass.getpass('Password (again): ')
            if password != password_confirm:
                raise CommandError('Passwords did not match.')

        try:
            validate_password(password)
        except DjangoValidationError as exc:
            raise CommandError('\n'.join(exc.messages))

        user = User(username=username, email=email or '', is_superuser=True, is_staff=True, is_active=True)
        user.set_password(password)  # hashed with bcrypt — see PASSWORD_HASHERS
        user.save()
        AdminProfile.objects.update_or_create(user=user, defaults={'must_change_password': False})

        ensure_default_admin_role()

        self.stdout.write(self.style.SUCCESS(
            f'Super Admin "{username}" created. Default "{DEFAULT_ADMIN_ROLE}" role is ready to assign to future users.'
        ))
