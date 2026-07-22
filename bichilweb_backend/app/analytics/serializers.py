from rest_framework import serializers
from app.models.models import SiteAnalytics


class SiteAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteAnalytics
        fields = ['id', 'session_id', 'visitor_id', 'page_path', 'page_title',
                  'referrer', 'user_agent', 'device_type', 'ip_address', 'created_at']
        read_only_fields = ['id', 'created_at']


class TrackPageViewSerializer(serializers.Serializer):
    session_id = serializers.CharField(max_length=64)
    visitor_id = serializers.CharField(max_length=64)
    page_path = serializers.CharField(max_length=500)
    page_title = serializers.CharField(max_length=500, required=False, default='')
    referrer = serializers.CharField(max_length=500, required=False, default='')
    user_agent = serializers.CharField(required=False, default='')
    device_type = serializers.CharField(max_length=20, required=False, default='desktop')
