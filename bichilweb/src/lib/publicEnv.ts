const LOCAL_API_URL = 'http://127.0.0.1:8000/api/v1';
const RENDER_API_URL = 'https://bichilweb-backend.onrender.com/api/v1';

export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? RENDER_API_URL : LOCAL_API_URL);

export const PUBLIC_MEDIA_URL = (
  process.env.NEXT_PUBLIC_MEDIA_URL || PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')
).replace(/\/$/, '');
