from rest_framework import serializers
from app.models.models import (
    AboutPage, AboutPageSection, AboutPageBlock,
    AboutPageSectionTranslations, AboutPageBlockTranslations,
    AboutPageMedia, Language,
)


# ─── READ serializers ───

class BlockTranslationReadSerializer(serializers.ModelSerializer):
    language_code = serializers.SerializerMethodField()
    language_name = serializers.SerializerMethodField()

    class Meta:
        model = AboutPageBlockTranslations
        fields = ("id", "language", "language_code", "language_name",
                  "content", "fontcolor", "fontsize", "fontweight", "fontfamily")

    def get_language_code(self, obj):
        return obj.language.lang_code.upper() if obj.language and obj.language.lang_code else None

    def get_language_name(self, obj):
        return obj.language.lang_name if obj.language else None


class SectionTranslationReadSerializer(serializers.ModelSerializer):
    language_code = serializers.SerializerMethodField()
    language_name = serializers.SerializerMethodField()

    class Meta:
        model = AboutPageSectionTranslations
        fields = ("id", "language", "language_code", "language_name",
                  "title", "color", "fontsize", "fontweight", "fontfamily")

    def get_language_code(self, obj):
        return obj.language.lang_code.upper() if obj.language and obj.language.lang_code else None

    def get_language_name(self, obj):
        return obj.language.lang_name if obj.language else None


class BlockReadSerializer(serializers.ModelSerializer):
    translations = BlockTranslationReadSerializer(
        many=True, read_only=True, source='aboutpageblocktranslations_set'
    )

    class Meta:
        model = AboutPageBlock
        fields = ("id", "index", "visible", "translations")


class SectionReadSerializer(serializers.ModelSerializer):
    translations = SectionTranslationReadSerializer(
        many=True, read_only=True, source='aboutpagesectiontranslations_set'
    )
    blocks = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    image_position = serializers.SerializerMethodField()

    class Meta:
        model = AboutPageSection
        fields = ("id", "index", "visible", "image", "image_position", "created", "updated", "translations", "blocks")

    def get_image(self, obj):
        try:
            return obj.image or ''
        except Exception:
            return ''

    def get_image_position(self, obj):
        try:
            return obj.image_position or 'right'
        except Exception:
            return 'right'

    def get_blocks(self, obj):
        blocks = obj.aboutpageblock_set.all().order_by('index')
        return BlockReadSerializer(blocks, many=True).data


class MediaReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutPageMedia
        fields = ("id", "file", "aspect_ratio")


class AboutPageReadSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()
    media = MediaReadSerializer(many=True, read_only=True, source='aboutpagemedia_set')

    class Meta:
        model = AboutPage
        fields = ("id", "key", "active", "created", "updated", "sections", "media")

    def get_sections(self, obj):
        sections = obj.aboutpagesection_set.all().order_by('index')
        return SectionReadSerializer(sections, many=True).data


# ─── WRITE serializers ───

class BlockTranslationWriteSerializer(serializers.Serializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())
    content = serializers.CharField(required=False, allow_blank=True, default='')
    fontcolor = serializers.CharField(required=False, allow_blank=True, default='')
    fontsize = serializers.CharField(required=False, allow_blank=True, default='')
    fontweight = serializers.CharField(required=False, allow_blank=True, default='')
    fontfamily = serializers.CharField(required=False, allow_blank=True, default='')


class SectionTranslationWriteSerializer(serializers.Serializer):
    language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())
    title = serializers.CharField(required=False, allow_blank=True, default='')
    color = serializers.CharField(required=False, allow_blank=True, default='')
    fontsize = serializers.CharField(required=False, allow_blank=True, default='')
    fontweight = serializers.CharField(required=False, allow_blank=True, default='')
    fontfamily = serializers.CharField(required=False, allow_blank=True, default='')


class BlockWriteSerializer(serializers.Serializer):
    index = serializers.IntegerField(default=0)
    visible = serializers.BooleanField(default=True)
    translations = BlockTranslationWriteSerializer(many=True, required=False)


class SectionWriteSerializer(serializers.Serializer):
    index = serializers.IntegerField(default=0)
    visible = serializers.BooleanField(default=True)
    image = serializers.CharField(required=False, allow_blank=True, default='')
    image_position = serializers.CharField(required=False, allow_blank=True, default='right')
    translations = SectionTranslationWriteSerializer(many=True, required=False)
    blocks = BlockWriteSerializer(many=True, required=False)


class MediaWriteSerializer(serializers.Serializer):
    file = serializers.CharField(required=False, allow_blank=True, default='')
    aspect_ratio = serializers.CharField(required=False, allow_blank=True, default='')


class AboutPageWriteSerializer(serializers.ModelSerializer):
    sections = SectionWriteSerializer(many=True, required=False)
    media = MediaWriteSerializer(many=True, required=False)

    class Meta:
        model = AboutPage
        fields = ("id", "key", "active", "sections", "media")
        read_only_fields = ("id",)

    def create(self, validated_data):
        from django.db import transaction
        from django.utils import timezone

        sections_data = validated_data.pop("sections", [])
        media_data = validated_data.pop("media", [])

        now = timezone.now()
        with transaction.atomic():
            page = AboutPage.objects.create(
                key=validated_data.get("key", ""),
                active=validated_data.get("active", True),
                created=now,
                updated=now,
            )
            self._write_sections(page, sections_data)
            self._write_media(page, media_data)
        return page

    def update(self, instance, validated_data):
        from django.db import transaction
        from django.utils import timezone

        sections_data = validated_data.pop("sections", None)
        media_data = validated_data.pop("media", None)

        with transaction.atomic():
            instance.key = validated_data.get("key", instance.key)
            instance.active = validated_data.get("active", instance.active)
            instance.updated = timezone.now()
            instance.save()

            if sections_data is not None:
                # Delete old sections and everything under them
                for section in instance.aboutpagesection_set.all():
                    for block in section.aboutpageblock_set.all():
                        block.aboutpageblocktranslations_set.all().delete()
                    section.aboutpageblock_set.all().delete()
                    section.aboutpagesectiontranslations_set.all().delete()
                instance.aboutpagesection_set.all().delete()
                self._write_sections(instance, sections_data)

            if media_data is not None:
                instance.aboutpagemedia_set.all().delete()
                self._write_media(instance, media_data)

        instance.refresh_from_db()
        return instance

    def _write_sections(self, page, sections_data):
        from django.utils import timezone
        now = timezone.now()
        for sec_data in sections_data:
            blocks_data = sec_data.pop("blocks", [])
            trans_data = sec_data.pop("translations", [])
            section = AboutPageSection.objects.create(
                page=page,
                index=sec_data.get("index", 0),
                visible=sec_data.get("visible", True),
                image=sec_data.get("image", ''),
                image_position=sec_data.get("image_position", 'right'),
                created=now,
                updated=now,
            )
            for tr in trans_data:
                AboutPageSectionTranslations.objects.create(section=section, **tr)
            for blk_data in blocks_data:
                blk_trans_data = blk_data.pop("translations", [])
                block = AboutPageBlock.objects.create(
                    section=section,
                    index=blk_data.get("index", 0),
                    visible=blk_data.get("visible", True),
                )
                for tr in blk_trans_data:
                    AboutPageBlockTranslations.objects.create(block=block, **tr)

    def _write_media(self, page, media_data):
        for m in media_data:
            AboutPageMedia.objects.create(about=page, **m)

    def to_representation(self, instance):
        return AboutPageReadSerializer(instance).data
