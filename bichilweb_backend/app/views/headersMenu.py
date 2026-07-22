from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connection
from django.db.models import Q
from app.models.models import HeaderMenu
from app.serializers.headersMenu import HeaderMenuSerializer
import logging

from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
logger = logging.getLogger(__name__)

class HeaderMenuViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = HeaderMenu.objects.all()
    serializer_class = HeaderMenuSerializer
    pagination_class = None
    
    def get_queryset(self):
        """
        Filter HeaderMenu objects by header_id if provided in query params.
        Usage: GET /api/v1/header-menu/?header_id=1
        """
        queryset = HeaderMenu.objects.all()
        header_id = self.request.query_params.get('header_id')
        
        if header_id:
            try:
                queryset = queryset.filter(header_id=int(header_id))
            except (ValueError, TypeError):
                pass
        
        return queryset

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """
        Delete all menus for a given header_id.
        Uses raw SQL to delete in correct dependency order because the legacy
        PostgreSQL database may not have ON DELETE CASCADE on FK constraints.
        """
        header_id = request.query_params.get('header_id')
        if not header_id:
            return Response({'error': 'header_id required'}, status=status.HTTP_400_BAD_REQUEST)

        hid = int(header_id)
        try:
            with connection.cursor() as cursor:
                # 1. Delete tertiary menu translations
                cursor.execute("""
                    DELETE FROM header_tertiary_menu_translation
                    WHERE tertiary_menu IN (
                        SELECT htm.id FROM header_tertiary_menu htm
                        JOIN header_submenu hs ON htm.header_submenu = hs.id
                        JOIN header_menu hm ON hs.header_menu = hm.id
                        WHERE hm.header = %s
                    )
                """, [hid])
                logger.info('Deleted tertiary translations for header %s', hid)

                # 2. Delete tertiary menus
                cursor.execute("""
                    DELETE FROM header_tertiary_menu
                    WHERE header_submenu IN (
                        SELECT hs.id FROM header_submenu hs
                        JOIN header_menu hm ON hs.header_menu = hm.id
                        WHERE hm.header = %s
                    )
                """, [hid])
                logger.info('Deleted tertiary menus for header %s', hid)

                # 3. Delete submenu translations
                cursor.execute("""
                    DELETE FROM header_submenu_translation
                    WHERE submenu IN (
                        SELECT hs.id FROM header_submenu hs
                        JOIN header_menu hm ON hs.header_menu = hm.id
                        WHERE hm.header = %s
                    )
                """, [hid])
                logger.info('Deleted submenu translations for header %s', hid)

                # 4. Delete submenus
                cursor.execute("""
                    DELETE FROM header_submenu
                    WHERE header_menu IN (
                        SELECT hm.id FROM header_menu hm WHERE hm.header = %s
                    )
                """, [hid])
                logger.info('Deleted submenus for header %s', hid)

                # 5. Delete menu translations
                cursor.execute("""
                    DELETE FROM header_menu_translation
                    WHERE menu IN (
                        SELECT hm.id FROM header_menu hm WHERE hm.header = %s
                    )
                """, [hid])
                logger.info('Deleted menu translations for header %s', hid)

                # 6. Delete menus themselves
                cursor.execute("DELETE FROM header_menu WHERE header = %s", [hid])
                deleted_count = cursor.rowcount
                logger.info('Deleted %d menus for header %s', deleted_count, hid)

            return Response({'deleted': deleted_count}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error('bulk_delete error for header %s: %s', hid, e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a single menu with all submenus, tertiary menus and translations.
        Uses raw SQL to avoid IntegrityError on legacy PostgreSQL without CASCADE.
        """
        instance = self.get_object()
        menu_id = instance.id
        try:
            with connection.cursor() as cursor:
                # 1. Tertiary menu translations
                cursor.execute("""
                    DELETE FROM header_tertiary_menu_translation
                    WHERE tertiary_menu IN (
                        SELECT htm.id FROM header_tertiary_menu htm
                        JOIN header_submenu hs ON htm.header_submenu = hs.id
                        WHERE hs.header_menu = %s
                    )
                """, [menu_id])
                # 2. Tertiary menus
                cursor.execute("""
                    DELETE FROM header_tertiary_menu
                    WHERE header_submenu IN (
                        SELECT hs.id FROM header_submenu hs WHERE hs.header_menu = %s
                    )
                """, [menu_id])
                # 3. Submenu translations
                cursor.execute("""
                    DELETE FROM header_submenu_translation
                    WHERE submenu IN (
                        SELECT hs.id FROM header_submenu hs WHERE hs.header_menu = %s
                    )
                """, [menu_id])
                # 4. Submenus
                cursor.execute("DELETE FROM header_submenu WHERE header_menu = %s", [menu_id])
                # 5. Menu translations
                cursor.execute("DELETE FROM header_menu_translation WHERE menu = %s", [menu_id])
                # 6. Menu itself
                cursor.execute("DELETE FROM header_menu WHERE id = %s", [menu_id])

            logger.info('Deleted menu %s with all children', menu_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error('Menu destroy error for id %s: %s', menu_id, e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
