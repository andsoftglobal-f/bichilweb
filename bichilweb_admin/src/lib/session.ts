import 'server-only'

import { cookies } from 'next/headers'

/**
 * Server-only session layer for the admin panel.
 *
 * Access/refresh tokens live ONLY in httpOnly cookies, set by the route
 * handlers under src/app/api/auth/*. They are never readable from browser
 * JavaScript and never sent to the Django backend by the browser directly —
 * every authenticated call to Django goes through this server-side layer
 * (djangoFetch) or the generic proxy route (src/app/api/proxy), which is
 * exactly the BFF pattern the report calls for.
 */

export const ACCESS_COOKIE = 'admin_access'
export const REFRESH_COOKIE = 'admin_refresh'

const BACKEND_API_URL = (process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export interface CurrentUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_superuser: boolean
  groups: { id: number; name: string }[]
  permissions: string[]
  must_change_password: boolean
}

/** Reads the access token cookie. Safe to call from Server Components (read-only). */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_COOKIE)?.value ?? null
}

export async function hasSessionCookie(): Promise<boolean> {
  return (await getAccessToken()) !== null
}

/**
 * Authenticated server-side fetch to the Django API. Attaches the bearer
 * token from the httpOnly cookie; never exposes it to the caller. Does NOT
 * attempt a silent refresh — that lives in the client-side axios
 * interceptor (src/lib/axios.tsx) and /api/auth/refresh, which is the one
 * place a new cookie can actually be written back to the browser.
 */
export async function djangoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken()
  // path is always resolved against BACKEND_API_URL — never treated as a
  // caller-supplied absolute URL. An earlier version special-cased
  // path.startsWith('http') to pass such URLs straight to fetch(); combined
  // with the proxy route's URL-encoded catch-all segments, that let a
  // crafted admin-panel link redirect this authenticated fetch (bearer
  // token attached) to an arbitrary external host — SSRF plus token
  // exfiltration. There is no legitimate caller that needs an absolute URL
  // here (see every djangoFetch call site), so the escape hatch is gone.
  const url = `${BACKEND_API_URL}/${path.replace(/^\/+/, '')}`

  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type') && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, { ...init, headers, cache: 'no-store' })
}

/**
 * Resolves the current user from the access token cookie, for Server
 * Components (page-level identity, role-gated nav) and route handlers.
 * Returns null if there is no session or the token is invalid/expired —
 * callers decide whether that means "redirect to /login" or "treat as
 * anonymous", so this never throws.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getAccessToken()
  if (!token) return null

  try {
    const response = await djangoFetch('/auth/me/')
    if (!response.ok) return null
    return (await response.json()) as CurrentUser
  } catch {
    return null
  }
}

export async function requireSuperAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser()
  return user?.is_superuser ? user : null
}
