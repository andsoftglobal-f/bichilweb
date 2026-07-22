from rest_framework import serializers
from app.models.models import ProductTutorialConfig


class ProductTutorialConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTutorialConfig
        fields = [
            'id',
            'title_mn',
            'title_en',
            'title_color',
            'title_font_size',
            'title_font_family',
            'title_align',
            'bg_color',
            'divider_width',
            'divider_height',
            'divider_color',
            'divider_margin_top',
            'divider_margin_bottom',
        ]
