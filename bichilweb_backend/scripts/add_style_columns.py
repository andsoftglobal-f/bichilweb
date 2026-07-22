import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'bichilglobusweb.settings'
django.setup()
from django.db import connection

cur = connection.cursor()

sqls = [
    ("core_value_title_translations", "textalign", "TEXT DEFAULT 'left'"),
    ("core_value_desc_translations", "textalign", "TEXT DEFAULT 'left'"),
    ("management_member_translations", "styles", "TEXT DEFAULT '{}'"),
    ("management_category_translations", "styles", "TEXT DEFAULT '{}'"),
]

for table, col, typedef in sqls:
    try:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {typedef}")
        print(f"OK  Added {col} to {table}")
    except Exception as e:
        print(f"SKIP {table}.{col}: {e}")

print("Done!")
