from rest_framework import viewsets
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
from app.models.models import StatItem
from app.serializers.statItem import StatItemSerializer


class StatItemViewSet(viewsets.ModelViewSet):
    queryset = StatItem.objects.all().order_by('index', 'id')
    serializer_class = StatItemSerializer
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
