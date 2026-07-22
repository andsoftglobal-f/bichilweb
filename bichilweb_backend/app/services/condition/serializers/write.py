from rest_framework import serializers
from app.models.models import ServiceCondition

class ServiceConditionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCondition
        fields = ("id", "service", "condition")