"""
Django settings for bichilglobusweb project.
"""

from pathlib import Path
import environ
import os

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'corsheaders',
    'app',
    'app.accounts',
]

try:
    import storages as _storages_check  # noqa: F401
    INSTALLED_APPS.insert(-1, 'storages')
except ImportError:
    pass

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'app.sftp_middleware.SFTPMediaMiddleware',
    'app.public_api_cache.PublicApiCacheMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'bichilglobusweb.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# PostgreSQL 13.5 дэмжих (Django 6.0 нь PG14+ шаарддаг)
from django.db.backends.postgresql.base import DatabaseWrapper as _PGWrapper
_PGWrapper.check_database_version_supported = lambda self: None

WSGI_APPLICATION = 'bichilglobusweb.wsgi.application'

DB_SCHEMA = env("DB_SCHEMA", default="bichilweb").strip()
DB_OPTIONS = {}
if DB_SCHEMA:
    # Include public as a safe fallback for platforms like Render where a new
    # PostgreSQL database usually starts with only the public schema.
    DB_OPTIONS["options"] = f"-c search_path={DB_SCHEMA},public"

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env("DB_NAME"),
        'USER': env("DB_USER"),
        'PASSWORD': env("DB_PASSWORD"),
        'HOST': env("DB_HOST", default="172.20.10.51"),
        'PORT': env("DB_PORT", default="5432"),
        'OPTIONS': DB_OPTIONS,
        'CONN_MAX_AGE': env.int("DB_CONN_MAX_AGE", default=300),
        'CONN_HEALTH_CHECKS': True,
    }
}

# Render эсвэл гадны PostgreSQL руу SSL холболт
DB_HOST = env("DB_HOST", default="172.20.10.51")
if env.bool("DB_SSL", default=False) or 'render.com' in DB_HOST:
    DATABASES['default']['OPTIONS']['sslmode'] = 'require'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

CORS_ALLOW_ALL_ORIGINS = env.bool("CORS_ALLOW_ALL_ORIGINS", default=False)
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_ROOT = BASE_DIR / "media"

SFTP_STORAGE_HOST = env("SFTP_STORAGE_HOST", default="")
SFTP_STORAGE_ROOT = env("SFTP_STORAGE_ROOT", default="/")
# SFTP must be explicitly enabled. Keeping old SFTP_* env vars on Render should
# not silently disable S3 or make every /media request wait on port 22.
USE_SFTP_STORAGE = env.bool("USE_SFTP_STORAGE", default=False)
SFTP_STORAGE_PARAMS = {
    "port": env.int("SFTP_STORAGE_PORT", default=22),
    "username": env("SFTP_STORAGE_USER", default=""),
    "password": env("SFTP_STORAGE_PASS", default=""),
    "timeout": env.int("SFTP_STORAGE_TIMEOUT", default=8),
    "banner_timeout": env.int("SFTP_STORAGE_TIMEOUT", default=8),
    "auth_timeout": env.int("SFTP_STORAGE_TIMEOUT", default=8),
    "allow_agent": False,
    "look_for_keys": False,
}
SFTP_STORAGE_INTERACTIVE = False

AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default=None)
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default=None)
AWS_STORAGE_BUCKET_NAME = (
    env("AWS_STORAGE_BUCKET_NAME", default="")
    or env("AWS_S3_BUCKET_NAME", default="")
)
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default=None)
AWS_S3_CUSTOM_DOMAIN = env("AWS_S3_CUSTOM_DOMAIN", default=None)
AWS_S3_ENDPOINT_URL = env("AWS_S3_ENDPOINT_URL", default=None)
AWS_S3_ADDRESSING_STYLE = env("AWS_S3_ADDRESSING_STYLE", default="virtual")
AWS_S3_SIGNATURE_VERSION = env("AWS_S3_SIGNATURE_VERSION", default="s3v4")
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = env.bool("AWS_QUERYSTRING_AUTH", default=False)
AWS_S3_OBJECT_PARAMETERS = {
    "CacheControl": env("AWS_S3_CACHE_CONTROL", default="max-age=86400"),
}

USE_S3_STORAGE = (
    env.bool("USE_S3_STORAGE", default=bool(AWS_STORAGE_BUCKET_NAME))
    and not USE_SFTP_STORAGE
)

# ============================================================================
# MEDIA_URL: S3 бол S3 URL, үгүй бол local /media/
# ============================================================================
if USE_S3_STORAGE:
    if AWS_S3_CUSTOM_DOMAIN:
        MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/"
    else:
        MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/"
else:
    MEDIA_URL = '/media/'

if USE_S3_STORAGE and not AWS_STORAGE_BUCKET_NAME:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured("USE_S3_STORAGE=True requires AWS_STORAGE_BUCKET_NAME.")

if USE_S3_STORAGE and not AWS_S3_REGION_NAME:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured("USE_S3_STORAGE=True requires AWS_S3_REGION_NAME.")

# Django 4.2+ STORAGES формат (STATICFILES_STORAGE хуучирсан)
if USE_SFTP_STORAGE:
    DEFAULT_STORAGE_CONFIG = {
        "BACKEND": "storages.backends.sftpstorage.SFTPStorage",
        "OPTIONS": {},
    }
elif USE_S3_STORAGE:
    DEFAULT_STORAGE_CONFIG = {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    }
else:
    DEFAULT_STORAGE_CONFIG = {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
        "OPTIONS": {
            "location": MEDIA_ROOT,
            "base_url": MEDIA_URL,
        },
    }

STORAGES = {
    "default": DEFAULT_STORAGE_CONFIG,
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ============================================================================
# DJANGO REST FRAMEWORK
# ============================================================================
REST_FRAMEWORK = {
    # Pagination — бүх list endpoint автомат pagination-тай болно
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,

    # Rate limiting — DoS довтолгооноос хамгаалах
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/min',
        'user': '300/min',
        # Scoped throttles — endpoints that opt in via throttle_scope get a
        # much tighter budget than the general API default above. See
        # app/accounts/views.py (LoginView) and app/views/cv_application.py.
        'login': '10/min',
        'public-submit': '20/min',
    },

    # Auth — JWT (access/refresh, see SIMPLE_JWT below). Session/Basic auth are
    # intentionally NOT enabled here: the admin panel is a separate origin and
    # must never rely on browser session cookies sent to this API.
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],

    # Safe, global baseline permission: anonymous read (GET/HEAD/OPTIONS) stays
    # open — this API also serves the public bichilweb site — but ANY write
    # (POST/PUT/PATCH/DELETE) now requires a real authenticated user. This is
    # deliberately the ONLY class that is safe to apply globally across every
    # view style in this project (ModelViewSet, plain ViewSet, function-based
    # @api_view, APIView) without an AssertionError, since it needs no
    # queryset/model introspection. Endpoints that need finer-grained,
    # per-model role permission (DjangoModelPermissionsOrAnonReadOnly), a
    # staff-only-read/create rule, or a fully closed admin-only rule set their
    # own `permission_classes` explicitly — see app/accounts/permissions.py
    # and the per-view audit called out in each view file below.
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],

    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',

    # Both Next.js apps sit in front of this API as a same-origin BFF proxy
    # and make their own server-to-server request to Django — without this,
    # DRF's throttle/IP-logging code sees every visitor as the BFF's own
    # server IP (one shared bucket for the whole site) instead of the real
    # client.
    #
    # DRF's SimpleRateThrottle.get_ident() takes addrs[-NUM_PROXIES] from an
    # append-style X-Forwarded-For chain (each hop appends what it observed,
    # so the ORIGINAL client is leftmost and the hop closest to this server
    # is rightmost) — i.e. NUM_PROXIES must equal the number of *trusted*
    # hops between the real client and this Django process, counting from
    # this process backwards. With Render fronting both apps, the real chain
    # is: browser -> Render edge (in front of the Next.js BFF) -> BFF ->
    # Render edge (in front of Django) -> Django. That's 2 trusted hops,
    # PROVIDED the BFF forwards the X-Forwarded-For value it itself received
    # instead of dropping/replacing it (see bichilweb/src/app/api/proxy,
    # bichilweb_admin/src/lib/session.ts djangoFetch, and the admin login
    # route, all of which now do this).
    #
    # This assumes Render's edge appends X-Forwarded-For from the real TCP
    # connection rather than blindly relaying client-supplied values —
    # standard behavior for managed reverse proxies, but NOT verified against
    # live Render traffic in this review. Confirm the resolved IP in
    # request.META['HTTP_X_FORWARDED_FOR'] against a real request before
    # relying on this for anything beyond throttling/analytics, and adjust
    # this number if Render's actual topology differs (e.g. if internal
    # service-to-service calls skip the edge proxy).
    'NUM_PROXIES': 2,
}

# ============================================================================
# API DOCUMENTATION (drf-spectacular) — auto-generated from the viewsets and
# serializers themselves, so it can't go stale the way a hand-written API
# reference would. See /api/docs/ (Swagger UI), /api/redoc/, /api/schema/.
# ============================================================================
SPECTACULAR_SETTINGS = {
    'TITLE': 'Bichil Globus API',
    'DESCRIPTION': 'Public content, admin management, and auth/RBAC endpoints for bichilweb and bichilweb_admin.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# ============================================================================
# PASSWORD HASHING — bcrypt first, Django's defaults kept as fallback so any
# password hashed with a different algorithm (e.g. during a migration) still
# verifies; every *new* password set from here on is hashed with bcrypt.
# ============================================================================
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
]

# ============================================================================
# JWT (djangorestframework-simplejwt)
# ============================================================================
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    # Separate signing key from Django's general SECRET_KEY, which also signs
    # sessions, CSRF tokens, and password-reset links — a leak or algorithm-
    # confusion issue on any of those shouldn't also hand over the ability to
    # forge access tokens. Falls back to SECRET_KEY when JWT_SIGNING_KEY isn't
    # set so existing deployments keep working until the env var is added.
    'SIGNING_KEY': env("JWT_SIGNING_KEY", default=SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ============================================================================
# UPLOAD & MEDIA SETTINGS
# ============================================================================
# Файл upload хэмжээний хязгаар
DATA_UPLOAD_MAX_MEMORY_SIZE = 115343360   # 110MB — хүсэлтийн нийт хэмжээ
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760   # 10MB  — үүнээс том файл disk-д temp хадгална (OOM-с хамгаална)
# The actual allow-list + content-based (magic-byte) validation lives at
# FileUploadView.ALLOWED_MIME_TYPES (app/views/upload.py) and
# app/utils/file_validation.py — a FILE_UPLOAD_ALLOWED_MIME_TYPES Django
# setting used to live here but was never read by any view, so it was
# removed rather than left as a misleading dead control.

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# SSL/HTTPS enforcement. Required so request.is_secure() (and therefore the
# SECURE_SSL_REDIRECT/SESSION_COOKIE_SECURE checks below) resolve correctly
# behind Render's TLS-terminating edge proxy, which talks plain HTTP to this
# process and communicates the original scheme via X-Forwarded-Proto. Without
# this, enabling SECURE_SSL_REDIRECT behind such a proxy would redirect-loop
# forever (Django would always see the request as http:// and keep redirecting).
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Enabled automatically whenever DEBUG=False — i.e. any real deployment.
# Previously this whole block required a separate SECURE_SSL=True env var
# that isn't set in render.yaml, so a production deploy could silently run
# with no HTTPS redirect, no Secure cookie flag, and no HSTS unless someone
# remembered to set it by hand in the hosting dashboard. SECURE_SSL now only
# forces this on under DEBUG=True (e.g. testing HTTPS locally via a tunnel);
# it can no longer turn these protections off in production.
if not DEBUG or env.bool("SECURE_SSL", default=False):
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    # HSTS тохиргоо — HTTPS шаардах
    SECURE_HSTS_SECONDS = 31536000  # 1 жил
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "WARNING",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "level": "ERROR",
            "class": "logging.FileHandler",
            "filename": BASE_DIR / "errors.log",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "WARNING",
            "propagate": True,
        },
        "app": {
            "handlers": ["console", "file"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}
