from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0029_divider_margin_bottom'),
    ]

    operations = [
        migrations.AddField(
            model_name='newspagesettings',
            name='home_heading',
            field=models.TextField(blank=True, default='Мэдээ', null=True),
        ),
        migrations.AddField(
            model_name='newspagesettings',
            name='home_heading_en',
            field=models.TextField(blank=True, default='News', null=True),
        ),
        migrations.AddField(
            model_name='newspagesettings',
            name='heading_font_family',
            field=models.TextField(blank=True, default='', null=True),
        ),
        migrations.AddField(
            model_name='newspagesettings',
            name='divider_width',
            field=models.TextField(blank=True, default='64px', null=True),
        ),
        migrations.AddField(
            model_name='newspagesettings',
            name='divider_height',
            field=models.TextField(blank=True, default='4px', null=True),
        ),
        migrations.AddField(
            model_name='newspagesettings',
            name='divider_margin_top',
            field=models.TextField(blank=True, default='12px', null=True),
        ),
        migrations.AddField(
            model_name='newspagesettings',
            name='divider_margin_bottom',
            field=models.TextField(blank=True, default='80px', null=True),
        ),
        migrations.AddField(
            model_name='newspagesettings',
            name='button_text',
            field=models.TextField(blank=True, default='Дэлгэрэнгүй', null=True),
        ),
        migrations.AddField(
            model_name='newspagesettings',
            name='button_text_en',
            field=models.TextField(blank=True, default='View All', null=True),
        ),
        migrations.AddField(
            model_name='newspagesettings',
            name='button_font_family',
            field=models.TextField(blank=True, default='', null=True),
        ),
        migrations.AlterField(
            model_name='newspagesettings',
            name='divider_color',
            field=models.TextField(blank=True, default='#0048BA', null=True),
        ),
    ]
