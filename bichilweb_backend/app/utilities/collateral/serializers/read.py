from rest_framework import serializers
from app.models.models import Collateral, CollateralTranslation

class CollateralTranslationReadSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = CollateralTranslation
        fields = ("id", "language", "label")

class CollateralReadSerializer(serializers.ModelSerializer):
    translations = CollateralTranslationReadSerializer(
        many=True,
        read_only=True,
        source='collateraltranslation_set'
    )

    class Meta:
        model = Collateral
        fields = ("id", "translations")