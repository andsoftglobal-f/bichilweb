from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0027_partner_and_tutorial_divider_config'),
    ]

    operations = [
        migrations.AddField(
            model_name='partnersectionconfig',
            name='divider_margin_top',
            field=models.CharField(blank=True, default='12px', max_length=20),
        ),
        migrations.AddField(
            model_name='producttutorialconfig',
            name='divider_margin_top',
            field=models.CharField(blank=True, default='12px', max_length=20),
        ),
    ]
