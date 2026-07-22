import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.db_connection import get_connection

conn = get_connection()
cur = conn.cursor()

cols = [
    ("btn_icon_image", "TEXT DEFAULT ''"),
    ("btn_icon_url", "TEXT DEFAULT ''"),
    ("policy_tab_icon_image", "TEXT DEFAULT ''"),
    ("policy_tab_icon_url", "TEXT DEFAULT ''"),
    ("jobs_tab_icon_image", "TEXT DEFAULT ''"),
    ("jobs_tab_icon_url", "TEXT DEFAULT ''"),
]

for col_name, col_def in cols:
    try:
        cur.execute(f"ALTER TABLE hr_section ADD COLUMN {col_name} {col_def}")
        print(f"Added column: {col_name}")
    except Exception as e:
        conn.rollback()
        print(f"Column already exists: {col_name}")

conn.commit()
conn.close()
print("Done!")
