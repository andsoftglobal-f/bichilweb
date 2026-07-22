from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0018_producttutorialconfig'),
    ]

    operations = [
        migrations.AddField(
            model_name='producttutorialconfig',
            name='title_font_family',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
