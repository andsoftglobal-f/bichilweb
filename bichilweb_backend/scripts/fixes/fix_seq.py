import os, sys, django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bichilglobusweb.settings')
django.setup()

from django.db import connection

c = connection.cursor()
c.execute("""SELECT setval('"CTA_id_seq"', (SELECT COALESCE(MAX(id),0) FROM "CTA") + 1, false)""")
print('CTA sequence reset to:', c.fetchone()[0])
c.execute("""SELECT setval('"CTA_title_id_seq"', (SELECT COALESCE(MAX(id),0) FROM "CTA_title") + 1, false)""")
print('CTA_title sequence reset to:', c.fetchone()[0])
c.execute("""SELECT setval('"CTA_subtitle_id_seq"', (SELECT COALESCE(MAX(id),0) FROM "CTA_subtitle") + 1, false)""")
print('CTA_subtitle sequence reset to:', c.fetchone()[0])
