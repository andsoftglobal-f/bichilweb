from rest_framework import viewsets
from app.models.models import ExchangeRateConfig
from app.exchangerate.serializers import ExchangeRateConfigSerializer, ExchangeRateConfigWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class ExchangeRateConfigViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ExchangeRateConfig.objects.all().order_by('id')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ExchangeRateConfigSerializer
        return ExchangeRateConfigWriteSerializer
