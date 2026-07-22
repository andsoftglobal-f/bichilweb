from rest_framework import viewsets
from app.models.models import ManagementCategory
from app.mgmt_category.serializers import ManagementCategoryReadSerializer, ManagementCategoryWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class ManagementCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ManagementCategory.objects.all().prefetch_related(
        'managementcategorytranslations_set',
        'managementcategorytranslations_set__language',
    ).order_by('sort_order', 'id')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ManagementCategoryReadSerializer
        return ManagementCategoryWriteSerializer
