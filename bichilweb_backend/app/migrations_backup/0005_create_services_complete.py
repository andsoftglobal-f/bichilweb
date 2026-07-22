# Generated migration - Recreate Services table with full structure

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0004_add_services_and_utilities_tables'),
    ]

    operations = [
        # Drop old services table from DB + remove from Django state (separately)
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql='DROP TABLE IF EXISTS "Services" CASCADE; DROP TABLE IF EXISTS "services" CASCADE;',
                    reverse_sql="SELECT 1;",
                ),
            ],
            state_operations=[
                migrations.DeleteModel(name='Services'),
            ],
        ),

        # Create the complete Services table
        migrations.CreateModel(
            name='Services',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True, null=True)),
            ],
            options={
                'db_table': 'Services',
                'managed': True,
            },
        ),

        # Create ServicesTranslations table
        migrations.CreateModel(
            name='ServicesTranslations',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('title', models.TextField(blank=True, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('language', models.ForeignKey('app.Language', models.DO_NOTHING, db_column='language', blank=True, null=True)),
                ('service', models.ForeignKey('app.Services', models.DO_NOTHING, db_column='service', blank=True, null=True)),
            ],
            options={
                'db_table': 'Services_translations',
                'managed': True,
            },
        ),
    ]
