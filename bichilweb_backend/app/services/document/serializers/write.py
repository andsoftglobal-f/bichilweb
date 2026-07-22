from rest_framework import serializers
from app.models.models import ServiceDocument

class ServiceDocumentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceDocument
        fields = ("id", "service", "document")