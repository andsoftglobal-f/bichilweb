from rest_framework import serializers
from django.db import transaction
from app.models.models import (
    Product,
    ProductTranslations,
    ProductDetails,
    ProductDocument,
    ProductCollaterial,
    ProductCondition,
    Document,
    DocumentTranslation,
    Collateral,
    CollateralTranslation,
    Conditions,
    ConditionTranslations,
    ProductType,
    Language
)


class ProductDetailsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductDetails
        fields = (
            "id",
            "amount",
            "min_fee_percent",
            "max_fee_percent",
            "min_interest_rate",
            "max_interest_rate",
            "term_months",
            "min_processing_hours",
            "max_processing_hoyrs",
            "processing_time_minutes",
            "fee_type",
            "calc_btn_color",
            "calc_btn_font_size",
            "calc_btn_text",
            "request_btn_color",
            "request_btn_font_size",
            "request_btn_text",
            "request_btn_url",
            "disclaimer_color",
            "disclaimer_font_size",
            "disclaimer_text",
            "banner_image",
            "banner_mobile_image",
            "description_mn",
            "description_en",
            "description_color",
            "description_font_size",
            "description_align",
            "description_font_family",
        )
        read_only_fields = ("id",)


class ProductTranslationWriteSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())

    class Meta:
        model = ProductTranslations
        fields = ("id", "language", "label")
        read_only_fields = ("id",)


class ProductDocumentWriteSerializer(serializers.ModelSerializer):
    document = serializers.PrimaryKeyRelatedField(queryset=Document.objects.all())

    class Meta:
        model = ProductDocument
        fields = ("id", "document")
        read_only_fields = ("id",)


class ProductCollateralWriteSerializer(serializers.ModelSerializer):
    collateral = serializers.PrimaryKeyRelatedField(queryset=Collateral.objects.all())

    class Meta:
        model = ProductCollaterial
        fields = ("id", "collateral")
        read_only_fields = ("id",)


class ProductConditionWriteSerializer(serializers.ModelSerializer):
    condition = serializers.PrimaryKeyRelatedField(queryset=Conditions.objects.all())

    class Meta:
        model = ProductCondition
        fields = ("id", "condition")
        read_only_fields = ("id",)


class ProductWriteSerializer(serializers.ModelSerializer):
    translations = ProductTranslationWriteSerializer(many=True, required=False)
    details = ProductDetailsWriteSerializer(required=False)
    documents = ProductDocumentWriteSerializer(many=True, required=False)
    collaterals = ProductCollateralWriteSerializer(many=True, required=False)
    conditions = ProductConditionWriteSerializer(many=True, required=False)
    product_type = serializers.PrimaryKeyRelatedField(
        queryset=ProductType.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Product
        fields = (
            "id", 
            "product_type", 
            "translations", 
            "details",
            "documents",
            "collaterals",
            "conditions"
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        translations_data = validated_data.pop("translations", [])
        details_data = validated_data.pop("details", None)
        documents_data = validated_data.pop("documents", [])
        collaterals_data = validated_data.pop("collaterals", [])
        conditions_data = validated_data.pop("conditions", [])
        
        with transaction.atomic():
            product = Product.objects.create(**validated_data)
            
            for tr_data in translations_data:
                ProductTranslations.objects.create(product=product, **tr_data)
            
            if details_data:
                ProductDetails.objects.create(product=product, **details_data)
            
            for doc_data in documents_data:
                ProductDocument.objects.create(product=product, **doc_data)
            
            for coll_data in collaterals_data:
                ProductCollaterial.objects.create(product=product, **coll_data)
            
            for cond_data in conditions_data:
                ProductCondition.objects.create(product=product, **cond_data)
        
        return product

    def update(self, instance, validated_data):
        translations_data = validated_data.pop("translations", None)
        details_data = validated_data.pop("details", None)
        documents_data = validated_data.pop("documents", None)
        collaterals_data = validated_data.pop("collaterals", None)
        conditions_data = validated_data.pop("conditions", None)
        
        with transaction.atomic():
            instance.product_type = validated_data.get("product_type", instance.product_type)
            instance.save()

            if translations_data is not None:
                instance.producttranslations_set.all().delete()
                for tr_data in translations_data:
                    ProductTranslations.objects.create(product=instance, **tr_data)
            
            if details_data is not None:
                ProductDetails.objects.filter(product=instance).delete()
                ProductDetails.objects.create(product=instance, **details_data)
            
            if documents_data is not None:
                instance.productdocument_set.all().delete()
                for doc_data in documents_data:
                    ProductDocument.objects.create(product=instance, **doc_data)
            
            if collaterals_data is not None:
                instance.productcollaterial_set.all().delete()
                for coll_data in collaterals_data:
                    ProductCollaterial.objects.create(product=instance, **coll_data)
            
            if conditions_data is not None:
                instance.productcondition_set.all().delete()
                for cond_data in conditions_data:
                    ProductCondition.objects.create(product=instance, **cond_data)
        
        return instance