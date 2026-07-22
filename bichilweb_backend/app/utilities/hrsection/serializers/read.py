from rest_framework import serializers
from app.models.models import HrSection, HrSectionTranslations


class HrSectionTranslationsReadSerializer(serializers.ModelSerializer):
    language_code = serializers.CharField(source='language.lang_code', read_only=True)

    class Meta:
        model = HrSectionTranslations
        fields = ('id', 'language', 'language_code', 'title', 'subtitle', 'description', 'btn_text')


class HrSectionReadSerializer(serializers.ModelSerializer):
    translations = HrSectionTranslationsReadSerializer(
        source='hrsectiontranslations_set',
        many=True,
        read_only=True
    )

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
