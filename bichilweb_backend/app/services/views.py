from rest_framework import viewsets, status
from rest_framework.response import Response
from app.models.models import Services, ServiceCard, ServiceCardTranslations, ServiceDocument, ServiceCondition, ServiceCollateral, ServicesTranslations
from app.services.service.serializers.read import ServicesReadSerializer
from app.services.service.serializers.write import ServicesWriteSerializer
from app.services.card.serializers.read import ServiceCardReadSerializer
from app.services.card.serializers.write import ServiceCardWriteSerializer
from app.services.document.serializers.read import ServiceDocumentReadSerializer
from app.services.document.serializers.write import ServiceDocumentWriteSerializer
from app.services.condition.serializers.read import ServiceConditionReadSerializer
from app.services.condition.serializers.write import ServiceConditionWriteSerializer
from app.services.collateral.serializers.read import ServiceCollateralReadSerializer
from app.services.collateral.serializers.write import ServiceCollateralWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class ServicesViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = Services.objects.all().prefetch_related(
        "servicestranslations_set",
        "servicestranslations_set__language",
        "servicecard_set",
        "servicecard_set__servicecardtranslations_set",
        "servicecard_set__servicecardtranslations_set__language",
        "servicecollateral_set",
        "servicecollateral_set__collateral",
        "servicecollateral_set__collateral__collateraltranslation_set",
        "servicecollateral_set__collateral__collateraltranslation_set__language",
        "servicecondition_set",
        "servicecondition_set__condition",
        "servicecondition_set__condition__conditiontranslations_set",
        "servicecondition_set__condition__conditiontranslations_set__language",
        "servicedocument_set",
        "servicedocument_set__document",
        "servicedocument_set__document__documenttranslation_set",
        "servicedocument_set__document__documenttranslation_set__language",
    )

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return ServicesReadSerializer
        return ServicesWriteSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = ServicesWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()

        instance = self._get_fresh_instance(instance.pk)
        read_serializer = ServicesReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)

        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        write_serializer = ServicesWriteSerializer(
            instance, data=request.data, partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()

        instance = self._get_fresh_instance(instance.pk)
        read_serializer = ServicesReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = ServicesReadSerializer(instance)
        data = read_serializer.data

        # Manually delete related records (all FKs use DO_NOTHING)
        cards = ServiceCard.objects.filter(service=instance)
        ServiceCardTranslations.objects.filter(service_card__in=cards).delete()
        cards.delete()
        ServicesTranslations.objects.filter(service=instance).delete()
        ServiceCollateral.objects.filter(service=instance).delete()
        ServiceCondition.objects.filter(service=instance).delete()
        ServiceDocument.objects.filter(service=instance).delete()

        instance.delete()

        return Response(
            {
                "message": "Services амжилттай устгагдлаа",
                "deleted_data": data,
            },
            status=status.HTTP_200_OK,
        )


    def _get_fresh_instance(self, pk: int) -> Services:
        """Return a freshly prefetched instance so the read serializer
        doesn't hit the DB again for every relation."""
        return self.get_queryset().get(pk=pk)

class ServiceCardViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ServiceCard.objects.all().prefetch_related(
        "servicecardtranslations_set",
        "servicecardtranslations_set__language"
    ).select_related("service")

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ServiceCardReadSerializer
        return ServiceCardWriteSerializer
    
    def create(self, request, *args, **kwargs):
        write_serializer = ServiceCardWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceCardReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = ServiceCardWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceCardReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = ServiceCardReadSerializer(instance)
        data = read_serializer.data
        
        instance.delete()
        
        return Response(
            {
                "message": "ServiceCard амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )

class ServiceDocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ServiceDocument.objects.all().select_related(
        "service",
        "document"
    ).prefetch_related(
        "document__documenttranslation_set",
        "document__documenttranslation_set__language"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ServiceDocumentReadSerializer
        return ServiceDocumentWriteSerializer
    
    def create(self, request, *args, **kwargs):
        write_serializer = ServiceDocumentWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceDocumentReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = ServiceDocumentWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceDocumentReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = ServiceDocumentReadSerializer(instance)
        data = read_serializer.data
        
        instance.delete()
        
        return Response(
            {
                "message": "ServiceDocument амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
 
class ServiceConditionViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ServiceCondition.objects.all().select_related(
        "service",
        "condition"
    ).prefetch_related(
        "condition__conditiontranslations_set",
        "condition__conditiontranslations_set__language"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ServiceConditionReadSerializer
        return ServiceConditionWriteSerializer
    
    def create(self, request, *args, **kwargs):
        write_serializer = ServiceConditionWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceConditionReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = ServiceConditionWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceConditionReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = ServiceConditionReadSerializer(instance)
        data = read_serializer.data
        
        instance.delete()
        
        return Response(
            {
                "message": "ServiceCondition амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
    queryset = ServiceCondition.objects.all().select_related(
        "service",
        "condition"
    ).prefetch_related(
        "condition__conditiontranslation_set",
        "condition__conditiontranslation_set__language"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ServiceConditionReadSerializer
        return ServiceConditionWriteSerializer
    
    def create(self, request, *args, **kwargs):
        write_serializer = ServiceConditionWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceConditionReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = ServiceConditionWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceConditionReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = ServiceConditionReadSerializer(instance)
        data = read_serializer.data
        
        instance.delete()
        
        return Response(
            {
                "message": "ServiceCondition амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
    queryset = ServiceCondition.objects.all().select_related(
        "service",
        "condition"
    ).prefetch_related(
        "condition__conditiontranslation_set",
        "condition__conditiontranslation_set__language"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ServiceConditionReadSerializer
        return ServiceConditionWriteSerializer
    
    def create(self, request, *args, **kwargs):
        write_serializer = ServiceConditionWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceConditionReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = ServiceConditionWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceConditionReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = ServiceConditionReadSerializer(instance)
        data = read_serializer.data
        
        instance.delete()
        
        return Response(
            {
                "message": "ServiceCondition амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )
    

class ServiceCollateralViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = ServiceCollateral.objects.all().select_related(
        "service",
        "collateral"
    ).prefetch_related(
        "collateral__collateraltranslation_set",
        "collateral__collateraltranslation_set__language"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ServiceCollateralReadSerializer
        return ServiceCollateralWriteSerializer
    
    def create(self, request, *args, **kwargs):
        write_serializer = ServiceCollateralWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceCollateralReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = ServiceCollateralWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = ServiceCollateralReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = ServiceCollateralReadSerializer(instance)
        data = read_serializer.data
        
        instance.delete()
        
        return Response(
            {
                "message": "ServiceCollateral амжилттай устгагдлаа",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )