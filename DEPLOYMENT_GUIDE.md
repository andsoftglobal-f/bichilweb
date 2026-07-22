# Bichilweb — Хувийн Сервер дээр Deploy хийх заавар

Render + Cloudinary → **Хувийн сервер + Хувийн storage** руу шилжүүлэх бүрэн заавар.

---

## Архитектур

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Таны сервер (VPS / Dedicated)                 │
│                                                                     │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │ Nginx    │──►│ bichilweb    │   │ bichilweb    │                │
│  │ (reverse │   │ (frontend)   │   │ _admin       │                │
│  │  proxy)  │──►│ :3000        │   │ :3001        │                │
│  │ :80/443  │──►│              │   │              │                │
│  │          │   └──────────────┘   └──────────────┘                │
│  │          │                                                       │
│  │          │──►┌──────────────┐   ┌──────────────┐                │
│  │          │   │ Django       │   │ PostgreSQL   │                │
│  │          │   │ (backend)    │   │ :5432        │                │
│  │          │   │ :8000        │   │              │                │
│  │          │   └──────────────┘   └──────────────┘                │
│  │          │                                                       │
│  │          │──► /media/ (файл хадгалах фолдер)                    │
│  └──────────┘                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Серверийн шаардлага

| Параметр | Хамгийн бага | Санал болгох |
|----------|-------------|-------------|
| OS | Ubuntu 22.04+ / CentOS 9 | Ubuntu 24.04 LTS |
| CPU | 2 core | 4 core |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 100 GB SSD |
| Порт | 80, 443, 22 нээлттэй | |

---

## Алхам 1: Серверийг бэлдэх

SSH-ээр серверт холбогдон:

```bash
ssh root@СЕРВЕРИЙН_IP
```

### 1.1 Системийг шинэчлэх

```bash
apt update && apt upgrade -y
```

### 1.2 Шаардлагатай програмууд суулгах

```bash
# Үндсэн хэрэгсэл
apt install -y curl git build-essential nginx certbot python3-certbot-nginx

# Python 3.12
apt install -y software-properties-common
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.12 python3.12-venv python3.12-dev

# Node.js 22 (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# PostgreSQL 16
apt install -y postgresql postgresql-contrib

# PM2 (Node.js процесс менежер)
npm install -g pm2
```

Суулгасан эсэхийг шалгах:

```bash
python3.12 --version   # Python 3.12.x
node --version          # v22.x.x
npm --version           # 10.x.x
psql --version          # psql 16.x
nginx -v                # nginx/1.x
pm2 --version           # 5.x.x
```

---

## Алхам 2: PostgreSQL тохируулах

### 2.1 Database үүсгэх

```bash
sudo -u postgres psql
```

SQL командууд:

```sql
CREATE USER bichilweb_user WITH PASSWORD 'НУУЦ_ҮГ_СОЛИНО';
CREATE DATABASE bichilweb_db OWNER bichilweb_user;
GRANT ALL PRIVILEGES ON DATABASE bichilweb_db TO bichilweb_user;
\q
```

> ⚠️ `НУУЦ_ҮГ_СОЛИНО` дээр хүчтэй нууц үг оруулна. Жишээ: `openssl rand -base64 32`

### 2.2 Render DB-с data шилжүүлэх (хэрвээ хуучин data хэрэгтэй бол)

Render-ийн PostgreSQL-с dump авах:

```bash
# Render-ийн external connection string ашиглана
pg_dump "postgresql://bichilweb_db_emzp_user:6TpyOr4jPpxZ3G75sBp8kpJrXvIrNa0v@dpg-d689vsur433s73ch0i8g-a.oregon-postgres.render.com:5432/bichilweb_db_emzp" \
  --no-owner --no-privileges -F c -f bichilweb_backup.dump

# Хувийн серверийн DB руу restore хийх
pg_restore -U bichilweb_user -d bichilweb_db --no-owner --no-privileges bichilweb_backup.dump
```

---

## Алхам 3: Код татах, фолдер бүтэц

### 3.1 Хэрэглэгч үүсгэх (root-р ажиллуулахгүй)

```bash
adduser bichilweb --disabled-password --gecos ""
usermod -aG sudo bichilweb
su - bichilweb
```

### 3.2 Код clone хийх

```bash
mkdir -p ~/apps
cd ~/apps

# 3 тусдаа repo clone хийх (эсвэл нэг repo бол нэг clone)
git clone <ТА_ӨӨР_ГИТ_URL> bichilweb           # frontend
git clone <ТА_ӨӨР_ГИТ_URL> bichilweb_admin      # admin
git clone <ТА_ӨӨР_ГИТ_URL> bichilweb_backend    # Django backend
```

### 3.3 Media фолдер үүсгэх

```bash
# Django media файлууд энд хадгалагдана (Cloudinary-ийн оронд)
mkdir -p ~/apps/bichilweb_backend/media
chmod 755 ~/apps/bichilweb_backend/media
```

---

## Алхам 4: Django Backend тохируулах

### 4.1 Virtual environment

```bash
cd ~/apps/bichilweb_backend
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn   # production WSGI server
```

### 4.2 `.env` файл үүсгэх

```bash
nano ~/apps/bichilweb_backend/.env
```

Дараах агуулгыг бичнэ:

```env
# ============ DJANGO CORE ============
SECRET_KEY=django-production-СОЛИХ-openssl-rand-base64-50
DEBUG=False
ALLOWED_HOSTS=api.ТАНЫ_ДОМАЙН.mn,СЕРВЕРИЙН_IP

# ============ DATABASE (Хувийн PostgreSQL) ============
DB_NAME=bichilweb_db
DB_USER=bichilweb_user
DB_PASSWORD=НУУЦ_ҮГ_СОЛИНО
DB_HOST=localhost
DB_PORT=5432

# ============ CORS ============
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://ТАНЫ_ДОМАЙН.mn,https://admin.ТАНЫ_ДОМАЙН.mn

# ============ CLOUDINARY (Хувийн storage ашиглавал хоосон байж болно) ============
# Хэрвээ Cloudinary үргэлжлүүлэн ашиглах бол утгуудыг оруулна.
# Хэрвээ зөвхөн local media ашиглах бол доорх хэсгийг хоосон орхино:
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> 🔐 `SECRET_KEY` үүсгэх: `python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

### 4.3 settings.py-д Cloudinary-г optional болгох

Одоогоор settings.py дээр Cloudinary key байхгүй бол production дээр crash хийдэг. Хувийн серверт local file storage ашиглахад зөвшөөрөхийн тулд:

[bichilweb_backend/bichilglobusweb/settings.py](bichilweb_backend/bichilglobusweb/settings.py) файлд:

**Хуучин:**
```python
if not CLOUDINARY_STORAGE['API_KEY']:
    if not DEBUG:
        raise ValueError(...)
```

**Шинэ:**
```python
USE_CLOUDINARY = bool(CLOUDINARY_STORAGE['API_KEY'])

if USE_CLOUDINARY:
    cloudinary.config(
        cloud_name=CLOUDINARY_STORAGE['CLOUD_NAME'],
        api_key=CLOUDINARY_STORAGE['API_KEY'],
        api_secret=CLOUDINARY_STORAGE['API_SECRET'],
    )
```

Мөн `'render.com'` SSL шалгалтыг засах:
```python
# Хуучин:
if 'render.com' in env("DB_HOST", default=""):
    DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}

# Шинэ (localhost бол SSL шаардахгүй):
if env("DB_HOST", default="localhost") not in ("localhost", "127.0.0.1"):
    DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}
```

### 4.4 Migrate ба static файл цуглуулах

```bash
cd ~/apps/bichilweb_backend
source venv/bin/activate

python manage.py migrate
python manage.py collectstatic --noinput

# CMS панел (bichilweb_admin) руу нэвтрэх эхний Super Admin — bcrypt-ээр
# хадгалагдана, "Хэрэглэгчид" цэс дэх эрхийн системийг ашиглана.
python manage.py create_admin

# (Заавал биш) Django-ийн өөрийн built-in /admin/ site рүү нэвтрэх бол:
# python manage.py createsuperuser
```

`create_admin` нь эхний ажиллуулалтын дараа "Admin" нэртэй role-ийг (Django Group) бүх контент-ийн permission-той автоматаар үүсгэдэг тул дараа нь шинэ хэрэглэгч бүртгэхэд эрхгүй хоцрохгүй. Дараа нь Super Admin өөрөө "Role удирдлага"-с эрхийг тохируулж болно.

### 4.5 Gunicorn systemd service

```bash
sudo nano /etc/systemd/system/bichilweb-backend.service
```

```ini
[Unit]
Description=Bichilweb Django Backend (Gunicorn)
After=network.target postgresql.service

[Service]
User=bichilweb
Group=bichilweb
WorkingDirectory=/home/bichilweb/apps/bichilweb_backend
Environment="PATH=/home/bichilweb/apps/bichilweb_backend/venv/bin"
ExecStart=/home/bichilweb/apps/bichilweb_backend/venv/bin/gunicorn \
    bichilglobusweb.wsgi:application \
    --bind 127.0.0.1:8000 \
    --workers 4 \
    --timeout 120 \
    --max-requests 1000 \
    --access-logfile /home/bichilweb/apps/bichilweb_backend/access.log \
    --error-logfile /home/bichilweb/apps/bichilweb_backend/error.log

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable bichilweb-backend
sudo systemctl start bichilweb-backend
sudo systemctl status bichilweb-backend  # "active (running)" байх ёстой
```

---

## Алхам 5: Frontend + Admin (Next.js) тохируулах

### 5.1 Frontend (bichilweb) Build

```bash
cd ~/apps/bichilweb
nano .env
```

```env
BACKEND_API_URL=https://api.ТАНЫ_ДОМАЙН.mn/api/v1
BACKEND_URL=https://api.ТАНЫ_ДОМАЙН.mn
NEXT_PUBLIC_API_URL=https://api.ТАНЫ_ДОМАЙН.mn/api/v1
NEXT_PUBLIC_MEDIA_URL=https://api.ТАНЫ_ДОМАЙН.mn
NODE_ENV=production
```

```bash
npm install
npm run build
```

### 5.2 Admin (bichilweb_admin) Build

```bash
cd ~/apps/bichilweb_admin
nano .env
```

```env
BACKEND_API_URL=https://api.ТАНЫ_ДОМАЙН.mn/api/v1
BACKEND_URL=https://api.ТАНЫ_ДОМАЙН.mn
NEXT_PUBLIC_API_URL=https://api.ТАНЫ_ДОМАЙН.mn/api/v1
NEXT_PUBLIC_FRONTEND_URL=https://ТАНЫ_ДОМАЙН.mn
NEXT_PUBLIC_MEDIA_URL=https://api.ТАНЫ_ДОМАЙН.mn
NODE_ENV=production
```

```bash
npm install
npm run build
```

### 5.3 PM2-р Next.js процесс ажиллуулах

```bash
# Frontend
cd ~/apps/bichilweb
pm2 start npm --name "bichilweb-frontend" -- start

# Admin
cd ~/apps/bichilweb_admin
pm2 start npm --name "bichilweb-admin" -- start

# Серверт restart хийхэд автоматаар эхлэх
pm2 save
pm2 startup
# Гарч ирсэн sudo командыг хуулаад ажиллуулна
```

Шалгах:

```bash
pm2 status
# ┌──────────────────────┬───────┬────────┐
# │ name                 │ status│ port   │
# ├──────────────────────┼───────┼────────┤
# │ bichilweb-frontend   │ online│ 3000   │
# │ bichilweb-admin      │ online│ 3001   │
# └──────────────────────┴───────┴────────┘
```

---

## Алхам 6: Nginx тохируулах (Reverse Proxy + SSL)

### 6.1 Backend API

```bash
sudo nano /etc/nginx/sites-available/bichilweb-backend
```

```nginx
server {
    listen 80;
    server_name api.ТАНЫ_ДОМАЙН.mn;

    client_max_body_size 300M;

    # Django static файлууд
    location /static/ {
        alias /home/bichilweb/apps/bichilweb_backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media файлууд (зураг, видео — Cloudinary-ийн оронд)
    location /media/ {
        alias /home/bichilweb/apps/bichilweb_backend/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Django API → Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

### 6.2 Frontend

```bash
sudo nano /etc/nginx/sites-available/bichilweb-frontend
```

```nginx
server {
    listen 80;
    server_name ТАНЫ_ДОМАЙН.mn www.ТАНЫ_ДОМАЙН.mn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.3 Admin

```bash
sudo nano /etc/nginx/sites-available/bichilweb-admin
```

```nginx
server {
    listen 80;
    server_name admin.ТАНЫ_ДОМАЙН.mn;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.4 Sites идэвхжүүлэх

```bash
sudo ln -s /etc/nginx/sites-available/bichilweb-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/bichilweb-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/bichilweb-admin /etc/nginx/sites-enabled/

# Default site устгах
sudo rm -f /etc/nginx/sites-enabled/default

# Тест хийх
sudo nginx -t

# Nginx дахин ачаалах
sudo systemctl reload nginx
```

### 6.5 SSL сертификат (Let's Encrypt — Үнэгүй)

```bash
sudo certbot --nginx \
  -d ТАНЫ_ДОМАЙН.mn \
  -d www.ТАНЫ_ДОМАЙН.mn \
  -d admin.ТАНЫ_ДОМАЙН.mn \
  -d api.ТАНЫ_ДОМАЙН.mn
```

Auto-renew:
```bash
sudo certbot renew --dry-run
# Certbot автоматаар cron/timer тохируулсан байна
```

---

## Алхам 7: DNS тохиргоо

Домайн DNS дээр дараах A record нэмнэ:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `СЕРВЕРИЙН_IP` |
| A | `www` | `СЕРВЕРИЙН_IP` |
| A | `admin` | `СЕРВЕРИЙН_IP` |
| A | `api` | `СЕРВЕРИЙН_IP` |

---

## Алхам 8: Cloudinary → Local Media шилжүүлэх

Хэрвээ Cloudinary дээрх зургуудыг хувийн серверт татаж авахыг хүсвэл:

### 8.1 Cloudinary дээрх файлуудыг татах скрипт

```bash
nano ~/apps/migrate_cloudinary.py
```

```python
#!/usr/bin/env python3
"""Cloudinary дээрх бүх зургийг local media фолдер руу татах скрипт."""
import os
import sys
import django
import requests
from pathlib import Path
from urllib.parse import urlparse

os.chdir('/home/bichilweb/apps/bichilweb_backend')
sys.path.insert(0, '/home/bichilweb/apps/bichilweb_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bichilglobusweb.settings')
django.setup()

from django.conf import settings

MEDIA_ROOT = settings.MEDIA_ROOT

def download_file(url, local_path):
    """Cloudinary URL-с файл татна."""
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        Path(local_path).parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, 'wb') as f:
            f.write(resp.content)
        print(f"  ✅ {local_path}")
        return True
    except Exception as e:
        print(f"  ❌ {url}: {e}")
        return False

def migrate_model_images():
    """Django model дотор хадгалагдсан Cloudinary URL-уудыг татаж, local path-д солих."""
    from app.models.models import (
        News, NewsImage, HeroSlider, CTASlider,
        AppDownload, Branch, Footer
    )

    # Жишээ: News model
    for item in News.objects.all():
        if item.image and 'cloudinary.com' in str(item.image):
            url = str(item.image)
            filename = urlparse(url).path.split('/')[-1]
            local_path = os.path.join(MEDIA_ROOT, 'news', filename)
            if download_file(url, local_path):
                item.image = f'news/{filename}'
                item.save(update_fields=['image'])

    for item in NewsImage.objects.all():
        if item.image and 'cloudinary.com' in str(item.image):
            url = str(item.image)
            filename = urlparse(url).path.split('/')[-1]
            local_path = os.path.join(MEDIA_ROOT, 'news', filename)
            if download_file(url, local_path):
                item.image = f'news/{filename}'
                item.save(update_fields=['image'])

    for item in HeroSlider.objects.all():
        if item.image and 'cloudinary.com' in str(item.image):
            url = str(item.image)
            filename = urlparse(url).path.split('/')[-1]
            local_path = os.path.join(MEDIA_ROOT, 'hero_sliders', filename)
            if download_file(url, local_path):
                item.image = f'hero_sliders/{filename}'
                item.save(update_fields=['image'])

    # Бусад model-уудыг мөн адил нэмнэ...
    print("\n🎉 Migration дууслаа!")

if __name__ == '__main__':
    migrate_model_images()
```

```bash
cd ~/apps/bichilweb_backend
source venv/bin/activate
pip install requests
python ~/apps/migrate_cloudinary.py
```

### 8.2 Backend views-ийн Cloudinary upload-ыг local болгох

Одоогоор views дээр `cloudinary.uploader.upload(...)` ашиглаж байна. Local storage ашиглахын тулд файлыг шууд `MEDIA_ROOT`-д хадгалах хэрэглэгддэг helper function нэмнэ:

**`bichilweb_backend/app/utils/storage.py`** (шинэ файл):

```python
"""
Cloudinary эсвэл Local файл хадгалах — нэг функцээр шийднэ.
USE_CLOUDINARY=True бол Cloudinary, False бол local MEDIA_ROOT руу хадгална.
"""
import os
import uuid
from django.conf import settings

def upload_file(file_obj, folder='uploads', resource_type='image'):
    """
    Файл upload хийх. Cloudinary идэвхтэй бол Cloudinary руу,
    Идэвхгүй бол local media фолдер руу хадгална.
    Returns: URL string (Cloudinary URL or /media/... path)
    """
    if getattr(settings, 'USE_CLOUDINARY', False):
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            file_obj,
            folder=f"bichilweb/{folder}",
            resource_type=resource_type,
        )
        return result.get('secure_url', '')
    else:
        # Local file storage
        ext = os.path.splitext(file_obj.name)[1] if hasattr(file_obj, 'name') else '.jpg'
        filename = f"{uuid.uuid4().hex}{ext}"
        save_dir = os.path.join(settings.MEDIA_ROOT, folder)
        os.makedirs(save_dir, exist_ok=True)
        filepath = os.path.join(save_dir, filename)
        with open(filepath, 'wb+') as f:
            for chunk in file_obj.chunks():
                f.write(chunk)
        # Return relative URL (/media/folder/filename.ext)
        return f"/media/{folder}/{filename}"


def delete_file(url_or_path, resource_type='image'):
    """
    Файл устгах. Cloudinary URL бол Cloudinary-с, Local бол disk-с устгана.
    """
    if not url_or_path:
        return
    url_str = str(url_or_path)
    if 'cloudinary.com' in url_str and getattr(settings, 'USE_CLOUDINARY', False):
        try:
            import cloudinary.uploader
            parts = url_str.split('/upload/')
            if len(parts) > 1:
                path = parts[1]
                # version хасах
                if path.startswith('v'):
                    path = '/'.join(path.split('/')[1:])
                public_id = os.path.splitext(path)[0]
                cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        except Exception as e:
            print(f"Cloudinary delete error: {e}")
    else:
        # Local file delete
        if url_str.startswith('/media/'):
            local_path = os.path.join(settings.MEDIA_ROOT, url_str.replace('/media/', ''))
            if os.path.exists(local_path):
                os.remove(local_path)
```

---

## Алхам 9: Firewall тохируулах

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
```

---

## Нэг домайн дээр бүгдийг тавих жишээ (Subdomain ашиглахгүй бол)

Хэрвээ нэг IP / нэг домайн дээр тавьж, subdomain ашиглахгүй бол:

| URL | Service |
|-----|---------|
| `https://ТАНЫ_ДОМАЙН.mn` | Frontend (bichilweb) |
| `https://ТАНЫ_ДОМАЙН.mn/admin-panel` | Admin |
| `https://ТАНЫ_ДОМАЙН.mn/api/v1/...` | Backend API |
| `https://ТАНЫ_ДОМАЙН.mn/media/...` | Media файлууд |

Энэ тохиолдолд Nginx нэг server block-д тохируулна:

```nginx
server {
    listen 80;
    server_name ТАНЫ_ДОМАЙН.mn;
    client_max_body_size 300M;

    # Media
    location /media/ {
        alias /home/bichilweb/apps/bichilweb_backend/media/;
        expires 7d;
    }

    # Static
    location /static/ {
        alias /home/bichilweb/apps/bichilweb_backend/staticfiles/;
        expires 30d;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django admin
    location /django-admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Admin panel (Next.js :3001)
    location /admin-panel/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # Frontend (Next.js :3000) — бусад бүгд
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## Хурдан шалгах checklist

```bash
# 1. PostgreSQL ажиллаж байна уу?
sudo systemctl status postgresql

# 2. Django backend ажиллаж байна уу?
sudo systemctl status bichilweb-backend
curl -s http://127.0.0.1:8000/api/v1/news/ | head -c 200

# 3. Frontend ажиллаж байна уу?
curl -s http://127.0.0.1:3000 | head -c 200

# 4. Admin ажиллаж байна уу?
curl -s http://127.0.0.1:3001 | head -c 200

# 5. Nginx ажиллаж байна уу?
sudo nginx -t && sudo systemctl status nginx

# 6. SSL ажиллаж байна уу?
curl -I https://ТАНЫ_ДОМАЙН.mn

# 7. Media файл хандалт
curl -I https://api.ТАНЫ_ДОМАЙН.mn/media/
```

---

## Код шинэчлэх (Deploy update)

Дараа нь код шинэчлэхэд:

```bash
# Backend
cd ~/apps/bichilweb_backend
git pull
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart bichilweb-backend

# Frontend
cd ~/apps/bichilweb
git pull
npm install
npm run build
pm2 restart bichilweb-frontend

# Admin
cd ~/apps/bichilweb_admin
git pull
npm install
npm run build
pm2 restart bichilweb-admin
```

---

## ENV хувьсагчуудын хураангуй

### bichilweb (frontend) `.env`

| Хувьсагч | Утга |
|----------|------|
| `BACKEND_API_URL` | `https://api.ТАНЫ_ДОМАЙН.mn/api/v1` |
| `BACKEND_URL` | `https://api.ТАНЫ_ДОМАЙН.mn` |
| `NEXT_PUBLIC_API_URL` | `https://api.ТАНЫ_ДОМАЙН.mn/api/v1` |
| `NEXT_PUBLIC_MEDIA_URL` | `https://api.ТАНЫ_ДОМАЙН.mn` |
| `NODE_ENV` | `production` |

### bichilweb_admin `.env`

| Хувьсагч | Утга |
|----------|------|
| `BACKEND_API_URL` | `https://api.ТАНЫ_ДОМАЙН.mn/api/v1` |
| `BACKEND_URL` | `https://api.ТАНЫ_ДОМАЙН.mn` |
| `NEXT_PUBLIC_API_URL` | `https://api.ТАНЫ_ДОМАЙН.mn/api/v1` |
| `NEXT_PUBLIC_FRONTEND_URL` | `https://ТАНЫ_ДОМАЙН.mn` |
| `NEXT_PUBLIC_MEDIA_URL` | `https://api.ТАНЫ_ДОМАЙН.mn` |
| `NODE_ENV` | `production` |

### bichilweb_backend `.env`

| Хувьсагч | Утга |
|----------|------|
| `SECRET_KEY` | Тухайн серверт зориулсан нууц түлхүүр |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `api.ТАНЫ_ДОМАЙН.mn` |
| `DB_NAME` | `bichilweb_db` |
| `DB_USER` | `bichilweb_user` |
| `DB_PASSWORD` | Нууц үг |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `CORS_ALLOW_ALL_ORIGINS` | `False` |
| `CORS_ALLOWED_ORIGINS` | `https://ТАНЫ_ДОМАЙН.mn,https://admin.ТАНЫ_ДОМАЙН.mn` |
| `CLOUDINARY_CLOUD_NAME` | (хоосон — local storage) |
| `CLOUDINARY_API_KEY` | (хоосон) |
| `CLOUDINARY_API_SECRET` | (хоосон) |

---

## Docker ашиглах бол (Нэмэлт)

Хэрвээ Docker дээр тавих гэж байвал:

```bash
# Docker + Docker Compose суулгах
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin
```

`docker-compose.yml` файл үүсгэнэ:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: bichilweb_db
      POSTGRES_USER: bichilweb_user
      POSTGRES_PASSWORD: НУУЦ_ҮГ_СОЛИНО
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./bichilweb_backend
    restart: always
    env_file: ./bichilweb_backend/.env
    volumes:
      - ./bichilweb_backend/media:/app/media
      - ./bichilweb_backend/staticfiles:/app/staticfiles
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build: ./bichilweb
    restart: always
    env_file: ./bichilweb/.env
    ports:
      - "3000:3000"
    depends_on:
      - backend

  admin:
    build: ./bichilweb_admin
    restart: always
    env_file: ./bichilweb_admin/.env
    ports:
      - "3001:3001"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./bichilweb_backend/media:/media
      - ./bichilweb_backend/staticfiles:/static
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - backend
      - frontend
      - admin

volumes:
  pgdata:
```

---

> **⚠️ `ТАНЫ_ДОМАЙН.mn`** гэсэн бүх газарт өөрийн домайн нэрийг, **`СЕРВЕРИЙН_IP`** гэсэн газарт серверийн IP хаягийг солино.
