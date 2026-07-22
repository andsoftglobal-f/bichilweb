from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0032_footeremails_label'),
    ]

    operations = [
        migrations.CreateModel(
            name='HomePageLink',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('title', models.TextField(blank=True, null=True)),
                ('page_url', models.TextField(blank=True, null=True)),
                ('placement', models.TextField(blank=True, default='after-hero', null=True)),
                ('sort_order', models.IntegerField(blank=True, default=0, null=True)),
                ('active', models.BooleanField(blank=True, default=True, null=True)),
            ],
            options={
                'db_table': 'home_page_links',
                'ordering': ['placement', 'sort_order', 'id'],
            },
        ),
    ]
