from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import connection
from app.models.models import HeaderQuaternaryMenu
from app.serializers.headersQuaternaryMenu import HeaderQuaternaryMenuSerializer
import logging

from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
logger = logging.getLogger(__name__)

class HeaderQuaternaryMenuViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = HeaderQuaternaryMenu.objects.all()
    serializer_class = HeaderQuaternaryMenuSerializer
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        tertiary_id = self.request.query_params.get('tertiary_id')
        if tertiary_id:
            qs = qs.filter(header_tertiary_id=tertiary_id)
        return qs

    def destroy(self, request, *args, **kwargs):
        """
        Delete a single quaternary menu with its translations.
        Uses raw SQL to avoid IntegrityError on legacy PostgreSQL without CASCADE.
        """
        instance = self.get_object()
        quat_id = instance.id
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM header_quaternary_menu_translation WHERE quaternary_menu = %s", [quat_id])
                cursor.execute("DELETE FROM header_quaternary_menu WHERE id = %s", [quat_id])

            logger.info('Deleted quaternary menu %s', quat_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error('Quaternary menu destroy error for id %s: %s', quat_id, e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
