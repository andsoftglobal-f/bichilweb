import type { NextConfig } from "next";

// Derives a next/image remotePatterns entry from an env-configured backend
// URL instead of the previous hostname: '**' wildcard, which told Next.js's
// image pipeline it was fine to fetch/proxy an image from literally any
// host a CMS field happened to contain. images.unoptimized is on below, so
// today this mainly matters if that ever gets turned back on — but the
// wildcard was also just wrong on its own terms: it can't be tightened by
// mistake later if nobody notices it's still there.
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
    unoptimized: true,
    // No legitimate use of SVG upload/rendering here needs the built-in
    // optimizer's SVG pass-through (images render as plain <img> tags via
    // unoptimized: true above regardless), and dangerouslyAllowSVG requires
    // pairing with a dedicated CSP + contentDispositionType to be safe per
    // Next.js's own docs — simpler and safer to just leave it off.
    dangerouslyAllowSVG: false,
  },

  // Security headers — this app was previously shipping none at all.
  // script-src/style-src keep 'unsafe-inline' (and dev-only 'unsafe-eval')
  // because Next.js's App Router hydration relies on inline scripts unless
  // you adopt a per-request nonce via middleware, which is a larger change
  // (see the security review's "Recommended Improvements"); everything
  // else here is as strict as the app actually needs.
  async headers() {
    const scriptSrc = process.env.NODE_ENV === 'production'
      ? "'self' 'unsafe-inline'"
      : "'self' 'unsafe-inline' 'unsafe-eval'";
    const connectSrc = ["'self'", backendOrigin].filter(Boolean).join(' ');
    const imgSrc = ["'self'", 'data:', 'blob:', ...mediaHosts.map((h) => `${h.protocol}://${h.hostname}${h.port ? ':' + h.port : ''}`)].join(' ');

    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src ${imgSrc}`,
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "frame-ancestors 'none'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
