from rest_framework import serializers
from app.models.models import Conditions, ConditionTranslations

class ConditionTranslationReadSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ConditionTranslations
        fields = ("id", "language", "label")

class ConditionReadSerializer(serializers.ModelSerializer):
    translations = ConditionTranslationReadSerializer(
        many=True,
        read_only=True,
        source='conditiontranslations_set'
    )

    class Meta:
        model = Conditions
        fields = ("id", "translations")