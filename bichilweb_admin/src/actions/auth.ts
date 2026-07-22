/**
 * Auth actions — the browser-callable counterparts to src/lib/session.ts
 * (which is server-only). These call the same-origin /api/auth/* route
 * handlers, never Django directly, so the access/refresh tokens never pass
 * through client-side code.
 */

import { axiosInstance } from '@/lib/axios'
import { isAxiosError } from 'axios'
import type { CurrentUser } from '@/types/auth'

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch('/api/auth/me')
  if (!res.ok) return null
  return (await res.json()) as CurrentUser
}

export async function login(username: string, password: string): Promise<{ user: CurrentUser } | { error: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { error: data?.detail || 'Нэвтрэх нэр эсвэл нууц үг буруу байна.' }
  }
  return { user: data.user as CurrentUser }
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}

export async function changeOwnPassword(oldPassword: string, newPassword: string): Promise<void> {
  try {
    await axiosInstance.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    })
  } catch (err) {
    const data = isAxiosError(err) ? err.response?.data : undefined
    const message =
      (typeof data?.new_password?.[0] === 'string' && data.new_password[0]) ||
      (typeof data?.old_password?.[0] === 'string' && data.old_password[0]) ||
      data?.detail ||
      'Нууц үг солиход алдаа гарлаа.'
    throw new Error(message)
  }
}
