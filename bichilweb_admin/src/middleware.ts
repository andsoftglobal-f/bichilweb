import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_COOKIE } from '@/lib/session';

/**
 * Replaces the old HTTP Basic Auth (hardcoded admin/password fallback) with
 * a real session gate. This is deliberately a CHEAP, edge-safe check —
 * cookie presence only, no JWT signature verification — so it never needs
 * Django's signing secret inside the Next.js runtime. It exists to give a
 * fast redirect/401 instead of flashing protected content, not to be the
 * final word on whether a token is valid.
 *
 * The actual authority is Django: every real data request goes through
 * src/lib/session.ts (djangoFetch) or src/app/api/proxy, which attaches the
 * token and lets Django's JWTAuthentication reject anything invalid or
 * expired with a real 401 — the client-side axios interceptor
 * (src/lib/axios.tsx) then refreshes once or sends the user to /login.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hasSession = request.cookies.has(ACCESS_COOKIE);

    if (hasSession) {
        return NextResponse.next();
    }

    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ detail: 'Нэвтрэх шаардлагатай.' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: [
        '/',
        '/admin/:path*',
        '/api/admin/:path*',
        '/api/proxy/:path*',
        '/api/analytics/:path*',
        '/api/call-button',
        '/api/floating-menu',
    ],
};
