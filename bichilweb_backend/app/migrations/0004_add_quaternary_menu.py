from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0003_add_timeline_image'),
    ]

    operations = [
        migrations.CreateModel(
            name='HeaderQuaternaryMenu',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('font', models.TextField(blank=True, null=True)),
                ('path', models.TextField(blank=True, null=True)),
                ('index', models.SmallIntegerField(blank=True, null=True)),
                ('visible', models.SmallIntegerField(blank=True, null=True)),
                ('header_tertiary', models.ForeignKey(
                    blank=True, db_column='header_tertiary', null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='quaternary_menus',
                    to='app.headertertiarymenu',
                )),
            ],
            options={
                'db_table': 'header_quaternary_menu',
            },
        ),
        migrations.CreateModel(
            name='HeaderQuaternaryMenuTranslation',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('label', models.TextField(blank=True, null=True)),
                ('quaternary_menu', models.ForeignKey(
                    blank=True, db_column='quaternary_menu', null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    to='app.headerquaternarymenu',
                )),
                ('language', models.ForeignKey(
                    blank=True, db_column='language', null=True,
                    on_delete=django.db.models.deletion.DO_NOTHING,
                    to='app.language',
                )),
            ],
            options={
                'db_table': 'header_quaternary_menu_translation',
            },
        ),
    ]
