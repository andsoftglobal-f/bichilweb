import re
import json
import logging
from rest_framework import serializers
from django.conf import settings
from app.models.models import Footer, FooterSocials, FooterUrls, FooterEmails, FooterPhones
from app.utils.storage import upload_file, delete_file

logger = logging.getLogger(__name__)

class FooterSocialsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterSocials
        fields = ['social', 'url', 'index', 'active']


class FooterUrlsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterUrls
        fields = ['nameen', 'namemn', 'url']


class FooterEmailsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterEmails
        fields = ['label', 'email', 'index']


class FooterPhonesWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterPhones
        fields = ['phone', 'index']


class FooterWriteSerializer(serializers.ModelSerializer):
    socials = FooterSocialsWriteSerializer(many=True, required=False)
    urls = FooterUrlsWriteSerializer(many=True, required=False)
    emails = FooterEmailsWriteSerializer(many=True, required=False)
    phones = FooterPhonesWriteSerializer(many=True, required=False)
    logo = serializers.FileField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = Footer
        fields = [
            'logotext',
            'logo',
            'svg',
            'descmn',
            'descen',
            'locationmn',
            'locationen',
            'email',
            'phone',
            'bgcolor',
            'fontcolor',
            'featurecolor',
            'socialiconcolor',
            'titlesize',
            'fontsize',
            'fontfamily',
            'copyrighten',
            'copyrightmn',
            'logo_size',
            'socials',
            'urls',
            'emails',
            'phones',
        ]

    def to_internal_value(self, data):
        """Parse socials/urls JSON strings from multipart FormData"""
        # Convert QueryDict to a plain dict so DRF doesn't use HTML list parsing
        plain_data = {}
        for key in data:
            if key in ('socials', 'urls', 'emails', 'phones'):
                raw = data.get(key)
                if isinstance(raw, str):
                    try:
                        parsed = json.loads(raw)
                        if isinstance(parsed, list):
                            plain_data[key] = parsed
                            continue
                    except (json.JSONDecodeError, TypeError):
                        pass
                plain_data[key] = raw
            elif key == 'logo':
                plain_data[key] = data.get(key)
            else:
                plain_data[key] = data.get(key)
        
        return super().to_internal_value(plain_data)
    
    def _upload_to_storage(self, file_obj):
        """Зураг upload хийнэ."""
        return upload_file(file_obj, folder='bichil/footer', resource_type='image')

    def _delete_from_storage(self, url):
        """Файл устгах."""
        delete_file(url)
    
    def create(self, validated_data):
        socials_data = validated_data.pop('socials', [])
        urls_data = validated_data.pop('urls', [])
        emails_data = validated_data.pop('emails', [])
        phones_data = validated_data.pop('phones', [])
        logo_file = validated_data.pop('logo', None)
        
        if logo_file:
            file_url = self._upload_to_storage(logo_file)
            validated_data['logo'] = file_url
            logger.debug('Footer logo uploaded: %s', file_url)
        
        footer = Footer.objects.create(**validated_data)
        
        for social_data in socials_data:
            FooterSocials.objects.create(footer=footer, **social_data)
        
        for url_data in urls_data:
            FooterUrls.objects.create(footer=footer, **url_data)
        
        for i, email_data in enumerate(emails_data):
            email_data.setdefault('index', i)
            FooterEmails.objects.create(footer=footer, **email_data)
        
        for i, phone_data in enumerate(phones_data):
            phone_data.setdefault('index', i)
            FooterPhones.objects.create(footer=footer, **phone_data)
        
        return footer
    
    def update(self, instance, validated_data):
        socials_data = validated_data.pop('socials', None)
        urls_data = validated_data.pop('urls', None)
        emails_data = validated_data.pop('emails', None)
        phones_data = validated_data.pop('phones', None)
        logo_file = validated_data.pop('logo', None)
        
        if logo_file:
            if instance.logo:
                self._delete_from_storage(instance.logo)
            file_url = self._upload_to_storage(logo_file)
            validated_data['logo'] = file_url
            logger.debug('Footer logo updated: %s', file_url)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if socials_data is not None:
            instance.footersocials_set.all().delete()
            for social_data in socials_data:
                FooterSocials.objects.create(footer=instance, **social_data)
        
        if urls_data is not None:
            instance.footerurls_set.all().delete()
            for url_data in urls_data:
                FooterUrls.objects.create(footer=instance, **url_data)
        
        if emails_data is not None:
            instance.footeremails_set.all().delete()
            for i, email_data in enumerate(emails_data):
                email_data.setdefault('index', i)
                FooterEmails.objects.create(footer=instance, **email_data)
        
        if phones_data is not None:
            instance.footerphones_set.all().delete()
            for i, phone_data in enumerate(phones_data):
                phone_data.setdefault('index', i)
                FooterPhones.objects.create(footer=instance, **phone_data)
        
        return instance
