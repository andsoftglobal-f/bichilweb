from rest_framework import serializers
from django.utils import timezone
from app.models.models import HrSection, HrSectionTranslations


class HrSectionTranslationsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = HrSectionTranslations
        fields = ('language', 'title', 'subtitle', 'description', 'btn_text')


class HrSectionWriteSerializer(serializers.ModelSerializer):
    translations = HrSectionTranslationsWriteSerializer(many=True, required=False)

    class Meta:
        model = HrSection
        fields = (
            'id',
            'title_fontfamily', 'title_fontsize', 'title_color', 'title_weight',
            'subtitle_fontfamily', 'subtitle_fontsize', 'subtitle_color', 'subtitle_weight',
            'desc_fontfamily', 'desc_fontsize', 'desc_color',
            'btn_bg', 'btn_color', 'btn_radius', 'btn_fontfamily', 'btn_fontsize', 'btn_fontweight',
            'section_bg', 'section_border_radius', 'section_border_color', 'section_border_width',
            'accent_gradient',
            'banner_image', 'banner_url',
            'banner_desktop_image', 'banner_desktop_url',
            'banner_tablet_image', 'banner_tablet_url',
            'banner_mobile_image', 'banner_mobile_url',
            'icon_image', 'icon_url',
            'policy_title_fontfamily', 'policy_title_fontsize', 'policy_title_color', 'policy_title_weight',
            'policy_desc_fontsize', 'policy_desc_color',
            'policy_card_bg', 'policy_card_border_color', 'policy_card_border_radius',
            'jobs_title_fontfamily', 'jobs_title_fontsize', 'jobs_title_color', 'jobs_title_weight',
            'jobs_desc_fontsize', 'jobs_desc_color',
            'jobs_card_bg', 'jobs_card_border_color', 'jobs_card_border_radius',
            'jobs_badge_bg', 'jobs_badge_color',
            'btn_icon_image', 'btn_icon_url',
            'policy_tab_icon_image', 'policy_tab_icon_url',
            'jobs_tab_icon_image', 'jobs_tab_icon_url',
            'jobs_icon_image', 'jobs_icon_url',
            'policy_tab_active_bg', 'policy_tab_active_color',
            'jobs_tab_active_bg', 'jobs_tab_active_color',
            'translations',
        )
        read_only_fields = ('id',)

    def create(self, validated_data):
        translations_data = validated_data.pop('translations', [])
        validated_data['created_at'] = timezone.now()
        validated_data['updated_at'] = timezone.now()
        section = HrSection.objects.create(**validated_data)
        for tr in translations_data:
            HrSectionTranslations.objects.create(section=section, **tr)
        return section

    def update(self, instance, validated_data):
        translations_data = validated_data.pop('translations', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.updated_at = timezone.now()
        instance.save()
        if translations_data is not None:
            instance.hrsectiontranslations_set.all().delete()
            for tr in translations_data:
                HrSectionTranslations.objects.create(section=instance, **tr)
        return instance
