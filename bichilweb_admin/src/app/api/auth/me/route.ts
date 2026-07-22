import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/me — lets client components (Sidebar, AuthContext) learn
 * who is signed in without ever touching the access token themselves; this
 * route reads the httpOnly cookie server-side and returns only the profile.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ detail: 'Нэвтрээгүй байна.' }, { status: 401 })
  }
  return NextResponse.json(user)
}
