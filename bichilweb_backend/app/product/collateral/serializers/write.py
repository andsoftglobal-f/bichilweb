from rest_framework import serializers
from django.db import transaction
from app.models.models import ProductCollaterial, Product, Collateral

class ProductCollateralWriteSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=False,
        allow_null=True
    )
    collateral = serializers.PrimaryKeyRelatedField(
        queryset=Collateral.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = ProductCollaterial
        fields = ("id", "product", "collateral")
        read_only_fields = ("id",)

    def create(self, validated_data):
        with transaction.atomic():
            product_collateral = ProductCollaterial.objects.create(**validated_data)
        return product_collateral

    def update(self, instance, validated_data):
        with transaction.atomic():
            instance.product = validated_data.get("product", instance.product)
            instance.collateral = validated_data.get("collateral", instance.collateral)
            instance.save()
        return instance