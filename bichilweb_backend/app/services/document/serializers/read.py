from rest_framework import serializers
from app.models.models import ServiceDocument, Document, DocumentTranslation


class DocumentTranslationNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = DocumentTranslation
        fields = ("id", "language", "label")


class DocumentNestedSerializer(serializers.ModelSerializer):
    translations = DocumentTranslationNestedSerializer(
        many=True,
        read_only=True,
        source='documenttranslation_set'
    )
    
    class Meta:
        model = Document
        fields = ("id", "translations")


class ServiceDocumentReadSerializer(serializers.ModelSerializer):
    document = DocumentNestedSerializer(read_only=True)
    service = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ServiceDocument
        fields = ("id", "service", "document")