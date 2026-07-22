from rest_framework import serializers
from app.models.models import StatsConfig


class StatsConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatsConfig
        fields = [
            'id', 'title_mn', 'title_en', 'description_mn', 'description_en',
            'section_image', 'value_color', 'value_font_size',
            'label_color', 'label_font_size', 'suffix_color',
            'title_color', 'title_font_size',
            'description_color', 'description_font_size',
            'mobile_title_font_size', 'mobile_description_font_size',
            'mobile_value_font_size', 'mobile_label_font_size',
            'fontfamily',
            'text_active', 'image_active', 'updated_at',
        ]
        read_only_fields = ['updated_at']
