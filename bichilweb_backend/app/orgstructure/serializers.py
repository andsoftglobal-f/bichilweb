from rest_framework import serializers
from app.models.models import OrgStructure


class OrgStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgStructure
        fields = ("id", "page", "chart_data", "title", "description", "created", "updated")

    def update(self, instance, validated_data):
        instance.chart_data = validated_data.get('chart_data', instance.chart_data)
        instance.page = validated_data.get('page', instance.page)
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        return instance
