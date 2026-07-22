import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.db_connection import get_connection

conn = get_connection()
cur = conn.cursor()

# Add icon fields
cols = [
    ("icon_image", "TEXT DEFAULT ''"),
    ("icon_url", "TEXT DEFAULT ''"),
    # Policy section styles
    ("policy_title_fontfamily", "TEXT DEFAULT ''"),
    ("policy_title_fontsize", "TEXT DEFAULT '18'"),
    ("policy_title_color", "TEXT DEFAULT '#334155'"),
    ("policy_title_weight", "TEXT DEFAULT '600'"),
    ("policy_desc_fontsize", "TEXT DEFAULT '14'"),
    ("policy_desc_color", "TEXT DEFAULT '#64748b'"),
    ("policy_card_bg", "TEXT DEFAULT '#ffffff'"),
    ("policy_card_border_color", "TEXT DEFAULT '#e2e8f0'"),
    ("policy_card_border_radius", "TEXT DEFAULT '12'"),
    # Jobs section styles
    ("jobs_title_fontfamily", "TEXT DEFAULT ''"),
    ("jobs_title_fontsize", "TEXT DEFAULT '18'"),
    ("jobs_title_color", "TEXT DEFAULT '#0f172a'"),
    ("jobs_title_weight", "TEXT DEFAULT '600'"),
    ("jobs_desc_fontsize", "TEXT DEFAULT '14'"),
    ("jobs_desc_color", "TEXT DEFAULT '#475569'"),
    ("jobs_card_bg", "TEXT DEFAULT '#ffffff'"),
    ("jobs_card_border_color", "TEXT DEFAULT '#e2e8f0'"),
    ("jobs_card_border_radius", "TEXT DEFAULT '12'"),
    ("jobs_badge_bg", "TEXT DEFAULT '#f0fdf4'"),
    ("jobs_badge_color", "TEXT DEFAULT '#15803d'"),
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
