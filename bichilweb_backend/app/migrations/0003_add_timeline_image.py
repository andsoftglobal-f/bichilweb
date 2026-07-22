from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0002_add_url_to_floatmenu'),
    ]

    operations = [
        migrations.AddField(
            model_name='timelineevent',
            name='image',
            field=models.TextField(blank=True, null=True),
        ),
    ]
