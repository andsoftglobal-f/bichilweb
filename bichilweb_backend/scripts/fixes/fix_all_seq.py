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
]

c = connection.cursor()
for table in tables:
    try:
        seq = f'{table}_id_seq'
        c.execute(f"""SELECT setval('"{seq}"', (SELECT COALESCE(MAX(id),0) FROM "{table}") + 1, false)""")
        val = c.fetchone()[0]
        print(f'{table} -> {val}')
    except Exception as e:
        connection.connection.rollback()
        print(f'{table} -> SKIP ({e})')

print('Done!')
