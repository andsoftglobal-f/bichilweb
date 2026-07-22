"""
Unified file upload/delete helpers.

Storage is handled by Django default_storage, which can be S3, SFTP, or
local FileSystemStorage depending on settings.py.
"""
import logging
import os
import posixpath
import re
import uuid
from urllib.parse import unquote, urlparse

from django.conf import settings
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)


def _clean_folder(folder):
    value = str(folder or "uploads").replace("\\", "/").strip("/")
    parts = []
    for part in value.split("/"):
        clean = re.sub(r"[^A-Za-z0-9_.-]+", "-", part.strip()).strip(".-")
        if clean:
            parts.append(clean)
    return "/".join(parts) or "uploads"


def _safe_extension(file_obj):
    name = getattr(file_obj, "name", "") or ""
    _, ext = os.path.splitext(name)
    return re.sub(r"[^A-Za-z0-9.]+", "", ext.lower())


def _media_url(storage_path):
    media_url = getattr(settings, "MEDIA_URL", "/media/")
    return f"{media_url.rstrip('/')}/{storage_path.lstrip('/')}"


def _storage_path_from_url(url_or_path):
    if not url_or_path:
        return ""

    value = str(url_or_path).strip().replace("\\", "/")
    parsed = urlparse(value)
    path = unquote(parsed.path if parsed.scheme else value)
    media_path = urlparse(getattr(settings, "MEDIA_URL", "/media/")).path or "/media/"

    for prefix in (media_path, "/media/", "media/"):
        normalized = prefix if prefix.endswith("/") else f"{prefix}/"
        if path.startswith(normalized):
            return path[len(normalized):].lstrip("/")

    bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "")
    if parsed.scheme and bucket:
        path_without_slash = path.lstrip("/")
        bucket_prefix = f"{bucket}/"
        if path_without_slash.startswith(bucket_prefix):
            return path_without_slash[len(bucket_prefix):]

    return path.lstrip("/")


def _save_to_default_storage(file_obj, folder, return_path=False):
    folder = _clean_folder(folder)
    filename = f"{uuid.uuid4().hex}{_safe_extension(file_obj)}"
    storage_path = posixpath.join(folder, filename)

    if hasattr(file_obj, "seek"):
        try:
            file_obj.seek(0)
        except Exception:
            pass

    saved_path = default_storage.save(storage_path, file_obj)
    if return_path:
        return saved_path

    try:
        return default_storage.url(saved_path)
    except Exception:
        return _media_url(saved_path)


def upload_file(file_obj, folder="uploads", resource_type="image", force_local=False, **kwargs):
    """
    Upload a file and return its public URL by default.

    Pass return_path=True when the DB field intentionally stores a storage path
    instead of a URL.
    """
    return_path = bool(kwargs.pop("return_path", False))

    return _save_to_default_storage(file_obj, folder, return_path=return_path)


def upload_large_file(file_obj, folder="uploads", resource_type="video", force_local=False, **kwargs):
    """Upload a large file through the configured default storage backend."""
    return upload_file(file_obj, folder=folder, resource_type=resource_type, force_local=force_local, **kwargs)


def delete_file(url_or_path, resource_type="image"):
    """Delete a default_storage path or URL."""
    if not url_or_path:
        return

    value = str(url_or_path)

    storage_path = _storage_path_from_url(value)
    if not storage_path:
        return

    try:
        if default_storage.exists(storage_path):
            default_storage.delete(storage_path)
    except Exception as exc:
        logger.warning("[storage] Delete error for %s: %s", storage_path, exc)
