from rest_framework import serializers
from app.models.models import ManagementMember, ManagementMemberTranslations


class ManagementMemberTranslationSerializer(serializers.ModelSerializer):
    language = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ManagementMemberTranslations
        fields = ("id", "language", "name", "role", "description", "location", "district", "styles")


class ManagementMemberReadSerializer(serializers.ModelSerializer):
    translations = ManagementMemberTranslationSerializer(
        many=True,
        read_only=True,
        source='managementmembertranslations_set'
    )

    class Meta:
        model = ManagementMember
        fields = ("id", "type", "image", "sort_order", "active", "pinned", "translations")
