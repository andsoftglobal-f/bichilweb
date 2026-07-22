from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from app.accounts.permissions import ReadOnlyOrAuthenticated
from app.models.models import StatsConfig
from app.serializers.statsConfig import StatsConfigSerializer


class StatsConfigViewSet(viewsets.ViewSet):
    """
    Single-row config for the Stats section.
    GET  /stats-config/        → returns the config (creates default if missing)
    PUT  /stats-config/update/  → updates the config
    """
    permission_classes = [ReadOnlyOrAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def list(self, request):
        obj, _ = StatsConfig.objects.get_or_create(pk=1)
        data = StatsConfigSerializer(obj).data
        light = request.query_params.get('light')
        if light and light.lower() in ('1', 'true', 'yes'):
            data['has_section_image'] = bool(data.get('section_image'))
            data['section_image'] = None
        return Response(data)

    @action(detail=False, methods=['get'], url_path='image')
    def image(self, request):
        obj, _ = StatsConfig.objects.get_or_create(pk=1)
        return Response({'section_image': obj.section_image})

    @action(detail=False, methods=['put', 'patch'], url_path='update')
    def update_config(self, request):
        obj, _ = StatsConfig.objects.get_or_create(pk=1)
        serializer = StatsConfigSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
