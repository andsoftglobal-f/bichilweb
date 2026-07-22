// ============================================================================
// CALL BUTTON API - Django backend руу proxy (УНШИХ + ХАДГАЛАХ)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { djangoFetch, getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Дуудалгийн товчны тохиргоо авах
export async function GET() {
  try {
    const res = await djangoFetch('/call-button/', {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) {
      return NextResponse.json({
        id: null,
        url: '',
        svg: '',
        button_color: '#ef4444',
        icon_color: '#ffffff',
        arrow_color: '#9ca3af',
        active: true,
      })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Call button татахад алдаа:', error)
    return NextResponse.json({
      id: null,
      url: '',
      svg: '',
      button_color: '#ef4444',
      icon_color: '#ffffff',
      arrow_color: '#9ca3af',
      active: true,
    })
  }
}

// PUT - Дуудалгийн товчны тохиргоо хадгалах
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Нэвтрэх шаардлагатай.' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // If there's an existing ID, update via PUT; otherwise create via POST
    let res
    if (body.id) {
      res = await djangoFetch(`/call-button/${body.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      })
    } else {
      res = await djangoFetch('/call-button/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      })
    }

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Call button хадгалахад алдаа:', errorText)
      return NextResponse.json({ success: false, error: errorText }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('Call button хадгалахад алдаа:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
