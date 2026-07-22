from rest_framework import serializers
from app.models.models import ProductType, ProductTypeTranslations

class ProductTypeTranslationReadSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ProductTypeTranslations
        fields = ("id", "language", "label")

class ProductTypeReadSerializer(serializers.ModelSerializer):
    translations = ProductTypeTranslationReadSerializer(
        many=True, 
        read_only=True,
        source='producttypetranslations_set'  
    )
    
    class Meta:
        model = ProductType
        fields = ("id", "category", "translations")