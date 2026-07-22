from rest_framework import serializers
from app.models.models import ExchangeRateConfig


class ExchangeRateConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRateConfig
        fields = ('id', 'config_json', 'updated_at')


class ExchangeRateConfigWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRateConfig
        fields = ('config_json',)
