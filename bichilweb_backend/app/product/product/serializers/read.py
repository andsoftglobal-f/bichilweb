from rest_framework import serializers
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
    Language
)

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

class CollateralTranslationNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = CollateralTranslation
        fields = ("id", "language", "label")

class CollateralNestedSerializer(serializers.ModelSerializer):
    translations = CollateralTranslationNestedSerializer(
        many=True,
        read_only=True,
        source='collateraltranslation_set'
    )
    
    class Meta:
        model = Collateral
        fields = ("id", "translations")

class ConditionTranslationNestedSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ConditionTranslations
        fields = ("id", "language", "label")

class ConditionNestedSerializer(serializers.ModelSerializer):
    translations = ConditionTranslationNestedSerializer(
        many=True,
        read_only=True,
        source='conditiontranslations_set'
    )
    
    class Meta:
        model = Conditions
        fields = ("id", "translations")

class ProductDetailsReadSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        allow_null=True, 
        required=False,
        coerce_to_string=False
    )
    min_fee_percent = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        allow_null=True, 
        required=False,
        coerce_to_string=False
    )
    max_fee_percent = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        allow_null=True, 
        required=False,
        coerce_to_string=False
    )
    min_interest_rate = serializers.DecimalField(
        max_digits=10,  
        decimal_places=2, 
        allow_null=True, 
        required=False,
        coerce_to_string=False
    )
    max_interest_rate = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        allow_null=True, 
        required=False,
        coerce_to_string=False
    )
    
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
class ProductTranslationReadSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ProductTranslations
        fields = ("id", "language", "label")

class ProductDocumentReadSerializer(serializers.ModelSerializer):
    document = DocumentNestedSerializer(read_only=True)

    class Meta:
        model = ProductDocument
        fields = ("id", "document")

class ProductCollateralReadSerializer(serializers.ModelSerializer):
    collateral = CollateralNestedSerializer(read_only=True)

    class Meta:
        model = ProductCollaterial
        fields = ("id", "collateral")

class ProductConditionReadSerializer(serializers.ModelSerializer):
    condition = ConditionNestedSerializer(read_only=True)

    class Meta:
        model = ProductCondition
        fields = ("id", "condition")

class ProductReadSerializer(serializers.ModelSerializer):
    translations = ProductTranslationReadSerializer(
        many=True,
        read_only=True,
        source='producttranslations_set'
    )
    details = ProductDetailsReadSerializer(
        read_only=True,
        source='productdetails_set',
        many=True
    )
    documents = ProductDocumentReadSerializer(
        many=True,
        read_only=True,
        source='productdocument_set'
    )
    collaterals = ProductCollateralReadSerializer(
        many=True,
        read_only=True,
        source='productcollaterial_set'
    )
    conditions = ProductConditionReadSerializer(
        many=True,
        read_only=True,
        source='productcondition_set'
    )
    product_type = serializers.PrimaryKeyRelatedField(read_only=True)
    type_labels = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", 
            "product_type",
            "type_labels",
            "sort_order",
            "translations", 
            "details",
            "documents",
            "collaterals",
            "conditions"
        )

    def get_type_labels(self, obj):
        product_type = obj.product_type
        if not product_type:
            return {
                "categoryMn": "",
                "categoryEn": "",
                "typeMn": "",
                "typeEn": "",
            }

        def label_from(translations, language_id):
            found = next((tr for tr in translations if tr.language_id == language_id), None)
            return found.label if found else ""

        type_translations = list(product_type.producttypetranslations_set.all())
        category = product_type.category
        category_translations = list(category.categorytranslations_set.all()) if category else []

        return {
            "categoryMn": label_from(category_translations, 2),
            "categoryEn": label_from(category_translations, 1),
            "typeMn": label_from(type_translations, 2),
            "typeEn": label_from(type_translations, 1),
        }
