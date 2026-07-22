from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from app.models.models import Advertisement, AdConfig
from app.serializers.advertisement import AdvertisementSerializer, AdConfigSerializer
from app.utils.storage import upload_file, delete_file
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class AdvertisementViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Advertisement.objects.all().order_by('index', 'id')
    serializer_class = AdvertisementSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _upload_image(self, file_obj):
        return upload_file(file_obj, folder='bichil/ads', resource_type='image')

    def _delete_image(self, url):
        if url:
            delete_file(url)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        image_file = request.FILES.get('image_file')

        try:
            if image_file:
                data['image'] = self._upload_image(image_file)
        except Exception as e:
            return Response(
                {'detail': f'Upload алдаа: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        image_file = request.FILES.get('image_file')

        try:
            if image_file:
                self._delete_image(instance.image)
                data['image'] = self._upload_image(image_file)
        except Exception as e:
            return Response(
                {'detail': f'Upload алдаа: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self._delete_image(instance.image)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='config')
    def config(self, request):
        """GET / PUT  /api/v1/advertisements/config/"""
        obj, _ = AdConfig.objects.get_or_create(pk=1, defaults={'interval_seconds': 60})
        if request.method == 'GET':
            return Response(AdConfigSerializer(obj).data)
        serializer = AdConfigSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
