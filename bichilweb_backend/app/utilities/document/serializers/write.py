from rest_framework import serializers
from django.db import transaction
from app.models.models import Document, DocumentTranslation, Language

class DocumentTranslationWriteSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())

    class Meta:
        model = DocumentTranslation
        fields = ("id", "language", "label")
        read_only_fields = ("id",)

class DocumentWriteSerializer(serializers.ModelSerializer):
    translations = DocumentTranslationWriteSerializer(many=True, required=False)

    class Meta:
        model = Document
        fields = ("id", "translations")
        read_only_fields = ("id",)

    def create(self, validated_data):
        translations_data = validated_data.pop("translations", [])
        
        with transaction.atomic():
            document = Document.objects.create(**validated_data)
            
            for tr in translations_data:
                DocumentTranslation.objects.create(document=document, **tr)
        
        return document

    def update(self, instance, validated_data):
        translations_data = validated_data.pop("translations", None)
        
        with transaction.atomic():
            instance.save()

            if translations_data is not None:
                instance.documenttranslation_set.all().delete()
                for tr in translations_data:
                    DocumentTranslation.objects.create(document=instance, **tr)
        
        return instance

    def to_representation(self, instance):
        from app.utilities.document.serializers import DocumentReadSerializer
        return DocumentReadSerializer(instance).data