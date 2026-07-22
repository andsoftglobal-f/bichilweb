from rest_framework import serializers
from app.models.models import AboutBanner, AboutBannerTranslations, Language


# ─── READ ───

class BannerTranslationReadSerializer(serializers.ModelSerializer):
    language_code = serializers.SerializerMethodField()

    class Meta:
        model = AboutBannerTranslations
        fields = ("id", "language", "language_code", "title", "subtitle", "fontfamily")

    def get_language_code(self, obj):
        return obj.language.lang_code.upper() if obj.language and obj.language.lang_code else None


class AboutBannerReadSerializer(serializers.ModelSerializer):
    translations = BannerTranslationReadSerializer(
        many=True, read_only=True, source='aboutbannertranslations_set'
    )

    class Meta:
        model = AboutBanner
        fields = ("id", "page", "image", "mobile_image", "sort_order", "active", "translations", "created", "updated")


# ─── WRITE ───

class BannerTranslationWriteSerializer(serializers.Serializer):
    language = serializers.IntegerField()
    title = serializers.CharField(allow_blank=True, required=False, default='')
    subtitle = serializers.CharField(allow_blank=True, required=False, default='')
    fontfamily = serializers.CharField(allow_blank=True, required=False, default='')


class AboutBannerWriteSerializer(serializers.ModelSerializer):
    translations = BannerTranslationWriteSerializer(many=True, required=False)

    class Meta:
        model = AboutBanner
        fields = ("id", "page", "image", "mobile_image", "sort_order", "active", "translations")

    def create(self, validated_data):
        translations_data = validated_data.pop('translations', [])
        banner = AboutBanner.objects.create(**validated_data)
        for tr in translations_data:
            lang = Language.objects.get(id=tr['language'])
            AboutBannerTranslations.objects.create(
                banner=banner,
                language=lang,
                title=tr.get('title', ''),
                subtitle=tr.get('subtitle', ''),
                fontfamily=tr.get('fontfamily', ''),
            )
        return banner

    def update(self, instance, validated_data):
        translations_data = validated_data.pop('translations', [])
        instance.page = validated_data.get('page', instance.page)
        instance.image = validated_data.get('image', instance.image)
        instance.mobile_image = validated_data.get('mobile_image', instance.mobile_image)
        instance.sort_order = validated_data.get('sort_order', instance.sort_order)
        instance.active = validated_data.get('active', instance.active)
        instance.save()

        # Delete old, recreate
        instance.aboutbannertranslations_set.all().delete()
        for tr in translations_data:
            lang = Language.objects.get(id=tr['language'])
            AboutBannerTranslations.objects.create(
                banner=instance,
                language=lang,
                title=tr.get('title', ''),
                subtitle=tr.get('subtitle', ''),
                fontfamily=tr.get('fontfamily', ''),
            )
        return instance
