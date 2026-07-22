from rest_framework import serializers
from app.models.models import FloatMenu, FloatMenuSubmenus, FloatMenuSubmenusTranslations, FloatMenuTranslations, FloatMenuSocials, CallButton, Language
import logging
from app.utils.storage import upload_file, delete_file

logger = logging.getLogger(__name__)


class CallButtonSerializer(serializers.ModelSerializer):
    """Serializer for Call Button settings"""
    class Meta:
        model = CallButton
        fields = ['id', 'url', 'svg', 'button_color', 'icon_color', 'arrow_color', 'active']


class FloatMenuSocialsSerializer(serializers.ModelSerializer):
    """Serializer for FloatMenu social links"""
    class Meta:
        model = FloatMenuSocials
        fields = ['id', 'float_menu', 'platform', 'url', 'hover_color', 'sort_order', 'active']

class FloatMenuTranslationsReadSerializer(serializers.ModelSerializer):
    """Serializer for reading FloatMenu translations"""
    language_code = serializers.CharField(source='language.lang_code', read_only=True)
    
    class Meta:
        model = FloatMenuTranslations
        fields = ['id', 'language', 'language_code', 'label']


class FloatMenuSubmenusTranslationsReadSerializer(serializers.ModelSerializer):
    """Serializer for reading FloatMenuSubmenus translations"""
    language_code = serializers.CharField(source='language.lang_code', read_only=True)
    
    class Meta:
        model = FloatMenuSubmenusTranslations
        fields = ['id', 'language', 'language_code', 'title']


class FloatMenuSubmenusReadSerializer(serializers.ModelSerializer):
    """Serializer for reading FloatMenu submenus with translations"""
    translations = FloatMenuSubmenusTranslationsReadSerializer(
        source='floatmenusubmenustranslations_set', 
        many=True, 
        read_only=True
    )
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = FloatMenuSubmenus
        fields = [
            'id',
            'url',
            'file',
            'file_url',
            'svg',
            'fontfamily',
            'bgcolor',
            'fontcolor',
            'open_in_iframe',
            'translations'
        ]
    
    def get_file_url(self, obj):
        if obj.file:
            clean_filename = obj.file.replace('media/', '').replace('float_menu/', '')
            return f'/media/float_menu/{clean_filename}'
        return None


class FloatMenuReadSerializer(serializers.ModelSerializer):
    """Serializer for reading FloatMenu with all nested data"""
    translations = FloatMenuTranslationsReadSerializer(
        source='floatmenutranslations_set',
        many=True,
        read_only=True
    )
    submenus = FloatMenuSubmenusReadSerializer(
        source='floatmenusubmenus_set',
        many=True,
        read_only=True
    )
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = FloatMenu
        fields = [
            'id',
            'iconcolor',
            'fontfamily',
            'bgcolor',
            'fontcolor',
            'image',
            'image_url',
            'svg',
            'url',
            'open_in_iframe',
            'translations',
            'submenus'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            clean_filename = obj.image.replace('media/', '').replace('float_menu/', '')
            return f'/media/float_menu/{clean_filename}'
        return None


# ==================== WRITE SERIALIZERS ====================

class FloatMenuTranslationsWriteSerializer(serializers.ModelSerializer):
    """Serializer for writing FloatMenu translations"""
    
    class Meta:
        model = FloatMenuTranslations
        fields = ['language', 'label']


class FloatMenuSubmenusTranslationsWriteSerializer(serializers.ModelSerializer):
    """Serializer for writing FloatMenuSubmenus translations"""
    
    class Meta:
        model = FloatMenuSubmenusTranslations
        fields = ['language', 'title']


class FloatMenuSubmenusWriteSerializer(serializers.ModelSerializer):
    """Serializer for writing FloatMenu submenus with translations"""
    translations = FloatMenuSubmenusTranslationsWriteSerializer(many=True, required=False)
    file = serializers.ImageField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = FloatMenuSubmenus
        fields = [
            'url',
            'file',
            'svg',
            'fontfamily',
            'bgcolor',
            'fontcolor',
            'open_in_iframe',
            'translations'
        ]


class FloatMenuWriteSerializer(serializers.ModelSerializer):
    """Serializer for writing FloatMenu with nested translations and submenus"""
    translations = FloatMenuTranslationsWriteSerializer(many=True, required=False)
    submenus = FloatMenuSubmenusWriteSerializer(many=True, required=False)
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = FloatMenu
        fields = [
            'iconcolor',
            'fontfamily',
            'bgcolor',
            'fontcolor',
            'image',
            'svg',
            'url',
            'open_in_iframe',
            'translations',
            'submenus'
        ]
    
    def _save_image(self, image_file, subfolder=''):
        """Save uploaded image and return filename"""
        folder = 'float_menu'
        if subfolder:
            folder = f"{folder}/{subfolder}"
        return upload_file(
            image_file,
            folder=folder,
            resource_type='image',
            force_local=True,
            return_path=True,
        )
    
    def _delete_image(self, filename, subfolder=''):
        """Delete image file from filesystem"""
        if filename:
            clean_filename = str(filename).replace('media/', '').lstrip('/')
            if not clean_filename.startswith('float_menu/'):
                clean_filename = f"float_menu/{subfolder}/{clean_filename}" if subfolder else f"float_menu/{clean_filename}"
            delete_file(clean_filename)
    
    def create(self, validated_data):
        translations_data = validated_data.pop('translations', [])
        submenus_data = validated_data.pop('submenus', [])
        image_file = validated_data.pop('image', None)
        
        if image_file:
            filename = self._save_image(image_file)
            validated_data['image'] = filename
            logger.debug('FloatMenu image saved: %s', filename)
        
        float_menu = FloatMenu.objects.create(**validated_data)
        
        for translation_data in translations_data:
            FloatMenuTranslations.objects.create(
                float_menu=float_menu,
                **translation_data
            )
        
        for submenu_data in submenus_data:
            submenu_translations = submenu_data.pop('translations', [])
            submenu_file = submenu_data.pop('file', None)
            
            if submenu_file:
                filename = self._save_image(submenu_file, 'submenus')
                submenu_data['file'] = filename
                logger.debug('Submenu image saved: %s', filename)
            
            submenu = FloatMenuSubmenus.objects.create(
                float_menu=float_menu,
                **submenu_data
            )
            
            for submenu_translation_data in submenu_translations:
                FloatMenuSubmenusTranslations.objects.create(
                    float_menu_submenu=submenu,
                    **submenu_translation_data
                )
        
        return float_menu
    
    def update(self, instance, validated_data):
        translations_data = validated_data.pop('translations', None)
        submenus_data = validated_data.pop('submenus', None)
        image_file = validated_data.pop('image', None)
        
        if image_file:
            if instance.image:
                self._delete_image(instance.image)
            
            filename = self._save_image(image_file)
            validated_data['image'] = filename
            logger.debug('FloatMenu image updated: %s', filename)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if translations_data is not None:
            instance.floatmenutranslations_set.all().delete()
            for translation_data in translations_data:
                FloatMenuTranslations.objects.create(
                    float_menu=instance,
                    **translation_data
                )
        
        if submenus_data is not None:
            old_submenus = instance.floatmenusubmenus_set.all()
            for old_submenu in old_submenus:
                if old_submenu.file:
                    self._delete_image(old_submenu.file, 'submenus')
            old_submenus.delete()
            for submenu_data in submenus_data:
                submenu_translations = submenu_data.pop('translations', [])
                submenu_file = submenu_data.pop('file', None)
                
                if submenu_file:
                    filename = self._save_image(submenu_file, 'submenus')
                    submenu_data['file'] = filename
                    logger.debug('Submenu image updated: %s', filename)
                
                submenu = FloatMenuSubmenus.objects.create(
                    float_menu=instance,
                    **submenu_data
                )
                
                # Create submenu translations
                for submenu_translation_data in submenu_translations:
                    FloatMenuSubmenusTranslations.objects.create(
                        float_menu_submenu=submenu,
                        **submenu_translation_data
                    )
        
        return instance



class FloatMenuSubmenuCreateSerializer(serializers.ModelSerializer):
    translations = FloatMenuSubmenusTranslationsWriteSerializer(many=True, required=False)
    file = serializers.ImageField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = FloatMenuSubmenus
        fields = [
            'float_menu',
            'url',
            'file',
            'svg',
            'fontfamily',
            'bgcolor',
            'fontcolor',
            'open_in_iframe',
            'translations'
        ]
    
    def _save_image(self, image_file):
        return upload_file(
            image_file,
            folder='float_menu/submenus',
            resource_type='image',
            force_local=True,
            return_path=True,
        )
    
    def create(self, validated_data):
        translations_data = validated_data.pop('translations', [])
        file = validated_data.pop('file', None)
        
        if file:
            filename = self._save_image(file)
            validated_data['file'] = filename
            logger.debug('Submenu image saved: %s', filename)
        
        submenu = FloatMenuSubmenus.objects.create(**validated_data)
        
        for translation_data in translations_data:
            FloatMenuSubmenusTranslations.objects.create(
                float_menu_submenu=submenu,
                **translation_data
            )
        
        return submenu


class FloatMenuSubmenuUpdateSerializer(serializers.ModelSerializer):
    translations = FloatMenuSubmenusTranslationsWriteSerializer(many=True, required=False)
    file = serializers.ImageField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = FloatMenuSubmenus
        fields = [
            'url',
            'file',
            'svg',
            'fontfamily',
            'bgcolor',
            'fontcolor',
            'open_in_iframe',
            'translations'
        ]
    
    def _save_image(self, image_file):
        return upload_file(
            image_file,
            folder='float_menu/submenus',
            resource_type='image',
            force_local=True,
            return_path=True,
        )
    
    def _delete_image(self, filename):
        if filename:
            clean_filename = str(filename).replace('media/', '').lstrip('/')
            if not clean_filename.startswith('float_menu/'):
                clean_filename = f"float_menu/submenus/{clean_filename.replace('submenus/', '')}"
            delete_file(clean_filename)
    
    def update(self, instance, validated_data):
        translations_data = validated_data.pop('translations', None)
        file = validated_data.pop('file', None)
        
        if file:
            if instance.file:
                self._delete_image(instance.file)
            
            filename = self._save_image(file)
            validated_data['file'] = filename
            logger.debug('Submenu image updated: %s', filename)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if translations_data is not None:
            instance.floatmenusubmenustranslations_set.all().delete()
            for translation_data in translations_data:
                FloatMenuSubmenusTranslations.objects.create(
                    float_menu_submenu=instance,
                    **translation_data
                )
        
        return instance
