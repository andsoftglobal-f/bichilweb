from rest_framework import serializers
from app.models.models import ProductCondition

class ProductConditionReadSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(read_only=True)
    condition = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ProductCondition
        fields = ("id", "product", "condition")