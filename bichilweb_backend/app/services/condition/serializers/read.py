from rest_framework import serializers
from app.models.models import ServiceCondition, Conditions, ConditionTranslations


class ConditionTranslationsNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ConditionTranslations
        fields = ("id", "language", "label")


class ConditionsNestedSerializer(serializers.ModelSerializer):
    translations = ConditionTranslationsNestedSerializer(
        many=True,
        read_only=True,
        source='conditiontranslations_set'
    )
    
    class Meta:
        model = Conditions
        fields = ("id", "translations")


class ServiceConditionReadSerializer(serializers.ModelSerializer):
    condition = ConditionsNestedSerializer(read_only=True)
    service = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ServiceCondition
        fields = ("id", "service", "condition")