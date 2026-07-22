from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0009_remove_duplicate_django_models'),
    ]

    operations = [
        migrations.AddField(
            model_name='productdetails',
            name='banner_image',
            field=models.ImageField(blank=True, null=True, upload_to='products/banners/'),
        ),
        migrations.AddField(
            model_name='productdetails',
            name='banner_mobile_image',
            field=models.ImageField(blank=True, null=True, upload_to='products/banners/'),
        ),
        migrations.AddField(
            model_name='productdetails',
            name='description_mn',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='productdetails',
            name='description_en',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='productdetails',
            name='description_color',
            field=models.CharField(blank=True, default='#ffffff', max_length=20),
        ),
        migrations.AddField(
            model_name='productdetails',
            name='description_font_size',
            field=models.CharField(blank=True, default='16px', max_length=10),
        ),
        migrations.AddField(
            model_name='productdetails',
            name='description_align',
            field=models.CharField(blank=True, default='center', max_length=10),
        ),
    ]
