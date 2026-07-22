from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0006_add_loan_request'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoanRequestPage',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('banner_image', models.CharField(blank=True, default='', max_length=500)),
                ('mobile_banner_image', models.CharField(blank=True, default='', max_length=500)),
                ('title_mn', models.CharField(blank=True, default='', max_length=200)),
                ('title_en', models.CharField(blank=True, default='', max_length=200)),
                ('subtitle_mn', models.CharField(blank=True, default='', max_length=500)),
                ('subtitle_en', models.CharField(blank=True, default='', max_length=500)),
                ('disclaimer_mn', models.TextField(blank=True, default='')),
                ('disclaimer_en', models.TextField(blank=True, default='')),
                ('button_text_mn', models.CharField(blank=True, default='', max_length=100)),
                ('button_text_en', models.CharField(blank=True, default='', max_length=100)),
                ('active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'loan_request_page',
            },
        ),
    ]
