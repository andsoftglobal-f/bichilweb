from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0013_footer_fontfamily'),
    ]

    operations = [
        migrations.AddField(
            model_name='appdownload',
            name='fontfamily',
            field=models.TextField(blank=True, null=True),
        ),
    ]
