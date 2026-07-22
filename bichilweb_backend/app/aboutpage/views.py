from rest_framework import viewsets
from app.models.models import AboutPage
from app.aboutpage.serializers import AboutPageReadSerializer, AboutPageWriteSerializer
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly

class AboutPageViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = AboutPage.objects.all().prefetch_related(
        'aboutpagesection_set',
        'aboutpagesection_set__aboutpagesectiontranslations_set',
        'aboutpagesection_set__aboutpagesectiontranslations_set__language',
        'aboutpagesection_set__aboutpageblock_set',
        'aboutpagesection_set__aboutpageblock_set__aboutpageblocktranslations_set',
        'aboutpagesection_set__aboutpageblock_set__aboutpageblocktranslations_set__language',
        'aboutpagemedia_set',
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return AboutPageReadSerializer
        return AboutPageWriteSerializer
