from rest_framework import serializers
from django.db import transaction
from app.models.models import ProductCondition, Product, Conditions

class ProductConditionWriteSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=False,
        allow_null=True
    )
    condition = serializers.PrimaryKeyRelatedField(
        queryset=Conditions.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = ProductCondition
        fields = ("id", "product", "condition")
        read_only_fields = ("id",)

    def create(self, validated_data):
        with transaction.atomic():
            product_condition = ProductCondition.objects.create(**validated_data)
        return product_condition

    def update(self, instance, validated_data):
        with transaction.atomic():
            instance.product = validated_data.get("product", instance.product)
            instance.condition = validated_data.get("condition", instance.condition)
            instance.save()
        return instance