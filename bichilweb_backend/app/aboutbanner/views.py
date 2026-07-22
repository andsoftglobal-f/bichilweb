from rest_framework import viewsets
from app.models.models import AboutBanner
from app.aboutbanner.serializers import AboutBannerReadSerializer, AboutBannerWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class AboutBannerViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = AboutBanner.objects.all().prefetch_related(
        'aboutbannertranslations_set',
        'aboutbannertranslations_set__language',
    ).order_by('sort_order')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return AboutBannerReadSerializer
        return AboutBannerWriteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        page = self.request.query_params.get('page')
        if page:
            qs = qs.filter(page_id=page)
        return qs
