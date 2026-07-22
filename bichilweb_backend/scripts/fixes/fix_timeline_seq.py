import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.db_connection import get_connection

conn = get_connection()
cur = conn.cursor()

tables = ['timeline_event', 'timeline_event_translations']
for t in tables:
    try:
        cur.execute(f'SELECT MAX(id) FROM {t}')
        max_id = cur.fetchone()[0] or 0
        new_val = max_id + 1
        cur.execute(f"SELECT setval(pg_get_serial_sequence('{t}', 'id'), {new_val})")
        print(f'{t}: sequence set to {new_val}')
    except Exception as e:
        conn.rollback()
        print(f'{t}: ERROR - {e}')

conn.commit()
conn.close()
