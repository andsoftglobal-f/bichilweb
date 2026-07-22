# Render Deploy Guide - Cloudinary Storage

Энэ заавар нь Bichil Globus сайтыг Render дээр deploy хийхэд зориулав. Storage-г SFTP биш Cloudinary дээр хэвээр ашиглана.

## 1. Render дээр үүсгэх service-үүд

Энэ project monorepo бүтэцтэй тул Render дээр 3 тусдаа Web Service үүсгэнэ.

| Service | Root Directory | Runtime | Үүрэг |
|---|---|---|---|
| `bichil-backend` | `bichilweb_backend` | Python | Django REST API |
| `bichil-web` | `bichilweb` | Node | Хэрэглэгчийн сайт |
| `bichil-admin` | `bichilweb_admin` | Node | Админ CMS |

Next.js app-ууд API route/proxy ашигладаг тул Static Site биш `Web Service` гэж үүсгэнэ.

## 2. Deploy дараалал

1. Cloudinary account дээр cloud name, API key, API secret бэлдэнэ.
2. PostgreSQL database бэлдэнэ. Render PostgreSQL ашиглаж болно, эсвэл гадны PostgreSQL ашиглах бол Render server-ээс public/reachable байх ёстой.
3. Render дээр `bichil-backend` service үүсгэнэ.
4. Backend live URL гарсны дараа `bichil-web`, `bichil-admin` service үүсгэнэ.
5. Public/Admin URL гарсны дараа backend-ийн `CORS_ALLOWED_ORIGINS`, `ALLOWED_HOSTS`-ыг update хийнэ.
6. 3 service-ээ redeploy хийнэ.

## 3. Backend Service

Render Dashboard дээр:

| Field | Value |
|---|---|
| Service Type | `Web Service` |
| Root Directory | `bichilweb_backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt && python manage.py collectstatic --noinput` |
| Pre-Deploy Command | `python manage.py migrate` |
| Start Command | `gunicorn bichilglobusweb.wsgi:application --bind 0.0.0.0:$PORT` |

Хэрвээ Render dashboard дээр `Pre-Deploy Command` талбар харагдахгүй бол Build Command-оо ингэж тавьж болно:

```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
```

## 4. Backend Environment Variables

Render service -> `Environment` -> `Add Environment Variable`.

Доорхыг backend service дээр оруулна.

```env
PYTHON_VERSION=3.13.4
SECRET_KEY=<Render дээр Generate хийж болно>
DEBUG=False

ALLOWED_HOSTS=.onrender.com,<your-domain.mn>
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://bichil-web.onrender.com,https://bichil-admin.onrender.com,https://<your-domain.mn>

DB_NAME=<database name>
DB_USER=<database user>
DB_PASSWORD=<database password>
DB_HOST=<database host>
DB_PORT=5432
DB_SSL=True
DB_SCHEMA=public
DB_CONN_MAX_AGE=300

USE_SFTP_STORAGE=False
SFTP_STORAGE_HOST=
SFTP_STORAGE_ROOT=
SFTP_STORAGE_USER=
SFTP_STORAGE_PASS=

CLOUDINARY_CLOUD_NAME=<cloudinary cloud name>
CLOUDINARY_API_KEY=<cloudinary api key>
CLOUDINARY_API_SECRET=<cloudinary api secret>

SECURE_SSL=True
```

Important:

- Энэ project дээр Cloudinary идэвхжих нөхцөл нь `CLOUDINARY_API_KEY` байгаа, мөн `USE_SFTP_STORAGE=False` байх.
- `SFTP_STORAGE_HOST`-ыг хоосон орхино. Учир нь code дээр host байвал SFTP mode автоматаар асах боломжтой.
- Render PostgreSQL ашиглавал Render DB dashboard-аас host/name/user/password/port утгыг copy хийж `DB_*` талбарууд дээр оруулна.
- Render PostgreSQL шинэ database дээр ихэвчлэн зөвхөн `public` schema байдаг тул `DB_SCHEMA=public` гэж тавина.
- Хэрэв одоогийн гадны DB-г ашиглавал Render service-ээс тэр DB рүү network/firewall нээлттэй байх ёстой.

Хэрэв `no schema has been selected to create in` гэж алдаа гарвал:

1. Backend env дээр `DB_SCHEMA=public` байгаа эсэхийг шалгана.
2. Code дээр `settings.py` дотор DB `OPTIONS` нь env `DB_SCHEMA` ашиглаж байгаа commit Render дээр push/deploy болсон эсэхийг шалгана.
3. Дараа нь backend service дээр `Manual Deploy -> Clear build cache & deploy` хийж дахин deploy хийнэ.

## 5. Public Frontend Service

Render Dashboard дээр:

| Field | Value |
|---|---|
| Service Type | `Web Service` |
| Root Directory | `bichilweb` |
| Runtime | `Node` |
| Build Command | `npm install && npm run build` |
| Start Command | `npx next start -p $PORT` |

Public frontend env:

```env
NODE_VERSION=22
NEXT_PUBLIC_API_URL=https://bichil-backend.onrender.com/api/v1
NEXT_PUBLIC_MEDIA_URL=https://bichil-backend.onrender.com
BACKEND_API_URL=https://bichil-backend.onrender.com/api/v1
BACKEND_URL=https://bichil-backend.onrender.com
```

`bichil-backend.onrender.com` гэдгийг өөрийн backend Render URL-аар солино.

## 6. Admin Frontend Service

Render Dashboard дээр:

| Field | Value |
|---|---|
| Service Type | `Web Service` |
| Root Directory | `bichilweb_admin` |
| Runtime | `Node` |
| Build Command | `npm install && npm run build` |
| Start Command | `npx next start -p $PORT` |

Admin env:

```env
NODE_VERSION=22
NEXT_PUBLIC_API_URL=https://bichil-backend.onrender.com/api/v1
NEXT_PUBLIC_MEDIA_URL=https://bichil-backend.onrender.com
BACKEND_API_URL=https://bichil-backend.onrender.com/api/v1
BACKEND_URL=https://bichil-backend.onrender.com
```

## 7. Backend CORS/Allowed Hosts-г сүүлд нь update хийх

Frontend/admin URL гарсны дараа backend env дээр:

```env
ALLOWED_HOSTS=.onrender.com,<custom-domain.mn>
CORS_ALLOWED_ORIGINS=https://bichil-web.onrender.com,https://bichil-admin.onrender.com,https://custom-domain.mn
```

Дараа нь backend service дээр `Manual Deploy -> Deploy latest commit` хийнэ.

## 8. Cloudinary ажиллаж байгаа эсэхийг шалгах

1. Admin site руу орно.
2. Зураг upload хийдэг хэсгээс test image upload хийнэ.
3. Response URL нь `https://res.cloudinary.com/...` хэлбэртэй байвал Cloudinary руу хадгалж байна.
4. Public site дээр зураг харагдаж байгаа эсэхийг шалгана.

Хэрэв `/media/...` URL буцаагаад байвал:

- `USE_SFTP_STORAGE=False` эсэх
- `SFTP_STORAGE_HOST` хоосон эсэх
- `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME` зөв эсэх
- Backend service redeploy хийсэн эсэх

## 9. Render дээр хамгийн их гардаг алдаа

| Алдаа | Шалтгаан | Засах |
|---|---|---|
| `DisallowedHost` | `ALLOWED_HOSTS` дээр Render URL байхгүй | `.onrender.com` эсвэл тухайн hostname нэмэх |
| CORS error | `CORS_ALLOWED_ORIGINS` дээр frontend/admin URL байхгүй | Public/Admin Render URL нэмэх |
| Next app deploy болсон ч нээгдэхгүй | Start command hardcoded port ашигласан | `npx next start -p $PORT` ашиглах |
| Upload 500 | Cloudinary env буруу эсвэл SFTP санамсаргүй асаалттай | `USE_SFTP_STORAGE=False`, Cloudinary key шалгах |
| DB connection failed | DB host private/restricted | Render PostgreSQL ашиглах эсвэл DB firewall нээх |
| Static files missing | `collectstatic` гүйгээгүй | Build command дээр `python manage.py collectstatic --noinput` байх |

## 10. Товч deploy checklist

- [ ] Backend service root: `bichilweb_backend`
- [ ] Backend start: `gunicorn bichilglobusweb.wsgi:application --bind 0.0.0.0:$PORT`
- [ ] Backend `DEBUG=False`
- [ ] Backend DB env зөв
- [ ] `USE_SFTP_STORAGE=False`
- [ ] Cloudinary env зөв
- [ ] Public service root: `bichilweb`
- [ ] Public start: `npx next start -p $PORT`
- [ ] Admin service root: `bichilweb_admin`
- [ ] Admin start: `npx next start -p $PORT`
- [ ] Public/Admin env дээр backend URL зөв
- [ ] Backend CORS дээр public/admin URL зөв
- [ ] Upload test Cloudinary URL буцааж байгаа
