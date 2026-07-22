from rest_framework import serializers
from app.models.models import (
    CoreValue, CoreValueTitleTranslations, CoreValueDescTranslations, Language,
)


# ─── READ serializers ───

class TitleTranslationReadSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='label', read_only=True)

    class Meta:
        model = CoreValueTitleTranslations
        fields = ("id", "language", "title", "fontcolor", "fontsize",
                  "fontweight", "fontfamily", "letterspace", "textalign")


class DescTranslationReadSerializer(serializers.ModelSerializer):
    desc = serializers.CharField(source='label', read_only=True)

    class Meta:
        model = CoreValueDescTranslations
        fields = ("id", "language", "desc", "fontcolor", "fontsize",
                  "fontweight", "fontfamily", "letterspace", "textalign")


class CoreValueReadSerializer(serializers.ModelSerializer):
    title_translations = TitleTranslationReadSerializer(
        many=True, read_only=True, source='corevaluetitletranslations_set'
    )
    desc_translations = DescTranslationReadSerializer(
        many=True, read_only=True, source='corevaluedesctranslations_set'
    )

    class Meta:
        model = CoreValue
        fields = ("id", "file", "file_ratio", "index", "visible", "card_size",
                  "title_translations", "desc_translations")


# ─── WRITE serializers ───

class TitleTranslationWriteSerializer(serializers.Serializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())
    title = serializers.CharField(required=False, allow_blank=True, default='')
    fontcolor = serializers.CharField(required=False, allow_blank=True, default='')
    fontsize = serializers.IntegerField(required=False, default=14)
    fontweight = serializers.CharField(required=False, allow_blank=True, default='400')
    fontfamily = serializers.CharField(required=False, allow_blank=True, default='sans-serif')
    letterspace = serializers.CharField(required=False, allow_blank=True, default='0')
    textalign = serializers.CharField(required=False, allow_blank=True, default='left')


class DescTranslationWriteSerializer(serializers.Serializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())
    desc = serializers.CharField(required=False, allow_blank=True, default='')
    fontcolor = serializers.CharField(required=False, allow_blank=True, default='')
    fontsize = serializers.IntegerField(required=False, default=14)
    fontweight = serializers.CharField(required=False, allow_blank=True, default='400')
    fontfamily = serializers.CharField(required=False, allow_blank=True, default='sans-serif')
    letterspace = serializers.CharField(required=False, allow_blank=True, default='0')
    textalign = serializers.CharField(required=False, allow_blank=True, default='left')


class CoreValueWriteSerializer(serializers.ModelSerializer):
    file = serializers.CharField(required=False, allow_null=True, allow_blank=True, default=None)
    file_ratio = serializers.CharField(required=False, allow_null=True, allow_blank=True, default='16 / 9')
    card_size = serializers.CharField(required=False, allow_null=True, allow_blank=True, default='small')
    title_translations = TitleTranslationWriteSerializer(many=True, required=False)
    desc_translations = DescTranslationWriteSerializer(many=True, required=False)

    class Meta:
        model = CoreValue
        fields = ("id", "file", "file_ratio", "index", "visible", "card_size",
                  "title_translations", "desc_translations")
        read_only_fields = ("id",)

    def create(self, validated_data):
        from django.db import transaction

        title_data = validated_data.pop("title_translations", [])
        desc_data = validated_data.pop("desc_translations", [])

        with transaction.atomic():
            cv = CoreValue.objects.create(**validated_data)
            for tr in title_data:
                tr['label'] = tr.pop('title', '')
                CoreValueTitleTranslations.objects.create(corevalue=cv, **tr)
            for tr in desc_data:
                tr['label'] = tr.pop('desc', '')
                CoreValueDescTranslations.objects.create(corevalue=cv, **tr)
        return cv

    def update(self, instance, validated_data):
        from django.db import transaction

        title_data = validated_data.pop("title_translations", None)
        desc_data = validated_data.pop("desc_translations", None)

        with transaction.atomic():
            instance.file = validated_data.get("file", instance.file)
            instance.file_ratio = validated_data.get("file_ratio", instance.file_ratio)
            instance.index = validated_data.get("index", instance.index)
            instance.visible = validated_data.get("visible", instance.visible)
            instance.card_size = validated_data.get("card_size", instance.card_size)
            instance.save()

            if title_data is not None:
                instance.corevaluetitletranslations_set.all().delete()
                for tr in title_data:
                    tr['label'] = tr.pop('title', '')
                    CoreValueTitleTranslations.objects.create(corevalue=instance, **tr)

            if desc_data is not None:
                instance.corevaluedesctranslations_set.all().delete()
                for tr in desc_data:
                    tr['label'] = tr.pop('desc', '')
                    CoreValueDescTranslations.objects.create(corevalue=instance, **tr)

        instance.refresh_from_db()
        return instance

    def to_representation(self, instance):
        return CoreValueReadSerializer(instance).data
