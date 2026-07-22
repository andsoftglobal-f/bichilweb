from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0004_add_quaternary_menu'),
    ]

    operations = [
        migrations.AddField(
            model_name='callbutton',
            name='arrow_color',
            field=models.TextField(blank=True, default='#9ca3af', null=True),
        ),
    ]
