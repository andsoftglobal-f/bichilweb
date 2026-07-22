from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0015_statsconfig_fontfamily'),
    ]

    operations = [
        migrations.AddField(
            model_name='aboutbannertranslations',
            name='fontfamily',
            field=models.TextField(blank=True, default=''),
        ),
    ]
