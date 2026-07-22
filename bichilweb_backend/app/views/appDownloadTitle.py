from rest_framework import viewsets
from app.models.models import AppDownloadTitle
from app.serializers.appDownloadTitle import AppDownloadTitleSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class AppDownloadTitleViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = AppDownloadTitle.objects.all()
    serializer_class = AppDownloadTitleSerializer
