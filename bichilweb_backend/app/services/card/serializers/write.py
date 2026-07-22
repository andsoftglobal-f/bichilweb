from rest_framework import serializers
from app.models.models import ServiceCard, ServiceCardTranslations


class ServiceCardTranslationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCardTranslations
        fields = ("id", "language", "label", "short_desc")


class ServiceCardWriteSerializer(serializers.ModelSerializer):
    translations = ServiceCardTranslationWriteSerializer(
        many=True,
        required=False,
        source='servicecardtranslations_set'
    )
    
    class Meta:
        model = ServiceCard
        fields = ("id", "title", "service", "translations")
    
    def create(self, validated_data):
        translations_data = validated_data.pop('servicecardtranslations_set', [])
        service_card = ServiceCard.objects.create(**validated_data)
        
        for translation_data in translations_data:
            ServiceCardTranslations.objects.create(
                service_card=service_card,
                **translation_data
            )
        
        return service_card
    
    def update(self, instance, validated_data):
        translations_data = validated_data.pop('servicecardtranslations_set', None)
        
        instance.title = validated_data.get('title', instance.title)
        instance.service = validated_data.get('service', instance.service)
        instance.save()
        
        if translations_data is not None:
            instance.servicecardtranslations_set.all().delete()
            
            for translation_data in translations_data:
                ServiceCardTranslations.objects.create(
                    service_card=instance,
                    **translation_data
                )
        
        return instance