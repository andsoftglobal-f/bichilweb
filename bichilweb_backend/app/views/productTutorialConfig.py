from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from app.accounts.permissions import ReadOnlyOrAuthenticated
from app.models.models import ProductTutorialConfig
from app.serializers.productTutorialConfig import ProductTutorialConfigSerializer


class ProductTutorialConfigViewSet(viewsets.ViewSet):
    permission_classes = [ReadOnlyOrAuthenticated]
    parser_classes = [JSONParser]

    def list(self, request):
        obj, _ = ProductTutorialConfig.objects.get_or_create(pk=1)
        return Response(ProductTutorialConfigSerializer(obj).data)

    @action(detail=False, methods=['put', 'patch'], url_path='update')
    def update_config(self, request):
        obj, _ = ProductTutorialConfig.objects.get_or_create(pk=1)
        serializer = ProductTutorialConfigSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
