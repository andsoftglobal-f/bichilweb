from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0028_divider_margin_top'),
    ]

    operations = [
        migrations.AddField(
            model_name='partnersectionconfig',
            name='divider_margin_bottom',
            field=models.CharField(blank=True, default='24px', max_length=20),
        ),
        migrations.AddField(
            model_name='producttutorialconfig',
            name='divider_margin_bottom',
            field=models.CharField(blank=True, default='32px', max_length=20),
        ),
    ]
