from rest_framework import serializers
from django.db import transaction
from app.models.models import ProductType, ProductTypeTranslations, Language

class ProductTypeTranslationWriteSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())

    class Meta:
        model = ProductTypeTranslations
        fields = ("id", "language", "label")
        read_only_fields = ("id",)

class ProductTypeWriteSerializer(serializers.ModelSerializer):
    translations = ProductTypeTranslationWriteSerializer(many=True, required=False)

    class Meta:
        model = ProductType
        fields = ("id", "category", "translations")
        read_only_fields = ("id",)

    def create(self, validated_data):
        translations_data = validated_data.pop("translations", [])
        with transaction.atomic():
            product_type = ProductType.objects.create(**validated_data)
            for tr in translations_data:
                ProductTypeTranslations.objects.create(product_type=product_type, **tr)
        return product_type

    def update(self, instance, validated_data):
        translations_data = validated_data.pop("translations", None)
        with transaction.atomic():
            instance.category = validated_data.get("category", instance.category)
            instance.save()

            if translations_data is not None:
                instance.producttypetranslations_set.all().delete()
                for tr in translations_data:
                    ProductTypeTranslations.objects.create(product_type=instance, **tr)
        # Refresh from DB to clear stale prefetch cache
        instance.refresh_from_db()
        return instance

    def to_representation(self, instance):
        from app.product.type.serializers.read import ProductTypeReadSerializer
        return ProductTypeReadSerializer(instance).data