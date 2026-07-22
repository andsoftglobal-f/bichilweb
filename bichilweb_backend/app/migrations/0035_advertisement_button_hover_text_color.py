from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0034_floatmenu_open_in_iframe'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE advertisement "
                        "ADD COLUMN IF NOT EXISTS button_hover_text_color text DEFAULT '#ef3f0a';"
                    ),
                    reverse_sql=(
                        "ALTER TABLE advertisement "
                        "DROP COLUMN IF EXISTS button_hover_text_color;"
                    ),
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='advertisement',
                    name='button_hover_text_color',
                    field=models.TextField(blank=True, default='#ef3f0a', null=True),
                ),
            ],
        ),
    ]
