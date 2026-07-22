from rest_framework import serializers
from app.models.models import *

class HeaderMenuTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeaderMenuTranslation
        fields = ['language', 'label'] 

class HeaderSubmenuTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeaderSubmenuTranslation
        fields = ['id', 'language', 'label']

class HeaderTertiaryMenuTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeaderTertiaryMenuTranslation
        fields = ['id', 'language', 'label']

class HeaderTertiaryMenuSerializer(serializers.ModelSerializer):
    translations = HeaderTertiaryMenuTranslationSerializer(many=True, source='headertertiarymenutranslation_set', required=False)

    class Meta:
        model = HeaderTertiaryMenu
        fields = ['id', 'header_submenu', 'font', 'path', 'index', 'visible', 'translations']

class HeaderSubmenuSerializer(serializers.ModelSerializer):
    translations = HeaderSubmenuTranslationSerializer(many=True, source='headersubmenutranslation_set', required=False)
    tertiary_menus = HeaderTertiaryMenuSerializer(many=True, source='headertertiarymenu_set', required=False)

    class Meta:
        model = HeaderSubmenu
        fields = ['id', 'header_menu', 'font', 'path', 'index', 'visible', 'translations', 'tertiary_menus']

class HeaderMenuSerializer(serializers.ModelSerializer):
    translations = HeaderMenuTranslationSerializer(
        many=True, source='headermenutranslation_set', required=False
    )

    class Meta:
        model = HeaderMenu
        fields = ['id', 'header', 'font', 'path', 'index', 'visible', 'translations']

    def create(self, validated_data):
        translations_data = validated_data.pop('headermenutranslation_set', [])
        menu = HeaderMenu.objects.create(**validated_data)

        for trans in translations_data:
            HeaderMenuTranslation.objects.create(menu=menu, **trans)
        return menu

    def update(self, instance, validated_data):
        translations_data = validated_data.pop('headermenutranslation_set', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        for trans in translations_data:
            HeaderMenuTranslation.objects.update_or_create(
                menu=instance,
                language=trans['language'],
                defaults={'label': trans['label']}
            )

        return instance