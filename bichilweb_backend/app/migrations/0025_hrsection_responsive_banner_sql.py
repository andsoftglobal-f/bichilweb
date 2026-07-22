from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0024_add_hrsection_banner_columns_sql'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE hr_section
                ADD COLUMN IF NOT EXISTS banner_desktop_image text NOT NULL DEFAULT '';

                ALTER TABLE hr_section
                ADD COLUMN IF NOT EXISTS banner_desktop_url text NOT NULL DEFAULT '';

                ALTER TABLE hr_section
                ADD COLUMN IF NOT EXISTS banner_tablet_image text NOT NULL DEFAULT '';

                ALTER TABLE hr_section
                ADD COLUMN IF NOT EXISTS banner_tablet_url text NOT NULL DEFAULT '';

                ALTER TABLE hr_section
                ADD COLUMN IF NOT EXISTS banner_mobile_image text NOT NULL DEFAULT '';

                ALTER TABLE hr_section
                ADD COLUMN IF NOT EXISTS banner_mobile_url text NOT NULL DEFAULT '';

                UPDATE hr_section
                SET
                    banner_desktop_image = COALESCE(NULLIF(banner_desktop_image, ''), banner_image, ''),
                    banner_desktop_url = COALESCE(NULLIF(banner_desktop_url, ''), banner_url, '')
                WHERE
                    (banner_desktop_image = '' OR banner_desktop_image IS NULL)
                    AND (banner_image <> '' OR banner_url <> '');
            """,
            reverse_sql="""
                ALTER TABLE hr_section DROP COLUMN IF EXISTS banner_mobile_url;
                ALTER TABLE hr_section DROP COLUMN IF EXISTS banner_mobile_image;
                ALTER TABLE hr_section DROP COLUMN IF EXISTS banner_tablet_url;
                ALTER TABLE hr_section DROP COLUMN IF EXISTS banner_tablet_image;
                ALTER TABLE hr_section DROP COLUMN IF EXISTS banner_desktop_url;
                ALTER TABLE hr_section DROP COLUMN IF EXISTS banner_desktop_image;
            """,
        ),
    ]
