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


# ──────────────────────────────────────────────
# Condition
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# Document
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# ServiceCard
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# ServiceCollateral (nested relation)
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# ServiceCondition (nested relation)
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# ServiceDocument (nested relation)
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# ServicesTranslation
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# Services READ
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# Services WRITE
# ──────────────────────────────────────────────

class ServicesWriteSerializer(serializers.ModelSerializer):
    translations = ServicesTranslationWriteSerializer(
        many=True, required=False, source="servicestranslations_set"
    )
    cards = ServiceCardWriteSerializer(
        many=True, required=False, source="servicecard_set"
    )
    collaterals = ServiceCollateralWriteSerializer(
        many=True, required=False, source="servicecollateral_set"
    )
    conditions = ServiceConditionWriteSerializer(
        many=True, required=False, source="servicecondition_set"
    )
    documents = ServiceDocumentWriteSerializer(
        many=True, required=False, source="servicedocument_set"
    )

    class Meta:
        model = Services
        fields = ("id", "translations", "cards", "collaterals", "conditions", "documents")

    # ── helpers ──────────────────────────────

    def _save_translations(self, instance, data):
        existing = {t.id: t for t in instance.servicestranslations_set.all()}
        for item in data:
            tid = item.get("id")
            if tid and tid in existing:
                obj = existing.pop(tid)
                for k, v in item.items():
                    if k != "id":
                        setattr(obj, k, v)
                obj.save()
            else:
                ServicesTranslations.objects.create(service=instance, **{k: v for k, v in item.items() if k != "id"})
        # delete removed rows
        for obj in existing.values():
            obj.delete()

    def _save_cards(self, instance, data):
        existing = {c.id: c for c in instance.servicecard_set.all()}
        for item in data:
            cid = item.get("id")
            trans_data = item.pop("servicecardtranslations_set", [])
            if cid and cid in existing:
                card = existing.pop(cid)
                card.title = item.get("title", card.title)
                card.save()
            else:
                card = ServiceCard.objects.create(
                    service=instance,
                    title=item.get("title")
                )
            # card translations
            card_trans_existing = {t.id: t for t in card.servicecardtranslations_set.all()}
            for t in trans_data:
                ttid = t.get("id")
                if ttid and ttid in card_trans_existing:
                    obj = card_trans_existing.pop(ttid)
                    for k, v in t.items():
                        if k != "id":
                            setattr(obj, k, v)
                    obj.save()
                else:
                    ServiceCardTranslations.objects.create(
                        service_card=card,
                        **{k: v for k, v in t.items() if k != "id"}
                    )
            for obj in card_trans_existing.values():
                obj.delete()
        for obj in existing.values():
            obj.delete()

    def _save_m2m_relation(self, instance, data, RelModel, fk_field, related_field, related_set_name):
        """Generic helper for collateral / condition / document relations."""
        existing = {obj.id: obj for obj in getattr(instance, related_set_name).all()}
        for item in data:
            rid = item.get("id")
            related_obj = item[related_field]
            if rid and rid in existing:
                obj = existing.pop(rid)
                setattr(obj, related_field, related_obj)
                obj.save()
            else:
                RelModel.objects.create(**{fk_field: instance, related_field: related_obj})
        for obj in existing.values():
            obj.delete()

    # ── create ───────────────────────────────

    def create(self, validated_data):
        translations_data  = validated_data.pop("servicestranslations_set", [])
        cards_data         = validated_data.pop("servicecard_set", [])
        collaterals_data   = validated_data.pop("servicecollateral_set", [])
        conditions_data    = validated_data.pop("servicecondition_set", [])
        documents_data     = validated_data.pop("servicedocument_set", [])

        instance = Services.objects.create(**validated_data)

        self._save_translations(instance, translations_data)
        self._save_cards(instance, cards_data)
        self._save_m2m_relation(instance, collaterals_data, ServiceCollateral,  "service", "collateral", "servicecollateral_set")
        self._save_m2m_relation(instance, conditions_data,  ServiceCondition,   "service", "condition",  "servicecondition_set")
        self._save_m2m_relation(instance, documents_data,   ServiceDocument,    "service", "document",   "servicedocument_set")

        return instance

    # ── update ───────────────────────────────

    def update(self, instance, validated_data):
        translations_data  = validated_data.pop("servicestranslations_set", None)
        cards_data         = validated_data.pop("servicecard_set", None)
        collaterals_data   = validated_data.pop("servicecollateral_set", None)
        conditions_data    = validated_data.pop("servicecondition_set", None)
        documents_data     = validated_data.pop("servicedocument_set", None)

        instance.save()

        if translations_data is not None:
            self._save_translations(instance, translations_data)
        if cards_data is not None:
            self._save_cards(instance, cards_data)
        if collaterals_data is not None:
            self._save_m2m_relation(instance, collaterals_data, ServiceCollateral,  "service", "collateral", "servicecollateral_set")
        if conditions_data is not None:
            self._save_m2m_relation(instance, conditions_data,  ServiceCondition,   "service", "condition",  "servicecondition_set")
        if documents_data is not None:
            self._save_m2m_relation(instance, documents_data,   ServiceDocument,    "service", "document",   "servicedocument_set")

        return instance