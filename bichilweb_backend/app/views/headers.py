from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import Count
from app.models.models import Header
from app.serializers.headers import HeaderSerializer, HeaderCreateUpdateSerializer
import logging

from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
logger = logging.getLogger(__name__)

# ============================================================================
# HEADER VIEWSET
# ============================================================================
# GET  /api/v1/headers/       → Бүх header өгөгдлийг буцаана (menus + styles)
# POST /api/v1/headers/       → Шинэ header үүсгэх
# PUT  /api/v1/headers/{id}/  → Header шинэчлэх
# DELETE /api/v1/headers/{id}/ → Header устгах
# ============================================================================

# Өгөгдлийн сан холболт алдаа гарвал буцаах хоосон бүтэц
EMPTY_HEADER = {
    'id': None,
    'logo': '',
    'active': 1,
    'menus': [],
    'styles': []
}

class HeaderViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Header.objects.prefetch_related(
        'headerstyle_set',
        'menus__headermenutranslation_set__language',
        'menus__submenus__headersubmenutranslation_set__language',
        'menus__submenus__tertiary_menus__headertertiarymenutranslation_set__language',
        'menus__submenus__tertiary_menus__quaternary_menus__headerquaternarymenutranslation_set__language',
    ).all()
    pagination_class = None  # Header-д pagination хэрэггүй (ганц л header байдаг)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return HeaderCreateUpdateSerializer
        return HeaderSerializer

    def _get_primary_header(self):
        """
        Prefer the active header that actually has menu rows. This prevents an
        empty newly-created header from hiding the real menu data on production.
        """
        qs = self.get_queryset().annotate(menu_count=Count('menus', distinct=True))
        return (
            qs.filter(active=1, menu_count__gt=0).order_by('-menu_count', '-id').first()
            or qs.filter(menu_count__gt=0).order_by('-menu_count', '-id').first()
            or qs.filter(active=1).order_by('-id').first()
            or qs.order_by('-id').first()
        )

    def list(self, request, *args, **kwargs):
        """
        Өгөгдлийн сангаас header мэдээллийг буцаана.
        - Ганц Header (id=1) байдаг гэж үзнэ
        - menus болон styles-ийг nested JSON байдлаар буцаана
        - Алдаа гарвал хоосон бүтэц буцаана (500 биш!)
        - prefetch_related ашиглах үүднээс self.get_queryset() дуудна
        """
        try:
            # prefetch_related queryset ашиглаж N+1 query-г арилгана
            header = self._get_primary_header()

            if not header:
                return Response([EMPTY_HEADER])

            serializer = self.get_serializer(header)
            # ⚠️ serializer.data-г ЭНД evaluate хийх ёстой (try блок дотор)
            # Хэрвээ DB баганы алдаа (max_width, logo_size г.м.) байвал энд барина
            result_data = serializer.data
            return Response([result_data])

        except Exception as e:
            logger.exception('Header list алдаа: %s', e)
            # Алдаа гарсан ч хоосон бүтэц буцааж 500 гаргахгүй
            return Response([EMPTY_HEADER])

    def retrieve(self, request, *args, **kwargs):
        """
        Нэг header-ийн мэдээллийг буцаана.
        GET /api/v1/headers/{id}/
        """
        try:
            header = self.get_object()
            serializer = self.get_serializer(header)
            result_data = serializer.data
            return Response(result_data)
        except Exception as e:
            logger.exception('Header retrieve алдаа: %s', e)
            return Response(EMPTY_HEADER)

    def destroy(self, request, *args, **kwargs):
        header = self.get_object()
        header.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
