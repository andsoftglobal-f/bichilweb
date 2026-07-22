import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bichilglobusweb.settings')
django.setup()
from django.db import connection
cur = connection.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'about_banner'")
print([r[0] for r in cur.fetchall()])
