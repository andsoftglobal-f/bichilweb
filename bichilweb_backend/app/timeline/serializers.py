from rest_framework import serializers
from app.models.models import TimelineEvent, TimelineEventTranslations, Language


# ─── READ ───

class TimelineTranslationReadSerializer(serializers.ModelSerializer):
    language_code = serializers.SerializerMethodField()

    class Meta:
        model = TimelineEventTranslations
        fields = ("id", "language", "language_code", "title", "short_desc", "full_desc")

    def get_language_code(self, obj):
        return obj.language.lang_code.upper() if obj.language and obj.language.lang_code else None


class TimelineEventReadSerializer(serializers.ModelSerializer):
    translations = TimelineTranslationReadSerializer(
        many=True, read_only=True, source='timelineeventtranslations_set'
    )

    class Meta:
        model = TimelineEvent
        fields = (
            "id", "page", "year", "sort_order", "visible", "image",
            "year_color", "title_color", "short_color", "desc_color",
            "translations",
        )


# ─── WRITE ───

class TimelineTranslationWriteSerializer(serializers.Serializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())
    title = serializers.CharField(required=False, allow_blank=True, default='')
    short_desc = serializers.CharField(required=False, allow_blank=True, default='')
    full_desc = serializers.CharField(required=False, allow_blank=True, default='')


class TimelineEventWriteSerializer(serializers.ModelSerializer):
    translations = TimelineTranslationWriteSerializer(many=True, required=False)

    class Meta:
        model = TimelineEvent
        fields = (
            "id", "page", "year", "sort_order", "visible", "image",
            "year_color", "title_color", "short_color", "desc_color",
            "translations",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        from django.db import transaction
        from django.utils import timezone

        trans_data = validated_data.pop("translations", [])
        now = timezone.now()

        with transaction.atomic():
            event = TimelineEvent.objects.create(
                **validated_data,
                created=now,
                updated=now,
            )
            for tr in trans_data:
                TimelineEventTranslations.objects.create(event=event, **tr)
        return event

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
                instance.timelineeventtranslations_set.all().delete()
                for tr in trans_data:
                    TimelineEventTranslations.objects.create(event=instance, **tr)

        instance.refresh_from_db()
        return instance

    def to_representation(self, instance):
        return TimelineEventReadSerializer(instance).data
