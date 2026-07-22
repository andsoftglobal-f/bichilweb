from rest_framework import viewsets
from rest_framework.response import Response
from app.models.models import OrgStructure
from app.orgstructure.serializers import OrgStructureSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class OrgStructureViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = OrgStructure.objects.all()
    serializer_class = OrgStructureSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        page = self.request.query_params.get('page')
        if page:
            qs = qs.filter(page_id=page)
        return qs
