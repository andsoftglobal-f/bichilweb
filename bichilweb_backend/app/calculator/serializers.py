from rest_framework import serializers
from app.models.models import LoanCalculatorConfig

STYLE_FIELDS = [
    'calc_btn_color', 'calc_btn_font_size', 'calc_btn_text',
    'request_btn_color', 'request_btn_font_size', 'request_btn_text', 'request_btn_url',
    'disclaimer_color', 'disclaimer_font_size', 'disclaimer_text',
    'banner_image', 'banner_mobile_image',
    'title_mn', 'title_en', 'subtitle_mn', 'subtitle_en',
    'text_styles',
]


class LoanCalculatorConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanCalculatorConfig
        fields = [
            'id', 'key', 'default_amount', 'default_rate', 'default_term',
            'max_amount', 'max_term', 'min_rate', 'max_rate',
            'active', 'created_at', 'updated_at',
        ] + STYLE_FIELDS
        read_only_fields = ['id', 'created_at', 'updated_at']


class LoanCalculatorConfigWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanCalculatorConfig
        fields = [
            'id', 'key', 'default_amount', 'default_rate', 'default_term',
            'max_amount', 'max_term', 'min_rate', 'max_rate',
            'active',
        ] + STYLE_FIELDS
        read_only_fields = ['id']

    def create(self, validated_data):
        from django.utils import timezone
        validated_data['created_at'] = timezone.now()
        validated_data['updated_at'] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        from django.utils import timezone
        validated_data['updated_at'] = timezone.now()
        return super().update(instance, validated_data)
