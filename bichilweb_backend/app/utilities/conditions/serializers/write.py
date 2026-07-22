from rest_framework import serializers
from django.db import transaction
from app.models.models import Conditions, ConditionTranslations, Language

class ConditionTranslationWriteSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())

    class Meta:
        model = ConditionTranslations
        fields = ("id", "language", "label")
        read_only_fields = ("id",)

class ConditionWriteSerializer(serializers.ModelSerializer):
    translations = ConditionTranslationWriteSerializer(many=True, required=False)

    class Meta:
        model = Conditions
        fields = ("id", "translations")
        read_only_fields = ("id",)

    def create(self, validated_data):
        translations_data = validated_data.pop("translations", [])
        
        with transaction.atomic():
            condition = Conditions.objects.create(**validated_data)
            
            for tr in translations_data:
                ConditionTranslations.objects.create(condition=condition, **tr)
        
        return condition

    def update(self, instance, validated_data):
        translations_data = validated_data.pop("translations", None)
        
        with transaction.atomic():
            instance.save()

            if translations_data is not None:
                instance.conditiontranslations_set.all().delete()
                for tr in translations_data:
                    ConditionTranslations.objects.create(condition=instance, **tr)
        
        return instance