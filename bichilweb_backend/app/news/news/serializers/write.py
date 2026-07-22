from rest_framework import serializers
from app.models.models import (
    News,
    NewsImages,
    NewsSocials,
    NewsTitleTranslations,
    NewsShortdescTranslations,
    NewsContentTranslations,
    Language  # Import Language model
)
import json
import re
import logging
from django.conf import settings
from app.utils.storage import upload_file, delete_file

logger = logging.getLogger(__name__)


class NewsWriteSerializer(serializers.ModelSerializer):
    # Nested data as JSON strings
    images = serializers.CharField(write_only=True, required=False, allow_blank=True)
    socials = serializers.CharField(write_only=True, required=False, allow_blank=True)
    title_translations = serializers.CharField(write_only=True)
    shortdesc_translations = serializers.CharField(write_only=True)
    content_translations = serializers.CharField(write_only=True)
    
    # Main image file
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = News
        fields = (
            "id",
            "category",
            "image",
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

    def validate_images(self, value):
        """Validate images JSON string"""
        if not value or value.strip() == '':
            return []
        try:
            data = json.loads(value) if isinstance(value, str) else value
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON format for images")

    def validate_socials(self, value):
        """Validate socials JSON string"""
        if not value or value.strip() == '':
            return []
        try:
            data = json.loads(value) if isinstance(value, str) else value
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON format for socials")

    def validate_title_translations(self, value):
        """Validate title translations JSON string"""
        try:
            data = json.loads(value) if isinstance(value, str) else value
            if not isinstance(data, list) or not data:
                raise serializers.ValidationError("Title translations must be a non-empty list")
            return data
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON format for title_translations")

    def validate_shortdesc_translations(self, value):
        """Validate shortdesc translations JSON string"""
        try:
            data = json.loads(value) if isinstance(value, str) else value
            if not isinstance(data, list) or not data:
                raise serializers.ValidationError("Shortdesc translations must be a non-empty list")
            return data
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON format for shortdesc_translations")

    def validate_content_translations(self, value):
        """Validate content translations JSON string"""
        try:
            data = json.loads(value) if isinstance(value, str) else value
            if not isinstance(data, list) or not data:
                raise serializers.ValidationError("Content translations must be a non-empty list")
            return data
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON format for content_translations")

    def _upload_to_storage(self, image_file):
        """Upload image and return URL"""
        return upload_file(image_file, folder='news', resource_type='image')

    def _delete_from_storage(self, image_url):
        """Delete image file"""
        delete_file(image_url)

    def _get_language_instance(self, language_id):
        """Get Language instance by ID"""
        try:
            return Language.objects.get(id=language_id)
        except Language.DoesNotExist:
            raise serializers.ValidationError(f"Language with id {language_id} does not exist")

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        socials_data = validated_data.pop('socials', [])
        logger.debug('SOCIALS DATA in create: %s', socials_data)
        title_translations_data = validated_data.pop('title_translations')
        shortdesc_translations_data = validated_data.pop('shortdesc_translations')
        content_translations_data = validated_data.pop('content_translations')
        
        image_file = validated_data.pop('image', None)

        # Save main image
        if image_file:
            file_url = self._upload_to_storage(image_file)
            validated_data['image'] = file_url
            logger.debug('News image uploaded: %s', file_url)

        # Create news
        news = News.objects.create(**validated_data)

        # Create related objects - Images
        for image_data in images_data:
            NewsImages.objects.create(news=news, **image_data)

        # Create related objects - Socials
        for social_data in socials_data:
            NewsSocials.objects.create(news=news, **social_data)

        # Create related objects - Title Translations
        for title_data in title_translations_data:
            language_id = title_data.pop('language')
            language_instance = self._get_language_instance(language_id)
            NewsTitleTranslations.objects.create(
                news=news,
                language=language_instance,
                **title_data
            )

        # Create related objects - Shortdesc Translations
        for shortdesc_data in shortdesc_translations_data:
            language_id = shortdesc_data.pop('language')
            language_instance = self._get_language_instance(language_id)
            NewsShortdescTranslations.objects.create(
                news=news,
                language=language_instance,
                **shortdesc_data
            )

        # Create related objects - Content Translations
        for content_data in content_translations_data:
            language_id = content_data.pop('language')
            language_instance = self._get_language_instance(language_id)
            NewsContentTranslations.objects.create(
                news=news,
                language=language_instance,
                **content_data
            )

        return news

    def update(self, instance, validated_data):
        images_data = validated_data.pop('images', None)
        socials_data = validated_data.pop('socials', None)
        logger.debug('SOCIALS DATA in update: %s', socials_data)
        title_translations_data = validated_data.pop('title_translations', None)
        shortdesc_translations_data = validated_data.pop('shortdesc_translations', None)
        content_translations_data = validated_data.pop('content_translations', None)
        
        image_file = validated_data.pop('image', None)

        # Update main image
        if image_file:
            # Delete old image from storage
            if instance.image:
                self._delete_from_storage(instance.image)
            
            # Upload new image to storage
            file_url = self._upload_to_storage(image_file)
            validated_data['image'] = file_url
            logger.debug('News image updated: %s', file_url)

        # Update news fields
        instance.category = validated_data.get('category', instance.category)
        instance.video = validated_data.get('video', instance.video)
        instance.feature = validated_data.get('feature', instance.feature)
        instance.render = validated_data.get('render', instance.render)
        instance.show_on_home = validated_data.get('show_on_home', instance.show_on_home)
        instance.readtime = validated_data.get('readtime', instance.readtime)
        instance.slug = validated_data.get('slug', instance.slug)
        instance.date = validated_data.get('date', instance.date)
        
        # Update image if changed
        if 'image' in validated_data:
            instance.image = validated_data['image']
        
        instance.save()

        # Update related objects - Images (delete old images first)
        if images_data is not None:
            for old_img in instance.newsimages_set.all():
                if old_img.image:
                    self._delete_from_storage(old_img.image)
            instance.newsimages_set.all().delete()
            for image_data in images_data:
                NewsImages.objects.create(news=instance, **image_data)

        # Update related objects - Socials
        if socials_data is not None:
            instance.newssocials_set.all().delete()
            for social_data in socials_data:
                NewsSocials.objects.create(news=instance, **social_data)

        # Update related objects - Title Translations
        if title_translations_data is not None:
            instance.newstitletranslations_set.all().delete()
            for title_data in title_translations_data:
                language_id = title_data.pop('language')
                language_instance = self._get_language_instance(language_id)
                NewsTitleTranslations.objects.create(
                    news=instance,
                    language=language_instance,
                    **title_data
                )

        # Update related objects - Shortdesc Translations
        if shortdesc_translations_data is not None:
            instance.newsshortdesctranslations_set.all().delete()
            for shortdesc_data in shortdesc_translations_data:
                language_id = shortdesc_data.pop('language')
                language_instance = self._get_language_instance(language_id)
                NewsShortdescTranslations.objects.create(
                    news=instance,
                    language=language_instance,
                    **shortdesc_data
                )

        # Update related objects - Content Translations
        if content_translations_data is not None:
            instance.newscontenttranslations_set.all().delete()
            for content_data in content_translations_data:
                language_id = content_data.pop('language')
                language_instance = self._get_language_instance(language_id)
                NewsContentTranslations.objects.create(
                    news=instance,
                    language=language_instance,
                    **content_data
                )

        return instance
