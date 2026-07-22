from rest_framework import serializers
from django.db import transaction
from app.models.models import ProductDocument, Product, Document

class ProductDocumentWriteSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=False,
        allow_null=True
    )
    document = serializers.PrimaryKeyRelatedField(
        queryset=Document.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = ProductDocument
        fields = ("id", "product", "document")
        read_only_fields = ("id",)

    def create(self, validated_data):
        with transaction.atomic():
            product_document = ProductDocument.objects.create(**validated_data)
        return product_document

    def update(self, instance, validated_data):
        with transaction.atomic():
            instance.product = validated_data.get("product", instance.product)
            instance.document = validated_data.get("document", instance.document)
            instance.save()
        return instance