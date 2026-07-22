from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0035_advertisement_button_hover_text_color'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE management_category_translations "
                        "ADD COLUMN IF NOT EXISTS slogan text DEFAULT '';"
                    ),
                    reverse_sql=(
                        "ALTER TABLE management_category_translations "
                        "DROP COLUMN IF EXISTS slogan;"
                    ),
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='managementcategorytranslations',
                    name='slogan',
                    field=models.TextField(blank=True, default='', null=True),
                ),
            ],
        ),
    ]
