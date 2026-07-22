from rest_framework import viewsets
from app.models.models import AppDownloadList
from app.serializers.appDownloadList import AppDownloadListSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class AppDownloadListViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = AppDownloadList.objects.all()
    serializer_class = AppDownloadListSerializer
