from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

from app.models.models import HomePageLink
from app.serializers.homePageLink import HomePageLinkSerializer


class HomePageLinkViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    serializer_class = HomePageLinkSerializer

    def get_queryset(self):
        queryset = HomePageLink.objects.all().order_by('placement', 'sort_order', 'id')
        active = self.request.query_params.get('active')
        placement = self.request.query_params.get('placement')

        if active is not None:
            queryset = queryset.filter(active=str(active).lower() in ['1', 'true', 'yes'])
        if placement:
            queryset = queryset.filter(placement=placement)

        return queryset
