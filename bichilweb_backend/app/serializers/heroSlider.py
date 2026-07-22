from rest_framework import serializers
from app.models.models import HeroSlider
from django.conf import settings

class HeroSliderSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    tablet_file_url = serializers.SerializerMethodField()
    mobile_file_url = serializers.SerializerMethodField()

    class Meta:
        model = HeroSlider
        fields = "__all__" 

    def _build_url(self, value):
        """
        Full URL байвал шууд буцаана.
        Хуучин local path байвал absolute URL үүсгэнэ.
        """
        if not value:
            return None
        # Storage эсвэл бусад full URL
        if value.startswith('http://') or value.startswith('https://'):
            return value
        # Хуучин local path (media/hero_sliders/...)
        return self.context['request'].build_absolute_uri('/' + value)

    def get_file_url(self, obj):
        return self._build_url(obj.file)

    def get_tablet_file_url(self, obj):
        return self._build_url(obj.tablet_file)

    def get_mobile_file_url(self, obj):
        return self._build_url(obj.mobile_file)
