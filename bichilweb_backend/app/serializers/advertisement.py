from rest_framework import serializers
from app.models.models import Advertisement, AdConfig


class AdvertisementSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Advertisement
        fields = [
            'id', 'title', 'description', 'image', 'image_url',
            'url', 'button_text', 'button_font_family', 'button_text_color',
            'button_hover_text_color', 'button_text_size', 'index', 'active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_image_url(self, obj):
        if obj.image:
            if str(obj.image).startswith(('http://', 'https://')):
                return obj.image
            return f'/media/{obj.image}'
        return None


class AdConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdConfig
        fields = ['id', 'interval_seconds']
