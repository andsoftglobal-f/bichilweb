from rest_framework import serializers
from app.models.models import HrPolicy, HrPolicyTranslations, HrPolicyCategory, HrPolicyCategoryTranslations


class HrPolicyCategoryTranslationsReadSerializer(serializers.ModelSerializer):
    language_code = serializers.CharField(source='language.lang_code', read_only=True)
    language_name = serializers.CharField(source='language.lang_name', read_only=True)

    class Meta:
        model = HrPolicyCategoryTranslations
        fields = ('id', 'language', 'language_code', 'language_name', 'name', 'desc')


class HrPolicyCategoryReadSerializer(serializers.ModelSerializer):
    translations = HrPolicyCategoryTranslationsReadSerializer(
        source='hrpolicycategorytranslations_set',
        many=True,
        read_only=True
    )

    class Meta:
        model = HrPolicyCategory
        fields = ('id', 'key', 'sort_order', 'active', 'created_at', 'translations')

class HrPolicyTranslationsReadSerializer(serializers.ModelSerializer):
    language_code = serializers.CharField(source='language.lang_code', read_only=True)
    language_name = serializers.CharField(source='language.lang_name', read_only=True)
    
    class Meta:
        model = HrPolicyTranslations
        fields = ('id', 'language', 'language_code', 'language_name', 'name', 'desc')


class HrPolicyReadSerializer(serializers.ModelSerializer):
    translations = HrPolicyTranslationsReadSerializer(
        source='hrpolicytranslations_set',
        many=True,
        read_only=True
    )
    category_detail = HrPolicyCategoryReadSerializer(source='category', read_only=True)
    
    class Meta:
        model = HrPolicy
        fields = (
            'id', 'category', 'category_detail', 'key', 'visual_type', 'visual_preset', 'font_color',
            'bg_color', 'fontsize', 'fontfamily', 'active', 'created_at',
            'icon_image', 'icon_url', 'translations'
        )
