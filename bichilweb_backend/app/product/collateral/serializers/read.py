from rest_framework import serializers
from app.models.models import ProductCollaterial

class ProductCollateralReadSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(read_only=True)
    collateral = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ProductCollaterial
        fields = ("id", "product", "collateral")