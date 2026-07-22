from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import connection
from app.models.models import HeaderTertiaryMenu
from app.serializers.headersTertiaryMenu import HeaderTertiaryMenuSerializer
import logging

from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
logger = logging.getLogger(__name__)

class HeaderTertiaryMenuViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = HeaderTertiaryMenu.objects.all()
    serializer_class = HeaderTertiaryMenuSerializer
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        submenu_id = self.request.query_params.get('submenu_id')
        if submenu_id:
            qs = qs.filter(header_submenu_id=submenu_id)
        return qs

    def destroy(self, request, *args, **kwargs):
        """
        Delete a single tertiary menu with its translations.
        Uses raw SQL to avoid IntegrityError on legacy PostgreSQL without CASCADE.
        """
        instance = self.get_object()
        ter_id = instance.id
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM header_tertiary_menu_translation WHERE tertiary_menu = %s", [ter_id])
                cursor.execute("DELETE FROM header_tertiary_menu WHERE id = %s", [ter_id])

            logger.info('Deleted tertiary menu %s', ter_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error('Tertiary menu destroy error for id %s: %s', ter_id, e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
