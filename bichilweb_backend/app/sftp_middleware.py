import logging
import mimetypes
import os
import posixpath
from urllib.parse import unquote, urlparse

from django.conf import settings
from django.core.files.storage import default_storage
from django.http import FileResponse

logger = logging.getLogger(__name__)


class SFTPMediaMiddleware:
    """Serve /media/* files from the configured SFTP default storage."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if getattr(settings, "USE_SFTP_STORAGE", False) and request.method in {"GET", "HEAD"}:
            response = self._serve_media(request)
            if response is not None:
                return response

        return self.get_response(request)

    def _serve_media(self, request):
        media_url = getattr(settings, "MEDIA_URL", "/media/")
        media_prefix = urlparse(media_url).path or "/media/"
        request_path = unquote(urlparse(request.get_full_path()).path)

        if not media_prefix.endswith("/"):
            media_prefix = f"{media_prefix}/"
        if not request_path.startswith(media_prefix):
            return None

        storage_path = request_path[len(media_prefix):].lstrip("/")
        if not storage_path:
            return None

        # Reject path traversal — a naive startswith() prefix check on the
        # raw request path (above) says nothing about '..' segments *after*
        # the prefix, so without this a request like /media/../../etc/passwd
        # would be handed straight to default_storage.open() as-is.
        normalized = posixpath.normpath(storage_path)
        if normalized in (".", "..") or normalized.startswith("../") or normalized.startswith("/"):
            logger.warning("[sftp-media] Rejected path traversal attempt: %s", request_path)
            return None
        storage_path = normalized

        try:
            if not default_storage.exists(storage_path):
                return None

            content_type, _ = mimetypes.guess_type(storage_path)
            file_obj = default_storage.open(storage_path, "rb")
            response = FileResponse(file_obj, content_type=content_type or "application/octet-stream")
            response["Content-Disposition"] = f'inline; filename="{os.path.basename(storage_path)}"'
            return response
        except Exception as exc:
            logger.warning("[sftp-media] Failed to serve %s: %s", storage_path, exc)
            return None
