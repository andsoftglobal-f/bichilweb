from rest_framework import serializers
from app.models.models import StatItem


class StatItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatItem
        fields = ['id', 'label_mn', 'label_en', 'value', 'prefix', 'suffix', 'suffix_color', 'icon', 'index', 'active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
