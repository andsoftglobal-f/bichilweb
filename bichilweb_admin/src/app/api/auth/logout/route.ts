import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/session'

const BACKEND_API_URL = (process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/logout — blacklists the refresh token server-side (so it
 * can't be replayed even if it leaked) and clears both session cookies.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  if (refreshToken) {
    try {
      await fetch(`${BACKEND_API_URL}/auth/token/blacklist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
        cache: 'no-store',
      })
    } catch {
      // Best-effort — the cookies are cleared regardless below, so the
      // browser session ends even if the backend call fails.
    }
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete(ACCESS_COOKIE)
  response.cookies.delete(REFRESH_COOKIE)
  return response
}
