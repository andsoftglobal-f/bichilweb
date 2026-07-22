from rest_framework import serializers
from app.models.models import ServiceCard, ServiceCardTranslations


class ServiceCardTranslationReadSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ServiceCardTranslations
        fields = ("id", "language", "label", "short_desc")


class ServiceCardReadSerializer(serializers.ModelSerializer):
    translations = ServiceCardTranslationReadSerializer(
        many=True,
        read_only=True,
        source='servicecardtranslations_set'
    )
    service = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ServiceCard
        fields = ("id", "title", "service", "translations")