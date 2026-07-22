from rest_framework import serializers
from app.models.models import (
    Footer, FooterSocials, FooterUrls, FooterEmails, FooterPhones
)

class FooterSocialsReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterSocials
        fields = ['id', 'social', 'url', 'index', 'active']


class FooterUrlsReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterUrls
        fields = ['id', 'nameen', 'namemn', 'url']


class FooterEmailsReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterEmails
        fields = ['id', 'label', 'email', 'index']


class FooterPhonesReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterPhones
        fields = ['id', 'phone', 'index']


class FooterReadSerializer(serializers.ModelSerializer):
    socials = FooterSocialsReadSerializer(source='footersocials_set', many=True, read_only=True)
    urls = FooterUrlsReadSerializer(source='footerurls_set', many=True, read_only=True)
    emails = FooterEmailsReadSerializer(source='footeremails_set', many=True, read_only=True)
    phones = FooterPhonesReadSerializer(source='footerphones_set', many=True, read_only=True)
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Footer
        fields = [
            'id',
            'logotext',
            'logo',
            'logo_url',
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
    
    def get_logo_url(self, obj):
        if obj.logo:
            # Full URL-г шууд буцаана
            if obj.logo.startswith('http://') or obj.logo.startswith('https://'):
                return obj.logo
            file_path = obj.logo.replace('media/', '').replace('footer/', '')
            return f'/media/footer/{file_path}'
        return None
