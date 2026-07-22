from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0010_productdetails_banner_and_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='headermenu',
            name='font',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='headersubmenu',
            name='font',
            field=models.TextField(blank=True, null=True),
        ),
    ]
