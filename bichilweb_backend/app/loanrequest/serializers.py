from rest_framework import serializers
from app.models.models import LoanRequest, LoanRequestPage
import re


class LoanRequestWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanRequest
        fields = ('first_name', 'last_name', 'phone', 'product')

    def validate_phone(self, value):
        if not re.match(r'^\d{8}$', value):
            raise serializers.ValidationError('Утасны дугаар 8 оронтой тоо байх ёстой.')
        return value

    def validate_first_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Нэр заавал оруулна уу.')
        return value.strip()

    def validate_last_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Овог заавал оруулна уу.')
        return value.strip()


class LoanRequestReadSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()

    class Meta:
        model = LoanRequest
        fields = ('id', 'first_name', 'last_name', 'phone', 'product', 'product_name', 'status', 'created_at', 'updated_at')

    def get_product_name(self, obj):
        if obj.product:
            translations = obj.product.producttranslations_set.all()
            mn = next((t.label for t in translations if t.language_id == 2), None)
            en = next((t.label for t in translations if t.language_id == 1), None)
            return mn or en or f'Product #{obj.product.id}'
        return None


class LoanRequestPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanRequestPage
        fields = '__all__'
