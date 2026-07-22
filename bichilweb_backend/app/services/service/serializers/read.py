from rest_framework import serializers
from app.models.models import (
    Services,
    ServicesTranslations,
    ServiceCard,
    ServiceCardTranslations,
    ServiceCollateral,
    ServiceCondition,
    ServiceDocument,
    Collateral,
    CollateralTranslation,
    Conditions,
    ConditionTranslations,
    Document,
    DocumentTranslation,
)




class CollateralTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollateralTranslation
        fields = ("id", "language", "label")


class CollateralSerializer(serializers.ModelSerializer):
    translations = CollateralTranslationSerializer(
        many=True, read_only=True, source="collateraltranslation_set"
    )

    class Meta:
        model = Collateral
        fields = ("id", "translations")



class ConditionTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConditionTranslations
        fields = ("id", "language", "label")


class ConditionSerializer(serializers.ModelSerializer):
    translations = ConditionTranslationSerializer(
        many=True, read_only=True, source="conditiontranslations_set"
    )

    class Meta:
        model = Conditions
        fields = ("id", "translations")


class DocumentTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTranslation
        fields = ("id", "language", "label")


class DocumentSerializer(serializers.ModelSerializer):
    translations = DocumentTranslationSerializer(
        many=True, read_only=True, source="documenttranslation_set"
    )

    class Meta:
        model = Document
        fields = ("id", "translations")


class ServiceCardTranslationReadSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ServiceCardTranslations
        fields = ("id", "language", "label", "short_desc")


class ServiceCardReadSerializer(serializers.ModelSerializer):
    translations = ServiceCardTranslationReadSerializer(
        many=True, read_only=True, source="servicecardtranslations_set"
    )

    class Meta:
        model = ServiceCard
        fields = ("id", "title", "translations")


class ServiceCardTranslationWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = ServiceCardTranslations
        fields = ("id", "language", "label", "short_desc")


class ServiceCardWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    translations = ServiceCardTranslationWriteSerializer(
        many=True, required=False, source="servicecardtranslations_set"
    )

    class Meta:
        model = ServiceCard
        fields = ("id", "title", "translations")


class ServiceCollateralReadSerializer(serializers.ModelSerializer):
    collateral = CollateralSerializer(read_only=True)

    class Meta:
        model = ServiceCollateral
        fields = ("id", "collateral")


class ServiceCollateralWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    collateral = serializers.PrimaryKeyRelatedField(
        queryset=Collateral.objects.all()
    )

    class Meta:
        model = ServiceCollateral
        fields = ("id", "collateral")



class ServiceConditionReadSerializer(serializers.ModelSerializer):
    condition = ConditionSerializer(read_only=True)

    class Meta:
        model = ServiceCondition
        fields = ("id", "condition")


class ServiceConditionWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    condition = serializers.PrimaryKeyRelatedField(
        queryset=Conditions.objects.all()
    )

    class Meta:
        model = ServiceCondition
        fields = ("id", "condition")


class ServiceDocumentReadSerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)

    class Meta:
        model = ServiceDocument
        fields = ("id", "document")


class ServiceDocumentWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    document = serializers.PrimaryKeyRelatedField(
        queryset=Document.objects.all()
    )

    class Meta:
        model = ServiceDocument
        fields = ("id", "document")


class ServicesTranslationReadSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ServicesTranslations
        fields = ("id", "language", "title", "description")


class ServicesTranslationWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = ServicesTranslations
        fields = ("id", "language", "title", "description")


class ServicesReadSerializer(serializers.ModelSerializer):
    translations = ServicesTranslationReadSerializer(
        many=True, read_only=True, source="servicestranslations_set"
    )
    cards = ServiceCardReadSerializer(
        many=True, read_only=True, source="servicecard_set"
    )
    collaterals = ServiceCollateralReadSerializer(
        many=True, read_only=True, source="servicecollateral_set"
    )
    conditions = ServiceConditionReadSerializer(
        many=True, read_only=True, source="servicecondition_set"
    )
    documents = ServiceDocumentReadSerializer(
        many=True, read_only=True, source="servicedocument_set"
    )

    class Meta:
        model = Services
        fields = ("id", "translations", "cards", "collaterals", "conditions", "documents")

