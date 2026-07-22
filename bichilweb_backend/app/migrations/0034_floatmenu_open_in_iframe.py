from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0033_homepagelink'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    ALTER TABLE float_menu
                    ADD COLUMN IF NOT EXISTS open_in_iframe boolean DEFAULT false;

                    ALTER TABLE float_menu_submenus
                    ADD COLUMN IF NOT EXISTS open_in_iframe boolean DEFAULT false;
                    """,
                    reverse_sql="""
                    ALTER TABLE float_menu
                    DROP COLUMN IF EXISTS open_in_iframe;

                    ALTER TABLE float_menu_submenus
                    DROP COLUMN IF EXISTS open_in_iframe;
                    """,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='floatmenu',
                    name='open_in_iframe',
                    field=models.BooleanField(blank=True, default=False, null=True),
                ),
                migrations.AddField(
                    model_name='floatmenusubmenus',
                    name='open_in_iframe',
                    field=models.BooleanField(blank=True, default=False, null=True),
                ),
            ],
        ),
    ]
