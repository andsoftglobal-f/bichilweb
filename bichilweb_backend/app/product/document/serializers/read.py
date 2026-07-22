from rest_framework import serializers
from app.models.models import ProductDocument

class ProductDocumentReadSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(read_only=True)
    document = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ProductDocument
        fields = ("id", "product", "document")