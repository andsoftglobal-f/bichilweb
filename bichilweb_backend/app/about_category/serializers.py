from rest_framework import serializers
from app.models.models import AboutCategory, AboutCategoryTranslations, Language, Pages


# ─── READ ───

class AboutCategoryTranslationReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutCategoryTranslations
        fields = ('id', 'language', 'label', 'description')


class AboutCategoryReadSerializer(serializers.ModelSerializer):
    translations = AboutCategoryTranslationReadSerializer(
        many=True, read_only=True, source='aboutcategorytranslations_set'
    )
    page_url = serializers.SerializerMethodField()

    def get_page_url(self, obj):
        if obj.page_url:
            return obj.page_url

        slug = (obj.slug or '').strip()
        normalized_slug = slug.strip('/')
        if not normalized_slug:
            return ''

        candidates = list(dict.fromkeys([slug, normalized_slug, f'/{normalized_slug}']))
        return Pages.objects.filter(url__in=candidates).values_list('url', flat=True).first() or ''

    class Meta:
        model = AboutCategory
        fields = ('id', 'slug', 'icon', 'image', 'page_url', 'sort_order', 'active', 'content', 'translations')


# ─── WRITE ───

class AboutCategoryTranslationWriteSerializer(serializers.Serializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())
    label = serializers.CharField(required=False, allow_blank=True, default='')
    description = serializers.CharField(required=False, allow_blank=True, default='')


class AboutCategoryWriteSerializer(serializers.ModelSerializer):
    translations = AboutCategoryTranslationWriteSerializer(many=True, required=False)

    class Meta:
        model = AboutCategory
        fields = ('id', 'slug', 'icon', 'image', 'page_url', 'sort_order', 'active', 'content', 'translations')
        read_only_fields = ('id',)

    def create(self, validated_data):
        from django.db import transaction
        trans_data = validated_data.pop('translations', [])
        with transaction.atomic():
            cat = AboutCategory.objects.create(**validated_data)
            for tr in trans_data:
                AboutCategoryTranslations.objects.create(category=cat, **tr)
        return cat

    def update(self, instance, validated_data):
        from django.db import transaction
        trans_data = validated_data.pop('translations', None)
        with transaction.atomic():
            for attr, val in validated_data.items():
                setattr(instance, attr, val)
            instance.save()
            if trans_data is not None:
                instance.aboutcategorytranslations_set.all().delete()
                for tr in trans_data:
                    AboutCategoryTranslations.objects.create(category=instance, **tr)
        instance.refresh_from_db()
        return instance
