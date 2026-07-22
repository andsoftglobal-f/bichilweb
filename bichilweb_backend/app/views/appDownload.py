from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
"""
App Download CRUD view.
Зургийг хадгалаад, устгахад устгана.
"""
import re
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.conf import settings

from app.models.models import AppDownload, AppDownloadTitle, AppDownloadList
from app.serializers.appDownload import AppDownloadReadSerializer, AppDownloadWriteSerializer
from app.utils.storage import upload_file, delete_file

class AppDownloadViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = AppDownload.objects.prefetch_related('titles', 'lists').all()
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return AppDownloadReadSerializer
        return AppDownloadWriteSerializer

    # ─── Storage helper: upload ────────────────────────────────
    def _upload_file(self, file_obj):
        """Зургийг upload хийнэ. URL буцаана."""
        return upload_file(file_obj, folder='bichil/app_download', resource_type='image')

    # ─── Storage helper: delete ────────────────────────────────
    def _delete_file(self, url):
        """Файл устгах."""
        delete_file(url)

    # ─── CREATE ───────────────────────────────────────────────────
    def create(self, request, *args, **kwargs):
        # Нэг л бичлэг байх ёстой — аль хэдийн байвал update руу чиглүүлнэ
        existing = AppDownload.objects.first()
        if existing:
            kwargs['pk'] = existing.pk
            return self.update(request, *args, **kwargs)

        data = request.data.copy()
        image_file = request.FILES.get('image_file')

        try:
            if image_file:
                file_url = self._upload_file(image_file)
                data['image'] = file_url
        except Exception as e:
            return Response(
                {'detail': f'Storage upload алдаа: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = self.get_serializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        read_serializer = AppDownloadReadSerializer(serializer.instance)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    # ─── UPDATE ───────────────────────────────────────────────────
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        image_file = request.FILES.get('image_file')

        try:
            if image_file:
                self._delete_file(instance.image)
                file_url = self._upload_file(image_file)
                data['image'] = file_url
        except Exception as e:
            return Response(
                {'detail': f'Storage upload алдаа: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = self.get_serializer(instance, data=data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        read_serializer = AppDownloadReadSerializer(serializer.instance)
        return Response(read_serializer.data)

    # ─── DELETE ───────────────────────────────────────────────────
    def destroy(self, request, *args, **kwargs):
        """Устгахад storage дээрх зургийг мөн устгана."""
        instance = self.get_object()
        self._delete_file(instance.image)

        AppDownloadTitle.objects.filter(app_download=instance).delete()
        AppDownloadList.objects.filter(app_download=instance).delete()

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
