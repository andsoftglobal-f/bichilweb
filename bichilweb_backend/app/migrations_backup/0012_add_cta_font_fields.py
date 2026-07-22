from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0011_change_header_font_to_textfield'),
    ]

    operations = [
        migrations.AddField(
            model_name='cta',
            name='description_font',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cta',
            name='subtitle_font',
            field=models.TextField(blank=True, null=True),
        ),
    ]
