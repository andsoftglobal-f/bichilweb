from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0025_hrsection_responsive_banner_sql'),
    ]

    operations = [
        migrations.CreateModel(
            name='PartnerSectionConfig',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title_mn', models.CharField(blank=True, default='Хамтрагч байгууллагууд', max_length=255)),
                ('title_en', models.CharField(blank=True, default='Partner organizations', max_length=255)),
                ('title_color', models.CharField(blank=True, default='#9ca3af', max_length=20)),
                ('title_font_size', models.CharField(blank=True, default='0.875rem', max_length=20)),
                ('title_font_family', models.CharField(blank=True, default='', max_length=100)),
            ],
            options={
                'db_table': 'partner_section_config',
            },
        ),
    ]
