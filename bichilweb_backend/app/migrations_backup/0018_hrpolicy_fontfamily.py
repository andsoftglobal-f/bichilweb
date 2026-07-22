from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0017_branchpagesettings_fontfamily'),
    ]

    operations = [
        migrations.AddField(
            model_name='hrpolicy',
            name='fontfamily',
            field=models.TextField(blank=True, null=True),
        ),
    ]
