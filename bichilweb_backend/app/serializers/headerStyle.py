from rest_framework import serializers
from app.models.models import HeaderStyle


class HeaderStyleSerializer(serializers.ModelSerializer):
    # max_width, logo_size баганууд production DB-д байхгүй байж болно
    # SerializerMethodField ашиглан аюулгүй уншина
    max_width = serializers.SerializerMethodField()
    logo_size = serializers.SerializerMethodField()

    class Meta:
        model = HeaderStyle
        fields = ('id', 'header', 'bgcolor', 'fontcolor', 'hovercolor', 'height', 'sticky', 'max_width', 'logo_size')

    def get_max_width(self, obj):
        try:
            return obj.max_width or '1240px'
        except Exception:
            return '1240px'

    def get_logo_size(self, obj):
        try:
            return obj.logo_size or 44
        except Exception:
            return 44

    def create(self, validated_data):
        # max_width, logo_size нь SerializerMethodField тул validated_data-д байхгүй
        # Тэдгээрийг request data-аас шууд авна
        request = self.context.get('request')
        if request and request.data:
            validated_data['max_width'] = request.data.get('max_width', '1240px')
            validated_data['logo_size'] = request.data.get('logo_size', 44)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and request.data:
            validated_data['max_width'] = request.data.get('max_width', instance.max_width if hasattr(instance, 'max_width') else '1240px')
            validated_data['logo_size'] = request.data.get('logo_size', instance.logo_size if hasattr(instance, 'logo_size') else 44)
        return super().update(instance, validated_data)
