from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from app.models.models import Category, ProductType, Product
from app.categories.serializers.read import CategoryReadSerializer
from app.categories.serializers.write import CategoryWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Category.objects.all().prefetch_related(
        'categorytranslations_set',
        'categorytranslations_set__language',
        'producttype_set',
        'producttype_set__producttypetranslations_set',
        'producttype_set__producttypetranslations_set__language',
        'producttype_set__product_set',
        'producttype_set__product_set__producttranslations_set',
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return CategoryReadSerializer
        return CategoryWriteSerializer

    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        """
        Accepts: { categories: [{id, sort_order}], product_types: [{id, sort_order}], products: [{id, sort_order}] }
        """
        categories = request.data.get('categories', [])
        product_types = request.data.get('product_types', [])
        products = request.data.get('products', [])

        for item in categories:
            Category.objects.filter(id=item['id']).update(sort_order=item['sort_order'])
        for item in product_types:
            ProductType.objects.filter(id=item['id']).update(sort_order=item['sort_order'])
        for item in products:
            Product.objects.filter(id=item['id']).update(sort_order=item['sort_order'])

        return Response({'status': 'ok'})
