from rest_framework import serializers
from app.models.models import Category, CategoryTranslations

class CategoryTranslationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryTranslations
        fields = ['language', 'label']


class CategoryWriteSerializer(serializers.ModelSerializer):
    translations = CategoryTranslationWriteSerializer(many=True, write_only=True)
    
    class Meta:
        model = Category
        fields = ['translations']

    def create(self, validated_data):
        translations_data = validated_data.pop('translations', [])
        category = Category.objects.create()  
        for trans in translations_data:
            CategoryTranslations.objects.create(category=category, **trans)
        return category

    def update(self, instance, validated_data):
        translations_data = validated_data.pop('translations', [])
        
        CategoryTranslations.objects.filter(category=instance).delete()

        for trans in translations_data:
            CategoryTranslations.objects.create(category=instance, **trans)
        
        # Refresh from DB to clear stale prefetch cache
        instance.refresh_from_db()
        return instance
    
    def to_representation(self, instance):
        from app.categories.serializers.read import CategoryReadSerializer
        return CategoryReadSerializer(instance).data