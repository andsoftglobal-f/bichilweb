from rest_framework import viewsets, filters
from app.models.models import HeaderStyle
from app.serializers.headerStyle import HeaderStyleSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class HeaderStyleViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = HeaderStyle.objects.all()
    serializer_class = HeaderStyleSerializer
    pagination_class = None

