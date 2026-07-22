from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0018_hrpolicy_fontfamily'),
    ]

    operations = [
        migrations.CreateModel(
            name='CallButton',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('url', models.TextField(blank=True, null=True)),
                ('svg', models.TextField(blank=True, null=True)),
                ('button_color', models.TextField(blank=True, default='#ef4444', null=True)),
                ('icon_color', models.TextField(blank=True, default='#ffffff', null=True)),
                ('active', models.BooleanField(blank=True, default=True, null=True)),
            ],
            options={
                'db_table': 'call_button',
            },
        ),
    ]
