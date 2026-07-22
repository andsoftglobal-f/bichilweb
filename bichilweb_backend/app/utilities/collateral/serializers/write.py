from rest_framework import serializers
from django.db import transaction
from app.models.models import Collateral, CollateralTranslation, Language

class CollateralTranslationWriteSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())

    class Meta:
        model = CollateralTranslation
        fields = ("id", "language", "label")
        read_only_fields = ("id",)

class CollateralWriteSerializer(serializers.ModelSerializer):
    translations = CollateralTranslationWriteSerializer(many=True, required=False)

    class Meta:
        model = Collateral
        fields = ("id", "translations")
        read_only_fields = ("id",)

    def create(self, validated_data):
        translations_data = validated_data.pop("translations", [])
        
        with transaction.atomic():
            collateral = Collateral.objects.create(**validated_data)
            
            for tr in translations_data:
                CollateralTranslation.objects.create(collateral=collateral, **tr)
        
        return collateral

    def update(self, instance, validated_data):
        translations_data = validated_data.pop("translations", None)
        
        with transaction.atomic():
            instance.save()

            if translations_data is not None:
                instance.collateraltranslation_set.all().delete()
                for tr in translations_data:
                    CollateralTranslation.objects.create(collateral=instance, **tr)
        
        return instance