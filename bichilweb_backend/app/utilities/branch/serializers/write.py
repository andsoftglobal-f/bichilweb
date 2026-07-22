from rest_framework import serializers
from app.models.models import Branches, BranchPhone, BranchCategory
import json
import re
import logging
from django.conf import settings
from app.utils.storage import upload_file, delete_file

logger = logging.getLogger(__name__)


class BranchesWriteSerializer(serializers.ModelSerializer):
    phones = serializers.CharField(write_only=True)
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    category_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = Branches
        fields = [
            "id", "name", "name_en", "location", "location_en", "image",
            "area", "area_en", "city", "city_en",
            "district", "district_en", "open", "open_en", "time",
            "latitude", "longitude", "phones",
            "category_id"
        ]
    
    def validate_phones(self, value):
        try:
            phones_data = json.loads(value) if isinstance(value, str) else value
            
            if not isinstance(phones_data, list):
                raise serializers.ValidationError("Утасны дугаар оруулна уу.")
            
            if not phones_data:
                raise serializers.ValidationError("Дор хаяж нэг утас оруулна уу")
            
            for phone in phones_data:
                if not isinstance(phone, dict) or 'phone' not in phone:
                    raise serializers.ValidationError("")
                if not phone['phone'].strip():
                    raise serializers.ValidationError("Утас хоосон байж болохгүй")
            
            return phones_data
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON format for phones")
    
    def _upload_to_storage(self, image_file):
        """Upload image and return URL."""
        return upload_file(image_file, folder='bichil/branches', resource_type='image')
    
    def _delete_from_storage(self, url):
        """Delete file."""
        delete_file(url)
    
    def create(self, validated_data):
        phones_data = validated_data.pop('phones')
        image_file = validated_data.pop('image', None)
        category_id = validated_data.pop('category_id', None)
        
        if image_file:
            file_url = self._upload_to_storage(image_file)
            validated_data['image'] = file_url
            logger.debug('Branch image uploaded: %s', file_url)
        
        if category_id:
            try:
                cat = BranchCategory.objects.get(id=category_id)
                validated_data['category'] = cat
            except BranchCategory.DoesNotExist:
                pass
        
        branch = Branches.objects.create(**validated_data)
        
        for phone_data in phones_data:
            BranchPhone.objects.create(branch=branch, phone=phone_data['phone'])
        
        return branch
    
    def update(self, instance, validated_data):
        phones_data = validated_data.pop('phones', None)
        image_file = validated_data.pop('image', None)
        category_id = validated_data.pop('category_id', None)
        
        if image_file:
            # Delete old storage image
            if instance.image:
                self._delete_from_storage(instance.image)
            file_url = self._upload_to_storage(image_file)
            validated_data['image'] = file_url
            logger.debug('Branch image updated: %s', file_url)
        
        instance.name = validated_data.get('name', instance.name)
        instance.name_en = validated_data.get('name_en', instance.name_en)
        instance.location = validated_data.get('location', instance.location)
        instance.location_en = validated_data.get('location_en', instance.location_en)
        instance.area = validated_data.get('area', instance.area)
        instance.area_en = validated_data.get('area_en', instance.area_en)
        instance.city = validated_data.get('city', instance.city)
        instance.city_en = validated_data.get('city_en', instance.city_en)
        instance.district = validated_data.get('district', instance.district)
        instance.district_en = validated_data.get('district_en', instance.district_en)
        instance.open = validated_data.get('open', instance.open)
        instance.open_en = validated_data.get('open_en', instance.open_en)
        instance.time = validated_data.get('time', instance.time)
        instance.latitude = validated_data.get('latitude', instance.latitude)
        instance.longitude = validated_data.get('longitude', instance.longitude)
        
        if 'image' in validated_data:
            instance.image = validated_data['image']
        
        # Handle category
        if category_id is not None:
            if category_id == 0 or category_id == '':
                instance.category = None
            else:
                try:
                    instance.category = BranchCategory.objects.get(id=category_id)
                except BranchCategory.DoesNotExist:
                    pass
        
        instance.save()
        
        if phones_data is not None:
            instance.branchphone_set.all().delete()
            for phone_data in phones_data:
                BranchPhone.objects.create(branch=instance, phone=phone_data['phone'])
        
        return instance
