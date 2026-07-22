from rest_framework import viewsets
from rest_framework.response import Response
from app.models.models import LoanCalculatorConfig
from app.calculator.serializers import LoanCalculatorConfigSerializer, LoanCalculatorConfigWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class LoanCalculatorConfigViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = LoanCalculatorConfig.objects.all().order_by('id')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return LoanCalculatorConfigSerializer
        return LoanCalculatorConfigWriteSerializer

    def list(self, request, *args, **kwargs):
        instance = LoanCalculatorConfig.objects.first()
        if not instance:
            instance = LoanCalculatorConfig.objects.create()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        instance = LoanCalculatorConfig.objects.first()
        if instance:
            serializer = LoanCalculatorConfigWriteSerializer(instance, data=request.data, partial=True)
        else:
            serializer = LoanCalculatorConfigWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(LoanCalculatorConfigSerializer(serializer.instance).data)
