from rest_framework import serializers
from app.models.models import Document, DocumentTranslation, Language

class DocumentTranslationReadSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = DocumentTranslation
        fields = ("id", "language", "label")

class DocumentReadSerializer(serializers.ModelSerializer):
    translations = DocumentTranslationReadSerializer(
        many=True,
        read_only=True,
        source='documenttranslation_set'
    )

    class Meta:
        model = Document
        fields = ("id", "translations")