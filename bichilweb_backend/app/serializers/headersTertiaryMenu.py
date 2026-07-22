from rest_framework import serializers
from app.models.models import HeaderTertiaryMenu, HeaderTertiaryMenuTranslation, Language

class HeaderTertiaryMenuTranslationSerializer(serializers.ModelSerializer):
    language_id = serializers.IntegerField(source='language.id')

    class Meta:
        model = HeaderTertiaryMenuTranslation
        fields = ('id', 'language_id', 'label')


class HeaderTertiaryMenuSerializer(serializers.ModelSerializer):
    translations = HeaderTertiaryMenuTranslationSerializer(
        many=True,
        source='headertertiarymenutranslation_set', 
        required=False
    )

    class Meta:
        model = HeaderTertiaryMenu
        fields = ('id', 'header_submenu', 'font', 'path', 'index', 'visible', 'translations')

    def create(self, validated_data):
        translations_data = validated_data.pop('headertertiarymenutranslation_set', [])
        menu = HeaderTertiaryMenu.objects.create(**validated_data)

        for trans_data in translations_data:
            lang_id = trans_data['language']['id']
            language = Language.objects.get(id=lang_id)
            HeaderTertiaryMenuTranslation.objects.create(
                tertiary_menu=menu,
                language=language,
                label=trans_data['label']
            )
        return menu

    def update(self, instance, validated_data):
        translations_data = validated_data.pop('headertertiarymenutranslation_set', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        for trans_data in translations_data:
            lang_id = trans_data['language']['id']
            language = Language.objects.get(id=lang_id)
            label = trans_data.get('label', '')

            translation_obj, created = HeaderTertiaryMenuTranslation.objects.update_or_create(
                tertiary_menu=instance,
                language=language,
                defaults={'label': label}
            )

        return instance
