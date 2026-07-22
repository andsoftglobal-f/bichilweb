import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from '@/lib/session'

const BACKEND_API_URL = (process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login — the only place the browser ever sends a password.
 * Exchanges it for a JWT pair against Django, then stores both tokens as
 * httpOnly cookies. The tokens themselves are never returned to the client.
 */
export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Хүсэлтийн формат буруу байна.' }, { status: 400 })
  }

  const { username, password } = body
  if (!username || !password) {
    return NextResponse.json({ detail: 'Нэвтрэх нэр болон нууц үг шаардлагатай.' }, { status: 400 })
  }

  // Forward the real client IP through to Django's login throttle (see
  // 'login' scope + NUM_PROXIES in bichilglobusweb/settings.py) — without
  // this every login attempt through this BFF looks like it came from this
  // server, collapsing the whole site's brute-force protection into one
  // shared bucket.
  const forwardedFor = request.headers.get('x-forwarded-for')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (forwardedFor) headers['X-Forwarded-For'] = forwardedFor

  let upstream: Response
  try {
    upstream = await fetch(`${BACKEND_API_URL}/auth/token/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ detail: 'Сервертэй холбогдоход алдаа гарлаа.' }, { status: 502 })
  }

  const data = await upstream.json().catch(() => ({}))

  if (!upstream.ok) {
    return NextResponse.json(
      { detail: data?.detail || 'Нэвтрэх нэр эсвэл нууц үг буруу байна.' },
      { status: upstream.status === 401 ? 401 : upstream.status },
    )
  }

  const { access, refresh, user } = data
  if (!access || !refresh) {
    return NextResponse.json({ detail: 'Серверийн хариу дутуу байна.' }, { status: 502 })
  }

  const response = NextResponse.json({ user })
  response.cookies.set(ACCESS_COOKIE, access, cookieOptions)
  response.cookies.set(REFRESH_COOKIE, refresh, cookieOptions)
  return response
}
