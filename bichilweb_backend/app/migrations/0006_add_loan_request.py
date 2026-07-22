from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0005_add_arrow_color'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoanRequest',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('first_name', models.CharField(max_length=100)),
                ('last_name', models.CharField(max_length=100)),
                ('phone', models.CharField(max_length=8)),
                ('status', models.CharField(choices=[('new', 'Шинэ'), ('processing', 'Шийдвэрлэж байна'), ('approved', 'Зөвшөөрсөн'), ('rejected', 'Татгалзсан')], default='new', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='loan_requests', to='app.product')),
            ],
            options={
                'db_table': 'loan_requests',
                'ordering': ['-created_at'],
            },
        ),
    ]
