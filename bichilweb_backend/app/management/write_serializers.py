from rest_framework import serializers
from django.db import transaction
from app.models.models import ManagementMember, ManagementMemberTranslations, Language


class ManagementMemberTranslationWriteSerializer(serializers.Serializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())
    name = serializers.CharField(required=False, allow_blank=True, default='')
    role = serializers.CharField(required=False, allow_blank=True, default='')
    description = serializers.CharField(required=False, allow_blank=True, default='')
    location = serializers.CharField(required=False, allow_blank=True, default='')
    district = serializers.CharField(required=False, allow_blank=True, default='')
    styles = serializers.CharField(required=False, allow_blank=True, default='{}')


class ManagementMemberWriteSerializer(serializers.ModelSerializer):
    translations = ManagementMemberTranslationWriteSerializer(many=True, required=False)

    class Meta:
        model = ManagementMember
        fields = ("id", "type", "image", "sort_order", "active", "pinned", "translations")
        read_only_fields = ("id",)

    def create(self, validated_data):
        translations_data = validated_data.pop("translations", [])
        with transaction.atomic():
            member = ManagementMember.objects.create(**validated_data)
            for tr in translations_data:
                ManagementMemberTranslations.objects.create(member=member, **tr)
        return member

    def update(self, instance, validated_data):
        translations_data = validated_data.pop("translations", None)
        with transaction.atomic():
            instance.type = validated_data.get("type", instance.type)
            instance.image = validated_data.get("image", instance.image)
            instance.sort_order = validated_data.get("sort_order", instance.sort_order)
            instance.active = validated_data.get("active", instance.active)
            instance.pinned = validated_data.get("pinned", instance.pinned)
            instance.save()

            if translations_data is not None:
                instance.managementmembertranslations_set.all().delete()
                for tr in translations_data:
                    ManagementMemberTranslations.objects.create(member=instance, **tr)

        instance.refresh_from_db()
        return instance

    def to_representation(self, instance):
        from app.management.serializers import ManagementMemberReadSerializer
        return ManagementMemberReadSerializer(instance).data
