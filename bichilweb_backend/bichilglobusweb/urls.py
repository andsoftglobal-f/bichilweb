import re

from django.contrib import admin
from django.urls import path, re_path, include
from django.views.static import serve as static_serve
from app.categories.urls import router
from app.product.urls import router as product_router
from app.utilities.urls import router as document_router
from app.services.urls import router as service_router
from app.news.urls import router as news_router, extra_urlpatterns as news_extra_urls
from app.management.urls import router as management_router
from app.aboutpage.urls import router as aboutpage_router
from app.corevalue.urls import router as corevalue_router
from app.timeline.urls import router as timeline_router
from app.mgmt_category.urls import router as mgmt_category_router
from app.orgstructure.urls import router as orgstructure_router
from app.aboutbanner.urls import router as aboutbanner_router
from app.calculator.urls import router as calculator_router
from app.exchangerate.urls import router as exchangerate_router
from app.about_category.urls import router as about_category_router
from app.analytics import urls as analytics_urls
from app.loanrequest.urls import router as loanrequest_router
from app.accounts.urls import router as accounts_router, auth_urlpatterns
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


def healthz(_request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('healthz/', healthz),
    path('admin/', admin.site.urls),
    path('api/v1/', include('app.urls')),
    path('api/v1/', include(router.urls)),
    path('api/v1/', include(product_router.urls)),
    path('api/v1/', include(document_router.urls)),
    path('api/v1/', include(service_router.urls)),
    path('api/v1/', include(news_router.urls)),
    path('api/v1/', include(news_extra_urls)),
    path('api/v1/', include(management_router.urls)),
    path('api/v1/', include(aboutpage_router.urls)),
    path('api/v1/', include(corevalue_router.urls)),
    path('api/v1/', include(timeline_router.urls)),
    path('api/v1/', include(mgmt_category_router.urls)),
    path('api/v1/', include(orgstructure_router.urls)),
    path('api/v1/', include(aboutbanner_router.urls)),
    path('api/v1/', include(calculator_router.urls)),
    path('api/v1/', include(exchangerate_router.urls)),
    path('api/v1/', include(about_category_router.urls)),
    path('api/v1/', include(analytics_urls)),
    path('api/v1/', include(loanrequest_router.urls)),
    path('api/v1/', include(accounts_router.urls)),
    path('api/v1/', include(auth_urlpatterns)),

    # API documentation — auto-generated from the viewsets/serializers, see
    # SPECTACULAR_SETTINGS in settings.py.
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Зураг, видео нуу MEDIA файлуудыг хадгалах
# Development дээр ажиллана — Django's static() is a documented no-op
# whenever DEBUG=False, so it contributes nothing in production.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Production fallback for local-disk media storage. render.yaml provisions a
# persistent disk for /media and never configures USE_S3_STORAGE — i.e. the
# committed deployment IS local FileSystemStorage — so without an explicit,
# always-on route here, static() above being DEBUG-gated means every
# uploaded file 404s in production. Only registered when local storage is
# actually in play: S3 serves media from its own domain directly (never
# touches this app), and SFTP storage already has its own always-on route
# via SFTPMediaMiddleware (app/sftp_middleware.py). django.views.static.serve
# is the same view static() itself uses — not introducing a new pattern,
# just removing the DEBUG gate for the one storage mode this deployment
# actually uses; Django's own path-traversal protection in `serve` applies
# here exactly as it does in development.
if not settings.DEBUG and not settings.USE_S3_STORAGE and not settings.USE_SFTP_STORAGE:
    urlpatterns += [
        re_path(
            r'^%s(?P<path>.*)$' % re.escape(settings.MEDIA_URL.lstrip('/')),
            static_serve,
            {'document_root': settings.MEDIA_ROOT},
        ),
    ]
