from rest_framework import viewsets, status, serializers as drf_serializers
from rest_framework.response import Response
from app.models.models import NewsCategory, News, NewsPageSettings
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view
from app.news.category.serializers.read import NewsCategoryReadSerializer
from app.news.category.serializers.write import NewsCategoryWriteSerializer
from app.news.news.serializers.read import NewsHomeReadSerializer, NewsListReadSerializer, NewsReadSerializer
from app.news.news.serializers.write import NewsWriteSerializer
import re
import logging
from django.db.models import Q
from django.conf import settings as django_settings
from app.utils.storage import delete_file

from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly
logger = logging.getLogger(__name__)

class NewsCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = NewsCategory.objects.all().prefetch_related(
        "newscategorytranslations_set",
        "newscategorytranslations_set__language"
    )

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return NewsCategoryReadSerializer
        return NewsCategoryWriteSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = NewsCategoryWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = NewsCategoryReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = NewsCategoryWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = NewsCategoryReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = NewsCategoryReadSerializer(instance)
        data = read_serializer.data
        
        # Delete translations first (models use DO_NOTHING, DB has FK constraints)
        instance.newscategorytranslations_set.all().delete()
        
        # Check if any news uses this category — set to null instead of blocking
        News.objects.filter(category=instance).update(category=None)
        
        instance.delete()
        
        return Response(
            {
                "message": "Амжилттай устгалаа.",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )

class NewsViewSet(viewsets.ModelViewSet):
    permission_classes = [DjangoModelPermissionsOrAnonReadOnly]
    queryset = News.objects.all().prefetch_related(
        "newsimages_set",
        "newssocials_set",
        "newstitletranslations_set",
        "newstitletranslations_set__language",
        "newsshortdesctranslations_set",
        "newsshortdesctranslations_set__language",
        "newscontenttranslations_set",
        "newscontenttranslations_set__language"
    ).order_by('-feature', '-date', '-id')
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        queryset = super().get_queryset()
        home_only = self.request.query_params.get('home')
        summary_only = self.request.query_params.get('summary')
        slug = self.request.query_params.get('slug')

        if home_only and home_only.lower() in ('1', 'true', 'yes'):
            queryset = queryset.filter(render=True, show_on_home=True)

        if summary_only and summary_only.lower() in ('1', 'true', 'yes'):
            queryset = queryset.filter(render=True)

        if slug:
            slug_filter = Q(slug=slug)
            if slug.startswith('news-') and slug[5:].isdigit():
                slug_filter |= Q(id=int(slug[5:]))
            queryset = queryset.filter(slug_filter)

        return queryset

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            home_only = self.request.query_params.get('home') if self.request else None
            summary_only = self.request.query_params.get('summary') if self.request else None
            if self.action == 'list' and home_only and home_only.lower() in ('1', 'true', 'yes'):
                return NewsHomeReadSerializer
            if self.action == 'list' and summary_only and summary_only.lower() in ('1', 'true', 'yes'):
                return NewsListReadSerializer
            return NewsReadSerializer
        return NewsWriteSerializer

    def create(self, request, *args, **kwargs):
        logger.debug('NEWS CREATE - Content-Type: %s, keys: %s', request.content_type, list(request.data.keys()))
        write_serializer = NewsWriteSerializer(data=request.data)
        if not write_serializer.is_valid():
            logger.warning('NEWS VALIDATION ERRORS: %s', write_serializer.errors)
            return Response(write_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        instance = write_serializer.save()
        
        read_serializer = NewsReadSerializer(instance)
        headers = self.get_success_headers(read_serializer.data)
        
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        write_serializer = NewsWriteSerializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save()
        
        read_serializer = NewsReadSerializer(instance)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        read_serializer = NewsReadSerializer(instance)
        data = read_serializer.data
        
        # Delete main image
        if instance.image:
            delete_file(instance.image)
        
        # Delete additional images
        for img in instance.newsimages_set.all():
            if img.image:
                delete_file(img.image)
        
        # Manually delete all related records (models use DO_NOTHING, DB has FK constraints)
        instance.newstitletranslations_set.all().delete()
        instance.newsshortdesctranslations_set.all().delete()
        instance.newscontenttranslations_set.all().delete()
        instance.newsimages_set.all().delete()
        instance.newssocials_set.all().delete()
        
        instance.delete()
        
        return Response(
            {
                "message": "Амжилттай.",
                "deleted_data": data
            },
            status=status.HTTP_200_OK
        )

class NewsPageSettingsSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = NewsPageSettings
        fields = (
            'id',
            'home_heading',
            'home_heading_en',
            'latest_heading',
            'featured_heading',
            'latest_heading_en',
            'featured_heading_en',
            'section_label_color',
            'section_label_size',
            'heading_color',
            'heading_size',
            'heading_font_family',
            'divider_color',
            'divider_width',
            'divider_height',
            'divider_margin_top',
            'divider_margin_bottom',
            'button_color',
            'button_text',
            'button_text_en',
            'button_text_color',
            'button_size',
            'button_font_family',
        )


@api_view(['GET', 'PUT'])
def news_page_settings_view(request):
    settings, _ = NewsPageSettings.objects.get_or_create(id=1, defaults={
        'home_heading': 'Мэдээ',
        'home_heading_en': 'News',
        'latest_heading': 'Сүүлийн мэдээнүүд',
        'featured_heading': 'Онцлох мэдээ',
        'latest_heading_en': '',
        'featured_heading_en': '',
        'divider_color': '#0048BA',
        'divider_width': '64px',
        'divider_height': '4px',
        'divider_margin_top': '12px',
        'divider_margin_bottom': '80px',
        'button_text': 'Дэлгэрэнгүй',
        'button_text_en': 'View All',
    })
    
    if request.method == 'GET':
        serializer = NewsPageSettingsSerializer(settings)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = NewsPageSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
