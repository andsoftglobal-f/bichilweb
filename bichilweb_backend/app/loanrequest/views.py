from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from app.models.models import LoanRequest, LoanRequestPage
from app.loanrequest.serializers import LoanRequestWriteSerializer, LoanRequestReadSerializer, LoanRequestPageSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
from app.accounts.permissions import PublicCreateStaffManage

class LoanRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [PublicCreateStaffManage]
    queryset = LoanRequest.objects.select_related('product').prefetch_related(
        'product__producttranslations_set'
    ).all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return LoanRequestReadSerializer
        return LoanRequestWriteSerializer

    def get_throttles(self):
        # Only the anonymous, public 'create' action gets the tighter
        # 'public-submit' budget — staff list/retrieve/update stay on the
        # normal authenticated-user rate.
        if self.action == 'create':
            self.throttle_scope = 'public-submit'
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        read_serializer = LoanRequestReadSerializer(instance)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

class LoanRequestPageViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = LoanRequestPage.objects.all()
    serializer_class = LoanRequestPageSerializer

    def list(self, request, *args, **kwargs):
        instance = LoanRequestPage.objects.first()
        if not instance:
            instance = LoanRequestPage.objects.create()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        instance = LoanRequestPage.objects.first()
        if instance:
            serializer = self.get_serializer(instance, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
