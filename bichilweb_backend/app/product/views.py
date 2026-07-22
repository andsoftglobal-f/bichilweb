from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from app.models.models import ProductType, Product, ProductDocument, ProductCollaterial, ProductCondition, ProductDetails
from rest_framework.response import Response
from app.product.type.serializers.read import ProductTypeReadSerializer
from app.product.type.serializers.write import ProductTypeWriteSerializer
from app.product.product.serializers.read import ProductReadSerializer
from app.product.product.serializers.write import ProductWriteSerializer
from app.product.document.serializers.read import ProductDocumentReadSerializer
from app.product.document.serializers.write import ProductDocumentWriteSerializer
from app.product.collateral.serializers.read import ProductCollateralReadSerializer
from app.product.collateral.serializers.write import ProductCollateralWriteSerializer
from app.product.conditions.serializers.read import ProductConditionReadSerializer
from app.product.conditions.serializers.write import ProductConditionWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class ProductTypeViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ProductType.objects.all().prefetch_related(
        "producttypetranslations_set",  
        "producttypetranslations_set__language"  
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProductTypeReadSerializer
        return ProductTypeWriteSerializer
    
class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Product.objects.all().prefetch_related(
        "producttranslations_set",
        "producttranslations_set__language",
        "product_type__producttypetranslations_set",
        "product_type__producttypetranslations_set__language",
        "product_type__category__categorytranslations_set",
        "product_type__category__categorytranslations_set__language",
        
        "productdetails_set",
        
        "productdocument_set",
        "productdocument_set__document",
        "productdocument_set__document__documenttranslation_set",
        "productdocument_set__document__documenttranslation_set__language",
        
        "productcollaterial_set",
        "productcollaterial_set__collateral",
        "productcollaterial_set__collateral__collateraltranslation_set",
        "productcollaterial_set__collateral__collateraltranslation_set__language",
        
        "productcondition_set",
        "productcondition_set__condition",
        "productcondition_set__condition__conditiontranslations_set",
        "productcondition_set__condition__conditiontranslations_set__language",
    ).select_related(
        "product_type",
        "product_type__category"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProductReadSerializer
        return ProductWriteSerializer

    
class ProductDocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ProductDocument.objects.all().select_related(
        "product",
        "document"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProductDocumentReadSerializer
        return ProductDocumentWriteSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = ProductDocumentWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ProductDocumentReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = ProductDocumentWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ProductDocumentReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = ProductDocumentReadSerializer(instance)
        data = read_serializer.data
        
        instance.delete()
        
        return Response(
            {
                "message": "ProductDocument амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )

class ProductCollateralViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ProductCollaterial.objects.all().select_related(
        "product",
        "collateral"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProductCollateralReadSerializer
        return ProductCollateralWriteSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = ProductCollateralWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ProductCollateralReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = ProductCollateralWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ProductCollateralReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = ProductCollateralReadSerializer(instance)
        data = read_serializer.data
        
        instance.delete()
        
        return Response(
            {
                "message": "ProductCollateral амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
    

class ProductConditionViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ProductCondition.objects.all().select_related(
        "product",
        "condition"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProductConditionReadSerializer
        return ProductConditionWriteSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = ProductConditionWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ProductConditionReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = ProductConditionWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ProductConditionReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = ProductConditionReadSerializer(instance)
        data = read_serializer.data
        
        instance.delete()
        
        return Response(
            {
                "message": "ProductCondition амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
