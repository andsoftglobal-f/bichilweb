from rest_framework import serializers
from app.models.models import HomePageLink


class HomePageLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomePageLink
        fields = ['id', 'title', 'page_url', 'placement', 'sort_order', 'active']
