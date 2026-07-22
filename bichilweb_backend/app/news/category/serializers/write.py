from rest_framework import serializers
from app.models.models import News, NewsCategory, NewsCategoryTranslations

class NewsCategoryTranslationsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategoryTranslations
        fields = ("language", "label")


class NewsCategoryWriteSerializer(serializers.ModelSerializer):
    translations = NewsCategoryTranslationsWriteSerializer(many=True)
    
    class Meta:
        model = NewsCategory
        fields = ("id", "translations")
    
    def create(self, validated_data):
        translations_data = validated_data.pop('translations')
        
        news_category = NewsCategory.objects.create(**validated_data)
        
        for translation_data in translations_data:
            NewsCategoryTranslations.objects.create(category=news_category, **translation_data)
        
        return news_category
    
    def update(self, instance, validated_data):
        translations_data = validated_data.pop('translations', None)
        
        instance.save()
        
        if translations_data is not None:
            instance.newscategorytranslations_set.all().delete()
            for translation_data in translations_data:
                NewsCategoryTranslations.objects.create(category=instance, **translation_data)
        
        return instance