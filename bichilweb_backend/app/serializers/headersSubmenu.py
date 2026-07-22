from rest_framework import serializers
from app.models.models import HeaderSubmenu, HeaderSubmenuTranslation, HeaderTertiaryMenu, HeaderTertiaryMenuTranslation

class HeaderSubmenuTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeaderSubmenuTranslation
        fields = ['language', 'label']

class HeaderTertiaryMenuTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeaderTertiaryMenuTranslation
        fields = ['language', 'label']

class HeaderTertiaryMenuSerializer(serializers.ModelSerializer):
    translations = HeaderTertiaryMenuTranslationSerializer(
        many=True, source='headertertiarymenutranslation_set', read_only=True
    )

    class Meta:
        model = HeaderTertiaryMenu
        fields = ['id', 'font', 'path', 'index', 'visible', 'translations']

class HeaderSubmenuSerializer(serializers.ModelSerializer):
    translations = HeaderSubmenuTranslationSerializer(
        many=True, source='headersubmenutranslation_set'
    )

    class Meta:
        model = HeaderSubmenu
        fields = ['id', 'header_menu', 'font', 'path', 'index', 'visible', 'translations']

    def create(self, validated_data):
        translations_data = validated_data.pop('headersubmenutranslation_set', [])
        submenu = HeaderSubmenu.objects.create(**validated_data)

        for trans in translations_data:
            HeaderSubmenuTranslation.objects.create(submenu=submenu, **trans)

        return submenu

    def update(self, instance, validated_data):
        translations_data = validated_data.pop('headersubmenutranslation_set', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        for trans in translations_data:
            HeaderSubmenuTranslation.objects.update_or_create(
                submenu=instance,
                language=trans['language'],
                defaults={'label': trans['label']}
            )

        return instance
