import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.db_connection import get_connection

conn = get_connection()
cur = conn.cursor()
cur.execute('SELECT count(*) FROM app_download')
print('Total records:', cur.fetchone()[0])
cur.execute('SELECT id, active, layout, bgcolor FROM app_download ORDER BY id')
for r in cur.fetchall():
    print('  app_download:', r)
cur.execute('SELECT id, app_download, index, labelmn FROM app_download_title ORDER BY app_download, index')
print('--- titles ---')
for r in cur.fetchall():
    print(' ', r)
cur.execute('SELECT id, app_download, index, labelmn FROM app_download_list ORDER BY app_download, index')
print('--- lists ---')
for r in cur.fetchall():
    print(' ', r)
conn.close()
