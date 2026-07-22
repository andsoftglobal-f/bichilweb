from rest_framework import serializers
from app.models.models import Pages, PageTitleTranslations, PageDescriptionTranslations

class PageTitleTranslationsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageTitleTranslations
        fields = ("language", "label", "font", "family", "weight", "size")


class PageDescriptionTranslationsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageDescriptionTranslations
        fields = ("language", "label", "font", "family", "weight", "size")


class PagesWriteSerializer(serializers.ModelSerializer):
    title_translations = PageTitleTranslationsWriteSerializer(many=True)
    description_translations = PageDescriptionTranslationsWriteSerializer(many=True)
    
    class Meta:
        model = Pages
        fields = ("id", "url", "active", "image", "content_blocks", "title_translations", "description_translations")
    
    def create(self, validated_data):
        title_translations_data = validated_data.pop('title_translations')
        description_translations_data = validated_data.pop('description_translations')
        
        page = Pages.objects.create(**validated_data)
        
        for title_data in title_translations_data:
            PageTitleTranslations.objects.create(page=page, **title_data)
        
        for desc_data in description_translations_data:
            PageDescriptionTranslations.objects.create(page=page, **desc_data)
        
        return page
    
    def update(self, instance, validated_data):
        title_translations_data = validated_data.pop('title_translations', None)
        description_translations_data = validated_data.pop('description_translations', None)
        
        instance.url = validated_data.get('url', instance.url)
        instance.active = validated_data.get('active', instance.active)
        instance.image = validated_data.get('image', instance.image)
        instance.content_blocks = validated_data.get('content_blocks', instance.content_blocks)
        instance.save()
        
        if title_translations_data is not None:
            instance.pagetitletranslations_set.all().delete()
            for title_data in title_translations_data:
                PageTitleTranslations.objects.create(page=instance, **title_data)
        
        if description_translations_data is not None:
            instance.pagedescriptiontranslations_set.all().delete()
            for desc_data in description_translations_data:
                PageDescriptionTranslations.objects.create(page=instance, **desc_data)
        
        return instance