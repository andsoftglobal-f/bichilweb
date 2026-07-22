import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.db_connection import get_connection

conn = get_connection(autocommit=True)
cur = conn.cursor()

cols = [
    ("jobs_icon_image", "TEXT NOT NULL DEFAULT ''"),
    ("jobs_icon_url",   "TEXT NOT NULL DEFAULT ''"),
]

for col, typedef in cols:
    try:
        cur.execute(f"ALTER TABLE hr_section ADD COLUMN {col} {typedef};")
        print(f"Added {col}")
    except Exception as e:
        conn.rollback()
        print(f"{col} already exists")

cur.close()
conn.close()
print("Done")
