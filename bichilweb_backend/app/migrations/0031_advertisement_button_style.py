from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0030_news_page_home_title_and_button_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='advertisement',
            name='button_text',
            field=models.TextField(blank=True, default='Энд дарна уу', null=True),
        ),
        migrations.AddField(
            model_name='advertisement',
            name='button_font_family',
            field=models.TextField(blank=True, default='', null=True),
        ),
        migrations.AddField(
            model_name='advertisement',
            name='button_text_color',
            field=models.TextField(blank=True, default='#ffffff', null=True),
        ),
        migrations.AddField(
            model_name='advertisement',
            name='button_text_size',
            field=models.TextField(blank=True, default='18px', null=True),
        ),
    ]
