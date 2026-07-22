import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.db_connection import get_connection

conn = get_connection()
cur = conn.cursor()

# Create hr_section table
cur.execute("""
CREATE TABLE IF NOT EXISTS hr_section (
    id BIGSERIAL PRIMARY KEY,
    title_fontfamily TEXT DEFAULT '',
    title_fontsize TEXT DEFAULT '32',
    title_color TEXT DEFAULT '#0f172a',
    title_weight TEXT DEFAULT '700',
    subtitle_fontfamily TEXT DEFAULT '',
    subtitle_fontsize TEXT DEFAULT '14',
    subtitle_color TEXT DEFAULT '#64748b',
    subtitle_weight TEXT DEFAULT '500',
    desc_fontfamily TEXT DEFAULT '',
    desc_fontsize TEXT DEFAULT '15',
    desc_color TEXT DEFAULT '#475569',
    btn_bg TEXT DEFAULT '#1e293b',
    btn_color TEXT DEFAULT '#ffffff',
    btn_radius TEXT DEFAULT '12',
    btn_fontfamily TEXT DEFAULT '',
    btn_fontsize TEXT DEFAULT '14',
    btn_fontweight TEXT DEFAULT '600',
    section_bg TEXT DEFAULT 'rgba(255,255,255,0.7)',
    section_border_radius TEXT DEFAULT '16',
    section_border_color TEXT DEFAULT 'transparent',
    section_border_width TEXT DEFAULT '0',
    accent_gradient TEXT DEFAULT 'from-blue-500 via-indigo-500 to-purple-500',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
""")
print("hr_section table created")

# Create hr_section_translations table
cur.execute("""
CREATE TABLE IF NOT EXISTS hr_section_translations (
    id BIGSERIAL PRIMARY KEY,
    section BIGINT REFERENCES hr_section(id) ON DELETE CASCADE,
    language BIGINT,
    title TEXT DEFAULT '',
    subtitle TEXT DEFAULT '',
    description TEXT DEFAULT '',
    btn_text TEXT DEFAULT '',
    UNIQUE(section, language)
);
""")
print("hr_section_translations table created")

# Insert default row if empty
cur.execute("SELECT COUNT(*) FROM hr_section")
count = cur.fetchone()[0]
if count == 0:
    cur.execute("INSERT INTO hr_section DEFAULT VALUES RETURNING id")
    section_id = cur.fetchone()[0]
    cur.execute("""
        INSERT INTO hr_section_translations (section, language, title, subtitle, description, btn_text) VALUES
        (%s, 1, 'Human Resources', 'Human Resources', 'Employee support policies, training, and incentives. We invite capable new people to work together.', 'Apply Now'),
        (%s, 2, 'Хүний нөөц', 'Human Resources', 'Ажилтнаа дэмжсэн бодлого, сургалт болон урамшуулалтай. Хамтран ажиллах чадвартай шинэ хүнийг урьж байна.', 'Анкет бөглөх')
    """, (section_id, section_id))
    print(f"Default hr_section row created with id={section_id}")
else:
    print("hr_section already has data, skipping defaults")

conn.commit()
conn.close()
print("Done!")
