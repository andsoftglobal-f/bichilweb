from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0031_advertisement_button_style'),
    ]

    operations = [
        migrations.AddField(
            model_name='footeremails',
            name='label',
            field=models.TextField(blank=True, null=True),
        ),
    ]
