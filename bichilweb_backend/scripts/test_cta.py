import os, sys, django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bichilglobusweb.settings')
django.setup()

from app.serializers.cta import CtaSerializer

data = {
    'number': '01',
    'index': '1',
    'font': 'Montserrat',
    'description_font': '',
    'subtitle_font': '',
    'color': '#FFFFFF',
    'description': 'test',
    'url': '',
    'file': 'https://example.com/test.jpg'
}
s = CtaSerializer(data=data)
v = s.is_valid()
print("Valid:", v)
print("Errors:", s.errors)
