"""
Settings override used ONLY for running the automated test suite.

Swaps the database to an in-memory SQLite instance so `manage.py test` never
opens a connection to the real DATABASES['default'] host — which may be a
production database and is unreachable from most developer/CI machines
anyway. Run tests with:

    python manage.py test --settings=bichilglobusweb.settings_test
"""

from .settings import *  # noqa: F401,F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# The main `app` migration history includes raw, Postgres-specific SQL
# (see app/migrations/*) that SQLite can't parse. Tests don't need that
# historical replay — only working tables matching the current model state —
# so `app` is built directly via Django's syncdb path instead of replaying
# 37 migrations written for a different database engine.
MIGRATION_MODULES = {'app': None}

# Password hashing is intentionally slow (bcrypt) — use a fast hasher for
# tests so the suite doesn't spend seconds per test hashing passwords. This
# does NOT affect the production PASSWORD_HASHERS in settings.py.
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
