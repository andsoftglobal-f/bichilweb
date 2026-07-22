import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from '@/lib/session'

const BACKEND_API_URL = (process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/refresh — called by the client-side axios interceptor when
 * a request comes back 401. Exchanges the httpOnly refresh cookie for a new
 * access/refresh pair (SIMPLE_JWT rotates + blacklists on every refresh —
 * see bichilglobusweb/settings.py). Clears the session on failure so a
 * stale/blacklisted refresh token can't be retried forever.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  if (!refreshToken) {
    return NextResponse.json({ detail: 'Нэвтрэх шаардлагатай.' }, { status: 401 })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${BACKEND_API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ detail: 'Сервертэй холбогдоход алдаа гарлаа.' }, { status: 502 })
  }

  const data = await upstream.json().catch(() => ({}))

  if (!upstream.ok || !data.access) {
    const response = NextResponse.json({ detail: 'Сесс дууссан байна. Дахин нэвтэрнэ үү.' }, { status: 401 })
    response.cookies.delete(ACCESS_COOKIE)
    response.cookies.delete(REFRESH_COOKIE)
    return response
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ACCESS_COOKIE, data.access, cookieOptions)
  if (data.refresh) {
    response.cookies.set(REFRESH_COOKIE, data.refresh, cookieOptions)
  }
  return response
}
