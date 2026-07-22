from rest_framework import serializers
from app.models.models import Branches, BranchPhone, BranchCategory, BranchPageSettings

class BranchPhoneReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchPhone
        fields = ["id", "phone"]


class BranchCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchCategory
        fields = ["id", "name", "name_en", "sort_order", "active"]


class BranchesReadSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    phones = serializers.SerializerMethodField()
    category_id = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    category_name_en = serializers.SerializerMethodField()
    
    class Meta:
        model = Branches
        fields = [
            "id", "name", "name_en", "location", "location_en", "image", "image_url",
            "area", "area_en", "city", "city_en",
            "district", "district_en", "open", "open_en", "time",
            "latitude", "longitude", "phones",
            "category_id", "category_name", "category_name_en"
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            # If it's already a full URL, return as-is
            if obj.image.startswith('http'):
                return obj.image
            # Legacy local file fallback
            file_path = obj.image.replace('media/', '').replace('branches/', '')
            return f'/media/branches/{file_path}'
        return None
    
    def get_phones(self, obj):
        phones = []
        for phone in obj.branchphone_set.all():
            phones.append({
                "id": phone.id,
                "phone": phone.phone
            })
        return phones

    def get_category_id(self, obj):
        return obj.category_id if obj.category else None

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_category_name_en(self, obj):
        return obj.category.name_en if obj.category else None


class BranchPageSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchPageSettings
        fields = [
            "id", "popup_bg", "popup_title_color", "popup_text_color",
            "popup_icon_color", "popup_btn_bg", "popup_btn_text", "popup_btn_label",
            "popup_btn_label_en",
            "card_bg", "card_border", "card_title_color", "card_text_color",
            "card_icon_color", "card_btn_bg", "card_btn_text", "card_btn_label",
            "card_btn_label_en",
            "marker_color", "marker_selected_color",
            "map_btn_bg", "map_btn_text", "map_btn_label", "map_btn_label_en",
            "fontfamily"
        ]
