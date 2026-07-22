from rest_framework import serializers
from app.models.models import ProductTutorial


class ProductTutorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTutorial
        fields = ['id', 'title_mn', 'title_en', 'video_url', 'thumbnail_url', 'index', 'active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
