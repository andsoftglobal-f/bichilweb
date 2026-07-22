from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0014_appdownload_fontfamily'),
    ]

    operations = [
        migrations.AddField(
            model_name='statsconfig',
            name='fontfamily',
            field=models.TextField(blank=True, null=True),
        ),
    ]
