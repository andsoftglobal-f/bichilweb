import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const RAW_BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  'http://127.0.0.1:8000/api/v1'

const BACKEND_URL = RAW_BACKEND_URL.replace(/\/+$/, '').endsWith('/api/v1')
  ? RAW_BACKEND_URL.replace(/\/+$/, '')
  : `${RAW_BACKEND_URL.replace(/\/+$/, '')}/api/v1`

const EMPTY_HEADER = { id: null, logo: '', active: 1, menus: [], styles: [] }

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/headers/`, {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return NextResponse.json(
        { ...EMPTY_HEADER, _error: `Backend ${response.status}: ${text.slice(0, 300)}` },
        { status: 200 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ...EMPTY_HEADER, _error: message }, { status: 200 })
  }
}
