from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from app.models.models import CoreValue, CoreValueTitleTranslations, CoreValueDescTranslations
from app.corevalue.serializers import CoreValueReadSerializer, CoreValueWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class CoreValueViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = CoreValue.objects.all().prefetch_related(
        'corevaluetitletranslations_set',
        'corevaluetitletranslations_set__language',
        'corevaluedesctranslations_set',
        'corevaluedesctranslations_set__language',
    ).order_by('index', 'id')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return CoreValueReadSerializer
        return CoreValueWriteSerializer

    def destroy(self, request, *args, **kwargs):
        """Delete core value and its translations manually (DO_NOTHING FK)."""
        instance = self.get_object()
        # Delete related translations first to avoid FK constraint errors
        CoreValueTitleTranslations.objects.filter(corevalue=instance).delete()
        CoreValueDescTranslations.objects.filter(corevalue=instance).delete()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
