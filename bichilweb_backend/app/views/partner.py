from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
from rest_framework.response import Response

from app.accounts.permissions import ReadOnlyOrAuthenticated
from app.models.models import Partner, PartnerSectionConfig
from app.serializers.partner import PartnerSerializer, PartnerSectionConfigSerializer
from app.utils.storage import upload_file, delete_file


class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all().order_by('index', 'id')
    serializer_class = PartnerSerializer
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _upload_logo(self, file_obj):
        return upload_file(file_obj, folder='bichil/partners', resource_type='image')

    def _delete_logo(self, url):
        delete_file(url)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        logo_file = request.FILES.get('logo_file')

        try:
            if logo_file:
                file_url = self._upload_logo(logo_file)
                data['logo'] = file_url
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
        logo_file = request.FILES.get('logo_file')

        try:
            if logo_file:
                if instance.logo:
                    self._delete_logo(instance.logo)
                file_url = self._upload_logo(logo_file)
                data['logo'] = file_url
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
        if instance.logo:
            self._delete_logo(instance.logo)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PartnerSectionConfigViewSet(viewsets.ViewSet):
    permission_classes = [ReadOnlyOrAuthenticated]
    parser_classes = [JSONParser]

    def list(self, request):
        obj, _ = PartnerSectionConfig.objects.get_or_create(pk=1)
        return Response(PartnerSectionConfigSerializer(obj).data)

    @action(detail=False, methods=['put', 'patch'], url_path='update')
    def update_config(self, request):
        obj, _ = PartnerSectionConfig.objects.get_or_create(pk=1)
        serializer = PartnerSectionConfigSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
