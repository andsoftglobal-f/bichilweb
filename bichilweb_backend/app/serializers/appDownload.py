from rest_framework import serializers
from app.models.models import AppDownload, AppDownloadTitle, AppDownloadList
import json


class AppDownloadTitleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppDownloadTitle
        fields = ['id', 'index', 'labelmn', 'labelen', 'color', 'fontsize', 'fontweight', 'top', 'left', 'rotate', 'size']


class AppDownloadListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppDownloadList
        fields = ['id', 'index', 'labelmn', 'labelen', 'icon', 'icon_url']


class AppDownloadReadSerializer(serializers.ModelSerializer):
    titles = AppDownloadTitleSerializer(many=True, read_only=True)
    lists = AppDownloadListItemSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = AppDownload
        fields = [
            'id', 'image', 'image_url', 'index', 'appstore', 'playstore',
            'bgcolor', 'fontcolor', 'titlecolor', 'iconcolor',
            'buttonbgcolor', 'buttonfontcolor',
            'googlebuttonbgcolor', 'googlebuttonfontcolor',
            'active', 'appstore_active', 'playstore_active',
            'layout', 'mobile_layout', 'features_layout',
            'fontfamily',
            'titles', 'lists',
        ]

    def get_image_url(self, obj):
        if obj.image:
            # Full URL бол шууд буцаах
            if str(obj.image).startswith(('http://', 'https://')):
                return obj.image
            # Хуучин local path
            return f'/media/app_download/{obj.image}'
        return None


class AppDownloadWriteSerializer(serializers.ModelSerializer):
    titles = AppDownloadTitleSerializer(many=True, required=False)
    lists = AppDownloadListItemSerializer(many=True, required=False)
    image_file = serializers.FileField(required=False, write_only=True)

    class Meta:
        model = AppDownload
        fields = [
            'id', 'image', 'index', 'appstore', 'playstore',
            'bgcolor', 'fontcolor', 'titlecolor', 'iconcolor',
            'buttonbgcolor', 'buttonfontcolor',
            'googlebuttonbgcolor', 'googlebuttonfontcolor',
            'active', 'appstore_active', 'playstore_active',
            'layout', 'mobile_layout', 'features_layout',
            'fontfamily',
            'titles', 'lists', 'image_file',
        ]

    def to_internal_value(self, data):
        import django.http
        if isinstance(data, django.http.QueryDict):
            plain = {}
            for key in data:
                if key in ('titles', 'lists'):
                    raw = data.get(key)
                    if isinstance(raw, str):
                        try:
                            parsed = json.loads(raw)
                            if isinstance(parsed, list):
                                plain[key] = parsed
                                continue
                        except (json.JSONDecodeError, TypeError):
                            pass
                    plain[key] = raw
                elif key == 'image_file':
                    plain[key] = data.get(key)
                else:
                    plain[key] = data.get(key)
            return super().to_internal_value(plain)
        return super().to_internal_value(data)

    def create(self, validated_data):
        titles_data = validated_data.pop('titles', None)
        lists_data = validated_data.pop('lists', None)
        validated_data.pop('image_file', None)

        instance = AppDownload.objects.create(**validated_data)

        if titles_data:
            for i, t in enumerate(titles_data):
                t['index'] = t.get('index', i + 1)
                AppDownloadTitle.objects.create(app_download=instance, **t)
        if lists_data:
            for i, l in enumerate(lists_data):
                l['index'] = l.get('index', i + 1)
                AppDownloadList.objects.create(app_download=instance, **l)

        return instance

    def update(self, instance, validated_data):
        titles_data = validated_data.pop('titles', None)
        lists_data = validated_data.pop('lists', None)
        validated_data.pop('image_file', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if titles_data is not None:
            instance.titles.all().delete()
            for i, t in enumerate(titles_data):
                t['index'] = t.get('index', i + 1)
                AppDownloadTitle.objects.create(app_download=instance, **t)

        if lists_data is not None:
            instance.lists.all().delete()
            for i, l in enumerate(lists_data):
                l['index'] = l.get('index', i + 1)
                AppDownloadList.objects.create(app_download=instance, **l)

        return instance
