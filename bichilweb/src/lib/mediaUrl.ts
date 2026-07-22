import { PUBLIC_MEDIA_URL } from '@/lib/publicEnv';

export function resolveMediaUrl(value?: string | null) {
  const raw = (value || '').trim();
  if (!raw) return '';

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    const absolute = raw.startsWith('//') ? `https:${raw}` : raw;
    try {
      const url = new URL(absolute);
      if (['127.0.0.1', 'localhost', '0.0.0.0'].includes(url.hostname)) {
        return `${PUBLIC_MEDIA_URL}${url.pathname}${url.search}`;
      }
    } catch {
      return absolute;
    }
    return absolute;
  }

  if (raw.startsWith('/')) {
    return `${PUBLIC_MEDIA_URL}${raw}`;
  }

  return `${PUBLIC_MEDIA_URL}/${raw}`;
}

type OptimizedMediaOptions = {
  width?: number;
  quality?: 'auto' | number;
};

const DEFAULT_IMAGE_WIDTHS = [480, 768, 1024, 1280, 1600];

function isLegacyTransformableImageUrl(url: URL) {
  return url.hostname.includes('res.cloudinary.com') && url.pathname.includes('/image/upload/');
}

function withLegacyImageTransform(src: string, options: OptimizedMediaOptions = {}) {
  try {
    const url = new URL(src);
    if (!isLegacyTransformableImageUrl(url)) return src;

    const width = Math.max(1, Math.round(options.width || 1280));
    const quality = options.quality ?? 'auto';
    const transform = `f_auto,q_${quality},c_limit,w_${width}`;
    url.pathname = url.pathname.replace('/image/upload/', `/image/upload/${transform}/`);
    return url.toString();
  } catch {
    return src;
  }
}

export function getOptimizedMediaUrl(value?: string | null, options: OptimizedMediaOptions = {}) {
  const resolved = resolveMediaUrl(value);
  if (!resolved) return '';
  return withLegacyImageTransform(resolved, options);
}

export function getResponsiveImageSrcSet(value?: string | null, widths = DEFAULT_IMAGE_WIDTHS) {
  const resolved = resolveMediaUrl(value);
  if (!resolved) return '';

  try {
    const url = new URL(resolved);
    if (!isLegacyTransformableImageUrl(url)) return '';
  } catch {
    return '';
  }

  return widths
    .map((width) => `${withLegacyImageTransform(resolved, { width })} ${width}w`)
    .join(', ');
}
