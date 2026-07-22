import os, sys, django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bichilglobusweb.settings')
django.setup()

from django.db import connection

tables = [
    'CTA', 'CTA_title', 'CTA_subtitle',
    'product', 'product_translations', 'product_details',
    'product_document', 'product_collaterial', 'product_condition',
    'product_type', 'product_type_translations',
    'Services', 'Services_translations',
    'Service_card', 'Service_card_translations',
    'service_collateral', 'service_condition', 'service_document',
]

cur = connection.cursor()
for t in tables:
    try:
        sql = 'SELECT setval(\'"%s_id_seq"\', (SELECT COALESCE(MAX(id),0) FROM "%s") + 1, false)' % (t, t)
        cur.execute(sql)
        val = cur.fetchone()[0]
        print('%s -> %s' % (t, val))
    except Exception as e:
        connection.connection.rollback()
        print('%s -> SKIP (%s)' % (t, e))

print('Done!')
