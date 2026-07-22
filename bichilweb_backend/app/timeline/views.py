from rest_framework import viewsets
from app.models.models import TimelineEvent
from app.timeline.serializers import TimelineEventReadSerializer, TimelineEventWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class TimelineEventViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = TimelineEvent.objects.all().prefetch_related(
        'timelineeventtranslations_set',
        'timelineeventtranslations_set__language',
    ).order_by('sort_order', 'id')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return TimelineEventReadSerializer
        return TimelineEventWriteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        page_id = self.request.query_params.get('page')
        if page_id:
            qs = qs.filter(page_id=page_id)
        return qs
