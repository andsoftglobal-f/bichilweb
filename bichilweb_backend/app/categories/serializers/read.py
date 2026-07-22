from rest_framework import serializers
from app.models.models import Category, CategoryTranslations, ProductType, Product, ProductTranslations

class CategoryTranslationReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryTranslations
        fields = ['language', 'label']

class ProductTranslationReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTranslations
        fields = ['language', 'label']

class ProductReadSerializer(serializers.ModelSerializer):
    translations = ProductTranslationReadSerializer(
        source='producttranslations_set', many=True, read_only=True
    )

    class Meta:
        model = Product
        fields = ['id', 'sort_order', 'translations']

class ProductTypeReadSerializer(serializers.ModelSerializer):
    products = ProductReadSerializer(
        source='product_set', many=True, read_only=True
    )
    translations = serializers.SerializerMethodField()

    def get_translations(self, obj):
        translations = obj.producttypetranslations_set.all()
        return [{"language": t.language.id, "label": t.label} for t in translations]

    class Meta:
        model = ProductType
        fields = ['id', 'sort_order', 'translations', 'products']

class CategoryReadSerializer(serializers.ModelSerializer):
    translations = CategoryTranslationReadSerializer(
        source='categorytranslations_set', many=True, read_only=True
    )
    product_types = ProductTypeReadSerializer(
        source='producttype_set', many=True, read_only=True
    )

    class Meta:
        model = Category
        fields = ['id', 'sort_order', 'translations', 'product_types']