from rest_framework import serializers
from app.models.models import HeaderQuaternaryMenu, HeaderQuaternaryMenuTranslation, Language


class HeaderQuaternaryMenuTranslationSerializer(serializers.ModelSerializer):
    language_id = serializers.IntegerField(source='language.id')

    class Meta:
        model = HeaderQuaternaryMenuTranslation
        fields = ('id', 'language_id', 'label')


class HeaderQuaternaryMenuSerializer(serializers.ModelSerializer):
    translations = HeaderQuaternaryMenuTranslationSerializer(
        many=True,
        source='headerquaternarymenutranslation_set',
        required=False
    )

    class Meta:
        model = HeaderQuaternaryMenu
        fields = ('id', 'header_tertiary', 'font', 'path', 'index', 'visible', 'translations')

    def create(self, validated_data):
        translations_data = validated_data.pop('headerquaternarymenutranslation_set', [])
        menu = HeaderQuaternaryMenu.objects.create(**validated_data)

        for trans_data in translations_data:
            lang_id = trans_data['language']['id']
            language = Language.objects.get(id=lang_id)
            HeaderQuaternaryMenuTranslation.objects.create(
                quaternary_menu=menu,
                language=language,
                label=trans_data['label']
            )
        return menu

    def update(self, instance, validated_data):
        translations_data = validated_data.pop('headerquaternarymenutranslation_set', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        for trans_data in translations_data:
            lang_id = trans_data['language']['id']
            language = Language.objects.get(id=lang_id)
            label = trans_data.get('label', '')

            HeaderQuaternaryMenuTranslation.objects.update_or_create(
                quaternary_menu=instance,
                language=language,
                defaults={'label': label}
            )

        return instance
