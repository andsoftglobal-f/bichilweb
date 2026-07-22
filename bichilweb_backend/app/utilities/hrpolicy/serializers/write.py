from rest_framework import serializers
from app.models.models import HrPolicy, HrPolicyTranslations, HrPolicyCategory, HrPolicyCategoryTranslations


class HrPolicyCategoryTranslationsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = HrPolicyCategoryTranslations
        fields = ('language', 'name', 'desc')


class HrPolicyCategoryWriteSerializer(serializers.ModelSerializer):
    translations = HrPolicyCategoryTranslationsWriteSerializer(many=True)

    class Meta:
        model = HrPolicyCategory
        fields = ('id', 'key', 'sort_order', 'active', 'translations')
        extra_kwargs = {
            'key': {'required': True},
            'sort_order': {'required': False, 'default': 0},
            'active': {'required': False, 'default': True},
        }

    def create(self, validated_data):
        from django.utils import timezone
        translations_data = validated_data.pop('translations', [])
        validated_data['created_at'] = timezone.now()

        category = HrPolicyCategory.objects.create(**validated_data)

        for translation_data in translations_data:
            HrPolicyCategoryTranslations.objects.create(
                category=category,
                **translation_data
            )

        return category

    def update(self, instance, validated_data):
        translations_data = validated_data.pop('translations', None)

        for field in ['key', 'sort_order', 'active']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        instance.save()

        if translations_data is not None:
            instance.hrpolicycategorytranslations_set.all().delete()

            for translation_data in translations_data:
                HrPolicyCategoryTranslations.objects.create(
                    category=instance,
                    **translation_data
                )

        return instance

class HrPolicyTranslationsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = HrPolicyTranslations
        fields = ('language', 'name', 'desc')


class HrPolicyWriteSerializer(serializers.ModelSerializer):
    translations = HrPolicyTranslationsWriteSerializer(many=True)
    
    class Meta:
        model = HrPolicy
        fields = (
            'id', 'category', 'key', 'visual_type', 'visual_preset', 'font_color',
            'bg_color', 'fontsize', 'fontfamily', 'active',
            'icon_image', 'icon_url', 'translations'
        )
        extra_kwargs = {
            'key': {'required': True},
            'active': {'required': False, 'default': True}
        }
    
    def create(self, validated_data):
        from django.utils import timezone
        translations_data = validated_data.pop('translations', [])
        validated_data['created_at'] = timezone.now()
        
        policy = HrPolicy.objects.create(**validated_data)
        
        for translation_data in translations_data:
            HrPolicyTranslations.objects.create(
                policy=policy,
                **translation_data
            )
        
        return policy
    
    def update(self, instance, validated_data):
        translations_data = validated_data.pop('translations', None)
        
        for field in ['category', 'key', 'visual_type', 'visual_preset', 'font_color', 
                      'bg_color', 'fontsize', 'fontfamily', 'active',
                      'icon_image', 'icon_url']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        
        instance.save()
        
        if translations_data is not None:
            instance.hrpolicytranslations_set.all().delete()
            
            for translation_data in translations_data:
                HrPolicyTranslations.objects.create(
                    policy=instance,
                    **translation_data
                )
        
        return instance
