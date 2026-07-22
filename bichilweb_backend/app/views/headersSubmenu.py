from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import connection
from app.models.models import HeaderSubmenu
from app.serializers.headersSubmenu import HeaderSubmenuSerializer
import logging

from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
logger = logging.getLogger(__name__)

class HeaderSubmenuViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = HeaderSubmenu.objects.all()
    serializer_class = HeaderSubmenuSerializer
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        menu_id = self.request.query_params.get('menu_id')
        if menu_id:
            qs = qs.filter(header_menu_id=menu_id)
        return qs

    def destroy(self, request, *args, **kwargs):
        """
        Delete a single submenu with tertiary menus and all translations.
        Uses raw SQL to avoid IntegrityError on legacy PostgreSQL without CASCADE.
        """
        instance = self.get_object()
        sub_id = instance.id
        try:
            with connection.cursor() as cursor:
                # 1. Tertiary menu translations
                cursor.execute("""
                    DELETE FROM header_tertiary_menu_translation
                    WHERE tertiary_menu IN (
                        SELECT id FROM header_tertiary_menu WHERE header_submenu = %s
                    )
                """, [sub_id])
                # 2. Tertiary menus
                cursor.execute("DELETE FROM header_tertiary_menu WHERE header_submenu = %s", [sub_id])
                # 3. Submenu translations
                cursor.execute("DELETE FROM header_submenu_translation WHERE submenu = %s", [sub_id])
                # 4. Submenu itself
                cursor.execute("DELETE FROM header_submenu WHERE id = %s", [sub_id])

            logger.info('Deleted submenu %s with all children', sub_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error('Submenu destroy error for id %s: %s', sub_id, e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
