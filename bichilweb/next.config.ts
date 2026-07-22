import type { NextConfig } from "next";

// Derives a next/image remotePatterns entry from an env-configured backend
// URL instead of a hostname: '**' wildcard, which told the image optimizer
// (which DOES make a server-side fetch on this app — unoptimized is not set
// below) it was fine to fetch from literally any host a CMS-controlled
// image field happened to contain — an SSRF vector via /_next/image.
function hostPattern(rawUrl: string | undefined) {
  if (!rawUrl) return [];
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return [];
    return [
      {
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        hostname: url.hostname,
        port: url.port || undefined,
      },
    ];
  } catch {
    return [];
  }
}

const mediaHosts = [
  ...hostPattern(process.env.NEXT_PUBLIC_MEDIA_URL),
  ...hostPattern(process.env.NEXT_PUBLIC_API_URL),
  ...hostPattern(process.env.BACKEND_URL),
];

const backendOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || '').origin;
  } catch {
    return '';
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: mediaHosts,
    // Image optimization идэвхтэй (unoptimized: true устгасан)
    formats: ['image/avif', 'image/webp'],
  },

  // Аюулгүй байдлын headers
  async headers() {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
    const frameSources = [
      "'self'",
      'https://www.youtube.com',
      'https://www.youtube-nocookie.com',
      'https://player.vimeo.com',
      'https://www.facebook.com',
      'https://web.facebook.com',
      'https://facebook.com',
      'https://www.instagram.com',
      'https://www.tiktok.com',
    ].join(' ')
    // script-src/style-src keep 'unsafe-inline' (and dev-only 'unsafe-eval')
    // because Next.js App Router hydration relies on inline scripts unless
    // a per-request nonce is wired through middleware — a larger change
    // tracked separately (see the security review's "Recommended
    // Improvements"). Everything else here is as strict as the site needs:
    // no script-src/default-src at all previously meant this CSP provided
    // no XSS defense-in-depth, only clickjacking protection.
    const scriptSrc = process.env.NODE_ENV === 'production'
      ? "'self' 'unsafe-inline'"
      : "'self' 'unsafe-inline' 'unsafe-eval'"
    const connectSrc = ["'self'", backendOrigin].filter(Boolean).join(' ')
    const imgSrc = ["'self'", 'data:', 'blob:', 'https:', ...mediaHosts.map((h) => `${h.protocol}://${h.hostname}${h.port ? ':' + h.port : ''}`)].join(' ')
    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src ${imgSrc}`,
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src ${connectSrc}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      `frame-ancestors 'self' ${adminUrl}`,
      `frame-src ${frameSources}`,
      `child-src ${frameSources}`,
    ].join('; ')
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
