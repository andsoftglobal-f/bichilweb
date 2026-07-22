from rest_framework import serializers
from app.models.models import AppDownloadTitle, AppDownloadTitleTranslation, AppDownloadTitlePosition, AppDownload

from app.models.models import Language

class AppDownloadTitleTranslationSerializer(serializers.ModelSerializer):
    language_id = serializers.PrimaryKeyRelatedField(
        source='language', queryset=Language.objects.all()
    )

    class Meta:
        model = AppDownloadTitleTranslation
        fields = ['id', 'language_id', 'label']


class AppDownloadTitlePositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppDownloadTitlePosition
        fields = ['id', 'top', 'left', 'rotate', 'size']


class AppDownloadTitleSerializer(serializers.ModelSerializer):
    app_download_id = serializers.PrimaryKeyRelatedField(
        source='app_download',  # model-д байгаа ForeignKey
        queryset=AppDownload.objects.all(),
        write_only=True,
        required=False,
    )

    translations = AppDownloadTitleTranslationSerializer(many=True, write_only=True)
    position = AppDownloadTitlePositionSerializer(write_only=True, required=False)

    translations_read = AppDownloadTitleTranslationSerializer(
        source='appdownloadtitletranslation_set', many=True, read_only=True
    )
    position_read = AppDownloadTitlePositionSerializer(
        source='appdownloadtitleposition_set', many=True, read_only=True
    )

    class Meta:
        model = AppDownloadTitle
        fields = [
            'id', 'app_download_id',
            'translations', 'translations_read',
            'position', 'position_read'
        ]

    def create(self, validated_data):
        translations_data = validated_data.pop('translations', [])
        position_data = validated_data.pop('position', None)

        title = AppDownloadTitle.objects.create(**validated_data)

        for t_data in translations_data:
            AppDownloadTitleTranslation.objects.create(app_download_title=title, **t_data)

        if position_data:
            AppDownloadTitlePosition.objects.create(app_download_title=title, **position_data)

        return title

    def update(self, instance, validated_data):
        translations_data = validated_data.pop('translations', [])
        position_data = validated_data.pop('position', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if translations_data:
            instance.appdownloadtitletranslation_set.all().delete()
            for t_data in translations_data:
                AppDownloadTitleTranslation.objects.create(app_download_title=instance, **t_data)

        if position_data:
            instance.appdownloadtitleposition_set.all().delete()
            AppDownloadTitlePosition.objects.create(app_download_title=instance, **position_data)

        return instance
