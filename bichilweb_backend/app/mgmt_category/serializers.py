from rest_framework import serializers
from app.models.models import ManagementCategory, ManagementCategoryTranslations, Language


# ─── READ ───

class CategoryTranslationReadSerializer(serializers.ModelSerializer):
    language_code = serializers.SerializerMethodField()

    class Meta:
        model = ManagementCategoryTranslations
        fields = ("id", "language", "language_code", "label", "slogan", "styles")

    def get_language_code(self, obj):
        return obj.language.lang_code.upper() if obj.language and obj.language.lang_code else None


class ManagementCategoryReadSerializer(serializers.ModelSerializer):
    translations = CategoryTranslationReadSerializer(
        many=True, read_only=True, source='managementcategorytranslations_set'
    )

    class Meta:
        model = ManagementCategory
        fields = ("id", "key", "sort_order", "active", "translations")


# ─── WRITE ───

class CategoryTranslationWriteSerializer(serializers.Serializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())
    label = serializers.CharField(required=False, allow_blank=True, default='')
    slogan = serializers.CharField(required=False, allow_blank=True, default='')
    styles = serializers.CharField(required=False, allow_blank=True, default='{}')


class ManagementCategoryWriteSerializer(serializers.ModelSerializer):
    translations = CategoryTranslationWriteSerializer(many=True, required=False)

    class Meta:
        model = ManagementCategory
        fields = ("id", "key", "sort_order", "active", "translations")
        read_only_fields = ("id",)

    def create(self, validated_data):
        from django.db import transaction
        from django.utils import timezone

        trans_data = validated_data.pop("translations", [])
        now = timezone.now()

        with transaction.atomic():
            cat = ManagementCategory.objects.create(
                **validated_data,
                created=now,
                updated=now,
            )
            for tr in trans_data:
                ManagementCategoryTranslations.objects.create(category=cat, **tr)
        return cat

    def update(self, instance, validated_data):
        from django.db import transaction
        from django.utils import timezone

        trans_data = validated_data.pop("translations", None)

        with transaction.atomic():
            for attr, val in validated_data.items():
                setattr(instance, attr, val)
            instance.updated = timezone.now()
            instance.save()

            if trans_data is not None:
                instance.managementcategorytranslations_set.all().delete()
                for tr in trans_data:
                    ManagementCategoryTranslations.objects.create(category=instance, **tr)

        instance.refresh_from_db()
        return instance

    def to_representation(self, instance):
        return ManagementCategoryReadSerializer(instance).data
