import hashlib

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse


class PublicApiCacheMiddleware:
    """
    Lightweight cache for public API GET responses.

    Admin writes clear the cache so freshly saved content appears on the site
    without waiting for the timeout.

    SECURITY: this cache is keyed only on path + query string, with no
    awareness of *who* is asking — so it must never store (or serve) a
    response that was produced for an authenticated request. Every
    authenticated call in this project (JWT via the Authorization header —
    see JWTAuthentication in REST_FRAMEWORK) is bypassed entirely, both on
    read and write, so one user's private/permissioned response can never be
    cached and replayed to a different, possibly anonymous, requester.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.timeout = getattr(settings, "PUBLIC_API_CACHE_TIMEOUT", 600)

    def __call__(self, request):
        if not request.path.startswith("/api/v1/"):
            return self.get_response(request)

        if self._is_authenticated_request(request):
            return self.get_response(request)

        if request.method != "GET":
            response = self.get_response(request)
            if response.status_code < 500:
                cache.clear()
            return response

        cache_key = self._cache_key(request)
        cached = cache.get(cache_key)
        if cached is not None:
            status_code, content_type, content = cached
            response = HttpResponse(content, status=status_code, content_type=content_type)
            response["X-Public-Api-Cache"] = "HIT"
            return response

        response = self.get_response(request)
        content_type = response.get("Content-Type", "")

        if (
            response.status_code == 200
            and "application/json" in content_type
            and hasattr(response, "content")
        ):
            cache.set(
                cache_key,
                (response.status_code, content_type, bytes(response.content)),
                self.timeout,
            )
            response["X-Public-Api-Cache"] = "MISS"

        return response

    @staticmethod
    def _cache_key(request):
        raw_key = f"{request.path}?{request.META.get('QUERY_STRING', '')}"
        digest = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
        return f"public_api:{digest}"

    @staticmethod
    def _is_authenticated_request(request):
        # Any bearer/credentialed request — this project never uses cookies
        # or sessions against the Django API, only the Authorization header,
        # so its presence unambiguously means "this response is private."
        return bool(request.META.get("HTTP_AUTHORIZATION"))
