from rest_framework import serializers
from app.models.models import Partner, PartnerSectionConfig


class PartnerSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Partner
        fields = ['id', 'name', 'logo', 'logo_url', 'url', 'index', 'active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_logo_url(self, obj):
        if obj.logo:
            if str(obj.logo).startswith(('http://', 'https://')):
                return obj.logo
            return f'/media/partners/{obj.logo}'
        return None


class PartnerSectionConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerSectionConfig
        fields = [
            'id',
            'title_mn',
            'title_en',
            'title_color',
            'title_font_size',
            'title_font_family',
            'divider_width',
            'divider_height',
            'divider_color',
            'divider_margin_top',
            'divider_margin_bottom',
        ]
