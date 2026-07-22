from rest_framework import serializers
from app.models.models import ServiceCollateral, Collateral, CollateralTranslation

class CollateralTranslationNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = CollateralTranslation
        fields = ("id", "language", "label")


class CollateralNestedSerializer(serializers.ModelSerializer):
    translations = CollateralTranslationNestedSerializer(
        many=True,
        read_only=True,
        source='collateraltranslation_set'
    )
    
    class Meta:
        model = Collateral
        fields = ("id", "translations")


class ServiceCollateralReadSerializer(serializers.ModelSerializer):
    collateral = CollateralNestedSerializer(read_only=True)
    service = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ServiceCollateral
        fields = ("id", "service", "collateral")