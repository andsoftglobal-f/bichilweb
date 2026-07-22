from rest_framework import viewsets
from app.models.models import Footer
from app.serializers.footer import FooterSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class FooterViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Footer.objects.all()
    serializer_class = FooterSerializer

    def get_queryset(self):
        user = self.request.user
        return Footer.objects.all()  
