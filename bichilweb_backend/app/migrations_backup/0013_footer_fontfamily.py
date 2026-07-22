from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0012_add_cta_font_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='footer',
            name='fontfamily',
            field=models.TextField(blank=True, null=True),
        ),
    ]
