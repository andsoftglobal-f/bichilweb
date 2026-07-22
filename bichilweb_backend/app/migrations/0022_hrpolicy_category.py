from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0021_aboutcategory_allow_url_slug'),
    ]

    operations = [
        migrations.CreateModel(
            name='HrPolicyCategory',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('key', models.CharField(max_length=100, unique=True)),
                ('sort_order', models.IntegerField(default=0)),
                ('active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'hr_policy_category',
                'ordering': ['sort_order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='HrPolicyCategoryTranslations',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('name', models.TextField(blank=True, null=True)),
                ('desc', models.TextField(blank=True, null=True)),
                ('category', models.ForeignKey(blank=True, db_column='category', null=True, on_delete=django.db.models.deletion.CASCADE, to='app.hrpolicycategory')),
                ('language', models.ForeignKey(blank=True, db_column='language', null=True, on_delete=django.db.models.deletion.CASCADE, to='app.language')),
            ],
            options={
                'db_table': 'hr_policy_category_translations',
                'unique_together': {('category', 'language')},
            },
        ),
        migrations.AddField(
            model_name='hrpolicy',
            name='category',
            field=models.ForeignKey(blank=True, db_column='category', null=True, on_delete=django.db.models.deletion.SET_NULL, to='app.hrpolicycategory'),
        ),
    ]
