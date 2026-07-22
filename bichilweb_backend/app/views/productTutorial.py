from rest_framework import viewsets
from rest_framework.parsers import JSONParser
from app.models.models import ProductTutorial
from app.serializers.productTutorial import ProductTutorialSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class ProductTutorialViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ProductTutorial.objects.filter(active=True).order_by('index', 'id')
    serializer_class = ProductTutorialSerializer
    parser_classes = [JSONParser]

    def get_queryset(self):
        # Admin gets all (including inactive); public gets only active
        if self.request.query_params.get('all') == '1':
            return ProductTutorial.objects.all().order_by('index', 'id')
        return ProductTutorial.objects.filter(active=True).order_by('index', 'id')
