from rest_framework import serializers
from app.models.models import News, NewsCategory, NewsCategoryTranslations

class NewsCategoryTranslationsNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = NewsCategoryTranslations
        fields = ("id", "language", "label")


class NewsCategoryReadSerializer(serializers.ModelSerializer):
    translations = NewsCategoryTranslationsNestedSerializer(
        many=True,
        read_only=True,
        source='newscategorytranslations_set'
    )
    
    class Meta:
        model = NewsCategory
        fields = ("id", "translations")