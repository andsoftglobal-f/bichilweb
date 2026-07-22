from rest_framework import serializers
from app.models.models import (
    News,
    NewsImages,
    NewsSocials,
    NewsTitleTranslations,
    NewsShortdescTranslations,
    NewsContentTranslations
)
from django.conf import settings


class NewsImagesNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsImages
        fields = ("id", "image")


class NewsSocialsNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsSocials
        fields = ("id", "social", "icon")


class NewsTitleTranslationsNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = NewsTitleTranslations
        fields = ("id", "language", "label", "font", "family", "weight", "size")


class NewsShortdescTranslationsNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = NewsShortdescTranslations
        fields = ("id", "language", "label", "font", "family", "weight", "size")


class NewsContentTranslationsNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = NewsContentTranslations
        fields = ("id", "language", "label", "font", "family", "weight", "size")


class NewsReadSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    images = NewsImagesNestedSerializer(
        many=True,
        read_only=True,
        source='newsimages_set'
    )
    socials = NewsSocialsNestedSerializer(
        many=True,
        read_only=True,
        source='newssocials_set'
    )
    title_translations = NewsTitleTranslationsNestedSerializer(
        many=True,
        read_only=True,
        source='newstitletranslations_set'
    )
    shortdesc_translations = NewsShortdescTranslationsNestedSerializer(
        many=True,
        read_only=True,
        source='newsshortdesctranslations_set'
    )
    content_translations = NewsContentTranslationsNestedSerializer(
        many=True,
        read_only=True,
        source='newscontenttranslations_set'
    )

    class Meta:
        model = News
        fields = (
            "id",
            "category",
            "image",
            "image_url",
            "video",
            "video_orientation",
            "facebook_url",
            "feature",
            "render",
            "show_on_home",
            "readtime",
            "slug",
            "date",
            "images",
            "socials",
            "title_translations",
            "shortdesc_translations",
            "content_translations"
        )

    def get_image_url(self, obj):
        """Generate full image URL with request context"""
        if not obj.image:
            return None
        
        # If it's already a full URL, return as-is
        if obj.image.startswith('http'):
            return obj.image
        
        # Legacy local file fallback
        clean_filename = obj.image.replace('media/', '').replace('news/', '')
        
        # Try to get the request from context
        request = self.context.get('request')
        if request:
            # Build absolute URL
            return request.build_absolute_uri(f'{settings.MEDIA_URL}news/{clean_filename}')
        
        # Fallback to relative URL
        return f'{settings.MEDIA_URL}news/{clean_filename}'


class NewsHomeReadSerializer(NewsReadSerializer):
    class Meta:
        model = News
        fields = (
            "id",
            "category",
            "image",
            "image_url",
            "video",
            "video_orientation",
            "facebook_url",
            "feature",
            "render",
            "show_on_home",
            "readtime",
            "slug",
            "date",
            "title_translations",
        )


class NewsListReadSerializer(NewsReadSerializer):
    class Meta:
        model = News
        fields = (
            "id",
            "category",
            "image",
            "image_url",
            "video",
            "video_orientation",
            "facebook_url",
            "feature",
            "render",
            "show_on_home",
            "readtime",
            "slug",
            "date",
            "title_translations",
            "shortdesc_translations",
        )
