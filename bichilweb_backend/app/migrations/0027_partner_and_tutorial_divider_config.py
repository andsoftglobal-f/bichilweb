from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0026_partnersectionconfig'),
    ]

    operations = [
        migrations.AddField(
            model_name='partnersectionconfig',
            name='divider_width',
            field=models.CharField(blank=True, default='64px', max_length=20),
        ),
        migrations.AddField(
            model_name='partnersectionconfig',
            name='divider_height',
            field=models.CharField(blank=True, default='4px', max_length=20),
        ),
        migrations.AddField(
            model_name='partnersectionconfig',
            name='divider_color',
            field=models.CharField(blank=True, default='#0048BA', max_length=20),
        ),
        migrations.AddField(
            model_name='producttutorialconfig',
            name='divider_width',
            field=models.CharField(blank=True, default='64px', max_length=20),
        ),
        migrations.AddField(
            model_name='producttutorialconfig',
            name='divider_height',
            field=models.CharField(blank=True, default='4px', max_length=20),
        ),
        migrations.AddField(
            model_name='producttutorialconfig',
            name='divider_color',
            field=models.CharField(blank=True, default='#0048BA', max_length=20),
        ),
    ]
