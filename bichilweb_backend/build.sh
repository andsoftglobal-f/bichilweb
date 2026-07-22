#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input

# Бүх migration-г fake хийж бүртгэх (хүснэгтүүд аль хэдийн байгаа)
python manage.py migrate --fake

# ⚠️ DEPLOY АМЖИЛТТАЙ БОЛСНЫ ДАРАА дээрх мөрийг устгаад доорхыг нээ:
# python manage.py migrate
