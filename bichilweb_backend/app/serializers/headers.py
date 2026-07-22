from rest_framework import serializers
import logging
from app.models.models import (
    Header, HeaderStyle, HeaderMenu, HeaderMenuTranslation,
    HeaderSubmenu, HeaderSubmenuTranslation,
    HeaderTertiaryMenu, HeaderTertiaryMenuTranslation,
    HeaderQuaternaryMenu, HeaderQuaternaryMenuTranslation,
)

logger = logging.getLogger(__name__)

class HeaderMenuTranslationSerializer(serializers.ModelSerializer):
    language_id = serializers.IntegerField(source='language.id')

    class Meta:
        model = HeaderMenuTranslation
        fields = ['id', 'label', 'language_id']

class HeaderSubmenuTranslationSerializer(serializers.ModelSerializer):
    language_id = serializers.IntegerField(source='language.id')

    class Meta:
        model = HeaderSubmenuTranslation
        fields = ['id', 'label', 'language_id']

class HeaderTertiaryMenuTranslationSerializer(serializers.ModelSerializer):
    language_id = serializers.IntegerField(source='language.id')

    class Meta:
        model = HeaderTertiaryMenuTranslation
        fields = ['id', 'label', 'language_id']

class HeaderQuaternaryMenuTranslationSerializer(serializers.ModelSerializer):
    language_id = serializers.IntegerField(source='language.id')

    class Meta:
        model = HeaderQuaternaryMenuTranslation
        fields = ['id', 'label', 'language_id']

class HeaderQuaternaryMenuSerializer(serializers.ModelSerializer):
    translations = HeaderQuaternaryMenuTranslationSerializer(source='headerquaternarymenutranslation_set', many=True, read_only=True)

    class Meta:
        model = HeaderQuaternaryMenu
        fields = ['id', 'path', 'font', 'index', 'visible', 'translations']

class HeaderTertiaryMenuSerializer(serializers.ModelSerializer):
    translations = HeaderTertiaryMenuTranslationSerializer(source='headertertiarymenutranslation_set', many=True, read_only=True)
    quaternary_menus = HeaderQuaternaryMenuSerializer(many=True, read_only=True)

    class Meta:
        model = HeaderTertiaryMenu
        fields = ['id', 'path', 'font', 'index', 'visible', 'translations', 'quaternary_menus']

class HeaderSubmenuSerializer(serializers.ModelSerializer):
    translations = HeaderSubmenuTranslationSerializer(source='headersubmenutranslation_set', many=True, read_only=True)
    tertiary_menus = HeaderTertiaryMenuSerializer(many=True, read_only=True)

    class Meta:
        model = HeaderSubmenu
        fields = ['id', 'path', 'font', 'index', 'visible', 'translations', 'tertiary_menus']

class HeaderMenuSerializer(serializers.ModelSerializer):
    translations = HeaderMenuTranslationSerializer(source='headermenutranslation_set', many=True, read_only=True)
    submenus = HeaderSubmenuSerializer(many=True, read_only=True)

    class Meta:
        model = HeaderMenu
        fields = ['id', 'path', 'font', 'index', 'visible', 'translations', 'submenus']

class HeaderStyleSerializer(serializers.ModelSerializer):
    # max_width, logo_size нь production DB-д байхгүй байж болно
    # Тиймээс алдаа гарахаас сэргийлж default утга буцаана
    max_width = serializers.SerializerMethodField()
    logo_size = serializers.SerializerMethodField()

    class Meta:
        model = HeaderStyle
        fields = ['id', 'bgcolor', 'fontcolor', 'hovercolor', 'height', 'sticky', 'max_width', 'logo_size']

    def get_max_width(self, obj):
        """max_width баганыг аюулгүй уншина — байхгүй бол '1240px' буцаана"""
        try:
            return obj.max_width or '1240px'
        except Exception:
            return '1240px'

    def get_logo_size(self, obj):
        """logo_size баганыг аюулгүй уншина — байхгүй бол 44 буцаана"""
        try:
            return obj.logo_size or 44
        except Exception:
            return 44


class SafeHeaderStyleSerializer(serializers.Serializer):
    """HeaderStyle-г serializer-гүйгээр шууд уншина (DB баганы алдаа гарахаас сэргийлнэ)"""
    id = serializers.IntegerField()
    bgcolor = serializers.CharField(default='#ffffff')
    fontcolor = serializers.CharField(default='#1f2937')
    hovercolor = serializers.CharField(default='#0d9488')
    height = serializers.IntegerField(default=80)
    sticky = serializers.IntegerField(default=1)
    max_width = serializers.CharField(default='1240px')
    logo_size = serializers.IntegerField(default=44)


class HeaderSerializer(serializers.ModelSerializer):
    menus = HeaderMenuSerializer(many=True, read_only=True)
    styles = serializers.SerializerMethodField()

    class Meta:
        model = Header
        fields = ['id', 'logo', 'active', 'styles', 'menus']

    def get_styles(self, obj):
        """
        Styles-ийг аюулгүй уншина.
        header_style хүснэгтэд max_width, logo_size багана байхгүй бол
        алдаа барьж, байгаа баганууд + default утгуудыг буцаана.
        """
        try:
            styles = obj.headerstyle_set.all()
            return HeaderStyleSerializer(styles, many=True).data
        except Exception as e:
            logger.warning('HeaderStyle serialization алдаа (max_width/logo_size багана байхгүй байж магадгүй): %s', e)
            # Raw SQL-ээр зөвхөн байгаа баганууд уншина
            try:
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute(
                        'SELECT id, "bgColor", "fontColor", "hoverColor", height, sticky FROM header_style WHERE header = %s',
                        [obj.id]
                    )
                    rows = cursor.fetchall()
                    result = []
                    for row in rows:
                        result.append({
                            'id': row[0],
                            'bgcolor': row[1] or '#ffffff',
                            'fontcolor': row[2] or '#1f2937',
                            'hovercolor': row[3] or '#0d9488',
                            'height': row[4] or 80,
                            'sticky': row[5] if row[5] is not None else 1,
                            'max_width': '1240px',
                            'logo_size': 44,
                        })
                    return result
            except Exception as e2:
                logger.warning('Raw SQL fallback бас алдаа: %s', e2)
                return []

class HeaderCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Header
        fields = ['id', 'logo', 'active']
        read_only_fields = ['id']
