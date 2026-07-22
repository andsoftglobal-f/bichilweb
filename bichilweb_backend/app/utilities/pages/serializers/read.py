from rest_framework import serializers
from app.models.models import Pages, PageTitleTranslations, PageDescriptionTranslations

class PageTitleTranslationsNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = PageTitleTranslations
        fields = ("id", "language", "label", "font", "family", "weight", "size")


class PageDescriptionTranslationsNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = PageDescriptionTranslations
        fields = ("id", "language", "label", "font", "family", "weight", "size")


class PagesReadSerializer(serializers.ModelSerializer):
    title_translations = PageTitleTranslationsNestedSerializer(
        many=True,
        read_only=True,
        source='pagetitletranslations_set'
    )
    description_translations = PageDescriptionTranslationsNestedSerializer(
        many=True,
        read_only=True,
        source='pagedescriptiontranslations_set'
    )
    
    class Meta:
        model = Pages
        fields = ("id", "url", "active", "image", "content_blocks", "title_translations", "description_translations")