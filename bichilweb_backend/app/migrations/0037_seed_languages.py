from django.db import migrations, connection


def seed_languages(apps, schema_editor):
    Language = apps.get_model('app', 'Language')

    Language.objects.update_or_create(
        id=1,
        defaults={
            'lang_code': 'en',
            'lang_name': 'English',
        },
    )
    Language.objects.update_or_create(
        id=2,
        defaults={
            'lang_code': 'mn',
            'lang_name': 'Монгол',
        },
    )

    with connection.cursor() as cursor:
        cursor.execute("SELECT pg_get_serial_sequence('language', 'id')")
        row = cursor.fetchone()
        sequence_name = row[0] if row else None
        if sequence_name:
            cursor.execute(
                "SELECT setval(%s, (SELECT COALESCE(MAX(id), 1) FROM language), true)",
                [sequence_name],
            )


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0036_management_category_slogan'),
    ]

    operations = [
        migrations.RunPython(seed_languages, migrations.RunPython.noop),
    ]
