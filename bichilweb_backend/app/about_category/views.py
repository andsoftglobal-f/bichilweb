from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from urllib.parse import unquote
from app.models.models import AboutCategory
from app.about_category.serializers import AboutCategoryReadSerializer, AboutCategoryWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class AboutCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = AboutCategory.objects.all().prefetch_related(
        'aboutcategorytranslations_set',
        'aboutcategorytranslations_set__language',
    ).order_by('sort_order', 'id')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return AboutCategoryReadSerializer
        return AboutCategoryWriteSerializer

    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        items = request.data.get('items', [])
        for item in items:
            AboutCategory.objects.filter(id=item['id']).update(sort_order=item['sort_order'])
        return Response({'status': 'ok'})

    @action(detail=False, methods=['get'], url_path='by-slug/(?P<slug>.+)')
    def by_slug(self, request, slug=None):
        raw_slug = unquote(slug or '').strip()
        normalized_slug = raw_slug.strip('/')
        candidates = [raw_slug]
        if normalized_slug:
            candidates.extend([normalized_slug, f'/{normalized_slug}'])

        cat = self.get_queryset().filter(slug__in=list(dict.fromkeys(candidates))).first()
        if cat:
            serializer = AboutCategoryReadSerializer(cat)
            return Response(serializer.data)
        else:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
