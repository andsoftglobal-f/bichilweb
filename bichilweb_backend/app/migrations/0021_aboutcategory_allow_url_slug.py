# Generated manually to allow URL paths such as "/BIS" in about category slug.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0020_aboutcategory_page_url_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='aboutcategory',
            name='slug',
            field=models.CharField(max_length=500, unique=True),
        ),
    ]
