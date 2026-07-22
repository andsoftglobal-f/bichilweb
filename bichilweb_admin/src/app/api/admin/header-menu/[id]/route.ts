// ============================================================================
// HEADER ЦЭСНИЙ [id] API - Django backend руу proxy
// ============================================================================
// Тодорхой header-ийг ID-гаар нь татах, шинэчлэх, устгах
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { djangoFetch, getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const res = await djangoFetch(`/headers/${id}/`, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 })
    }
    return NextResponse.json(await res.json())
  } catch (error) {
    console.error('Header татахад алдаа:', error)
    return NextResponse.json({ error: 'Серверийн алдаа' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрэх шаардлагатай.' }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await request.json()
    const res = await djangoFetch(`/headers/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo: body.logo || '', active: body.active ?? 1 }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Шинэчлэхэд алдаа' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (error) {
    console.error('Header шинэчлэхэд алдаа:', error)
    return NextResponse.json({ error: 'Серверийн алдаа' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрэх шаардлагатай.' }, { status: 401 })
  }

  const { id } = await params
  try {
    const res = await djangoFetch(`/headers/${id}/`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      return NextResponse.json({ error: 'Устгахад алдаа' }, { status: res.status })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Header устгахад алдаа:', error)
    return NextResponse.json({ error: 'Серверийн алдаа' }, { status: 500 })
  }
}
