from rest_framework import serializers
from app.models.models import AppDownloadList, AppDownloadListTranslation, Language, AppDownload

class AppDownloadListTranslationSerializer(serializers.ModelSerializer):
    language_id = serializers.PrimaryKeyRelatedField(
        source='language', queryset=Language.objects.all()
    )

    class Meta:
        model = AppDownloadListTranslation
        fields = ['id', 'language_id', 'label']


class AppDownloadListSerializer(serializers.ModelSerializer):
    app_download_id = serializers.PrimaryKeyRelatedField(
        source='app_download',  
        queryset=AppDownload.objects.all(),
        write_only=True,
        required=False,  
    )
    
    translations = AppDownloadListTranslationSerializer(
        many=True, write_only=True
    )
    translations_read = AppDownloadListTranslationSerializer(
        source='appdownloadlisttranslation_set', many=True, read_only=True
    )

    class Meta:
        model = AppDownloadList
        fields = ['id', 'app_download_id', 'translations', 'translations_read']

    def create(self, validated_data):
        translations_data = validated_data.pop('translations', [])
        app_list = AppDownloadList.objects.create(**validated_data)
        for t_data in translations_data:
            AppDownloadListTranslation.objects.create(app_download_list=app_list, **t_data)
        return app_list

    def update(self, instance, validated_data):
        translations_data = validated_data.pop('translations', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if translations_data:
            instance.appdownloadlisttranslation_set.all().delete()
            for t_data in translations_data:
                AppDownloadListTranslation.objects.create(app_download_list=instance, **t_data)

        return instance
