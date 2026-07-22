from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
"""
Hero Slider CRUD view.
Зураг/видеог хадгалаад, устгахад устгана.
"""
import re
import mimetypes
from rest_framework.viewsets import ModelViewSet
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from app.models.models import HeroSlider
from app.serializers.heroSlider import HeroSliderSerializer
from app.utils.storage import upload_file, upload_large_file, delete_file

class HeroSliderViewSet(ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = HeroSlider.objects.all()
    serializer_class = HeroSliderSerializer
    parser_classes = [MultiPartParser, FormParser]

    # Видео хамгийн их хэмжээ (300MB)
    MAX_VIDEO_SIZE = 300 * 1024 * 1024  # 300MB

    # ─── Storage helper: upload ────────────────────────────────
    def _upload_file(self, file_obj, device='desktop'):
        """
        Файлыг upload хийнэ.
        device: 'desktop' | 'tablet' | 'mobile' — folder ялгах
        Буцаах: URL (string)
        """
        mime_type, _ = mimetypes.guess_type(file_obj.name)
        if not mime_type:
            mime_type = file_obj.content_type or 'application/octet-stream'

        is_video = mime_type.startswith('video/')
        resource_type = 'video' if is_video else 'image'

        # Видео хэмжээ шалгах
        if is_video and hasattr(file_obj, 'size') and file_obj.size > self.MAX_VIDEO_SIZE:
            raise ValueError(
                f'Видео хэт том байна ({file_obj.size / (1024*1024):.1f}MB). '
                f'Хамгийн ихдээ {self.MAX_VIDEO_SIZE / (1024*1024):.0f}MB (~2 мин) байх ёстой.'
            )

        folder = f"bichil/hero_slider/{device}"

        if is_video:
            return upload_large_file(file_obj, folder=folder, resource_type=resource_type)
        else:
            return upload_file(file_obj, folder=folder, resource_type=resource_type)

    # ─── Storage helper: delete ────────────────────────────────
    def _delete_file(self, url):
        """Файл устгах (storage)."""
        delete_file(url)

    # ─── CREATE ───────────────────────────────────────────────────
    def create(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        tablet_file = request.FILES.get('tablet_file')
        mobile_file = request.FILES.get('mobile_file')
        data = request.data.copy()

        try:
            if file:
                data['file'] = self._upload_file(file, 'desktop')
            if tablet_file:
                data['tablet_file'] = self._upload_file(tablet_file, 'tablet')
            if mobile_file:
                data['mobile_file'] = self._upload_file(mobile_file, 'mobile')
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'detail': f'Storage upload алдаа: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # ─── UPDATE ───────────────────────────────────────────────────
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        file = request.FILES.get('file')
        tablet_file = request.FILES.get('tablet_file')
        mobile_file = request.FILES.get('mobile_file')

        data = request.data.copy()

        try:
            # Desktop файл — шинэ upload байвал хуучныг устгаад шинийг хадгалах
            if file:
                self._delete_file(instance.file)
                data['file'] = self._upload_file(file, 'desktop')
            else:
                data['file'] = instance.file

            # Tablet файл
            if tablet_file:
                self._delete_file(instance.tablet_file)
                data['tablet_file'] = self._upload_file(tablet_file, 'tablet')
            else:
                data['tablet_file'] = instance.tablet_file or ''

            # Mobile файл
            if mobile_file:
                self._delete_file(instance.mobile_file)
                data['mobile_file'] = self._upload_file(mobile_file, 'mobile')
            else:
                data['mobile_file'] = instance.mobile_file or ''
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'detail': f'Storage upload алдаа: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Handle type fields
        if 'tablet_type' not in data:
            data['tablet_type'] = instance.tablet_type or 'i'
        if 'mobile_type' not in data:
            data['mobile_type'] = instance.mobile_type or 'i'

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    # ─── DELETE ───────────────────────────────────────────────────
    def destroy(self, request, *args, **kwargs):
        """Slider устгахад storage дээрх файлуудыг мөн устгана."""
        instance = self.get_object()

        # Бүх device-н файлуудыг storage-с устгах
        self._delete_file(instance.file)
        self._delete_file(instance.tablet_file)
        self._delete_file(instance.mobile_file)

        # DB-с устгах
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
