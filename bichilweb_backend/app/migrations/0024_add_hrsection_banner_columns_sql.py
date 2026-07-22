from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0023_hrsection_banner_image'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE TABLE IF NOT EXISTS hr_section (
                    id bigserial PRIMARY KEY,
                    title_fontfamily text NOT NULL DEFAULT '',
                    title_fontsize text NOT NULL DEFAULT '32',
                    title_color text NOT NULL DEFAULT '#0f172a',
                    title_weight text NOT NULL DEFAULT '700',
                    subtitle_fontfamily text NOT NULL DEFAULT '',
                    subtitle_fontsize text NOT NULL DEFAULT '14',
                    subtitle_color text NOT NULL DEFAULT '#64748b',
                    subtitle_weight text NOT NULL DEFAULT '500',
                    desc_fontfamily text NOT NULL DEFAULT '',
                    desc_fontsize text NOT NULL DEFAULT '15',
                    desc_color text NOT NULL DEFAULT '#475569',
                    btn_bg text NOT NULL DEFAULT '#1e293b',
                    btn_color text NOT NULL DEFAULT '#ffffff',
                    btn_radius text NOT NULL DEFAULT '12',
                    btn_fontfamily text NOT NULL DEFAULT '',
                    btn_fontsize text NOT NULL DEFAULT '14',
                    btn_fontweight text NOT NULL DEFAULT '600',
                    section_bg text NOT NULL DEFAULT 'rgba(255,255,255,0.7)',
                    section_border_radius text NOT NULL DEFAULT '16',
                    section_border_color text NOT NULL DEFAULT 'transparent',
                    section_border_width text NOT NULL DEFAULT '0',
                    accent_gradient text NOT NULL DEFAULT 'from-blue-500 via-indigo-500 to-purple-500',
                    icon_image text NOT NULL DEFAULT '',
                    icon_url text NOT NULL DEFAULT '',
                    policy_title_fontfamily text NOT NULL DEFAULT '',
                    policy_title_fontsize text NOT NULL DEFAULT '18',
                    policy_title_color text NOT NULL DEFAULT '#334155',
                    policy_title_weight text NOT NULL DEFAULT '600',
                    policy_desc_fontsize text NOT NULL DEFAULT '14',
                    policy_desc_color text NOT NULL DEFAULT '#64748b',
                    policy_card_bg text NOT NULL DEFAULT '#ffffff',
                    policy_card_border_color text NOT NULL DEFAULT '#e2e8f0',
                    policy_card_border_radius text NOT NULL DEFAULT '12',
                    jobs_title_fontfamily text NOT NULL DEFAULT '',
                    jobs_title_fontsize text NOT NULL DEFAULT '18',
                    jobs_title_color text NOT NULL DEFAULT '#0f172a',
                    jobs_title_weight text NOT NULL DEFAULT '600',
                    jobs_desc_fontsize text NOT NULL DEFAULT '14',
                    jobs_desc_color text NOT NULL DEFAULT '#475569',
                    jobs_card_bg text NOT NULL DEFAULT '#ffffff',
                    jobs_card_border_color text NOT NULL DEFAULT '#e2e8f0',
                    jobs_card_border_radius text NOT NULL DEFAULT '12',
                    jobs_badge_bg text NOT NULL DEFAULT '#f0fdf4',
                    jobs_badge_color text NOT NULL DEFAULT '#15803d',
                    btn_icon_image text NOT NULL DEFAULT '',
                    btn_icon_url text NOT NULL DEFAULT '',
                    policy_tab_icon_image text NOT NULL DEFAULT '',
                    policy_tab_icon_url text NOT NULL DEFAULT '',
                    jobs_tab_icon_image text NOT NULL DEFAULT '',
                    jobs_tab_icon_url text NOT NULL DEFAULT '',
                    jobs_icon_image text NOT NULL DEFAULT '',
                    jobs_icon_url text NOT NULL DEFAULT '',
                    policy_tab_active_bg text NOT NULL DEFAULT '#1e293b',
                    policy_tab_active_color text NOT NULL DEFAULT '#ffffff',
                    jobs_tab_active_bg text NOT NULL DEFAULT '#1e293b',
                    jobs_tab_active_color text NOT NULL DEFAULT '#ffffff',
                    created_at timestamp with time zone NULL,
                    updated_at timestamp with time zone NULL
                );

                CREATE TABLE IF NOT EXISTS hr_section_translations (
                    id bigserial PRIMARY KEY,
                    section bigint NULL REFERENCES hr_section(id) ON DELETE CASCADE,
                    language bigint NULL REFERENCES language(id) ON DELETE CASCADE,
                    title text NOT NULL DEFAULT '',
                    subtitle text NOT NULL DEFAULT '',
                    description text NOT NULL DEFAULT '',
                    btn_text text NOT NULL DEFAULT ''
                );

                ALTER TABLE hr_section_translations
                ADD COLUMN IF NOT EXISTS section bigint NULL REFERENCES hr_section(id) ON DELETE CASCADE;

                ALTER TABLE hr_section_translations
                ADD COLUMN IF NOT EXISTS language bigint NULL REFERENCES language(id) ON DELETE CASCADE;

                CREATE UNIQUE INDEX IF NOT EXISTS hr_section_translations_section_language_idx
                ON hr_section_translations(section, language);

                ALTER TABLE hr_section
                ADD COLUMN IF NOT EXISTS banner_image text NOT NULL DEFAULT '';

                ALTER TABLE hr_section
                ADD COLUMN IF NOT EXISTS banner_url text NOT NULL DEFAULT '';
            """,
            reverse_sql="""
                ALTER TABLE hr_section DROP COLUMN IF EXISTS banner_image;
                ALTER TABLE hr_section DROP COLUMN IF EXISTS banner_url;
            """,
        ),
    ]
