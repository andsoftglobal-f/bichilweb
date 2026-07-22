from rest_framework import serializers
from app.models.models import ServiceCollateral

class ServiceCollateralWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCollateral
        fields = ("id", "service", "collateral")