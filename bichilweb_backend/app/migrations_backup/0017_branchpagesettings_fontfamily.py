from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0016_aboutbannertranslations_fontfamily'),
    ]

    operations = [
        migrations.AddField(
            model_name='branchpagesettings',
            name='fontfamily',
            field=models.TextField(blank=True, null=True),
        ),
    ]
