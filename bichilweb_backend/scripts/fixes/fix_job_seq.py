import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.db_connection import get_connection

conn = get_connection(autocommit=True)
cur = conn.cursor()
cur.execute("SELECT setval('job_translations_id_seq', (SELECT COALESCE(MAX(id),0) FROM job_translations) + 1, false)")
cur.execute("SELECT currval('job_translations_id_seq')")
print("Sequence reset to:", cur.fetchone()[0])
cur.close()
conn.close()
