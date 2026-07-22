from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0022_hrpolicy_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='hrsection',
            name='banner_image',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='hrsection',
            name='banner_url',
            field=models.TextField(blank=True, default=''),
        ),
    ]
