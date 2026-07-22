import { NextResponse } from 'next/server';
import { djangoFetch, getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic'

const EMPTY_UPDATES = { items: [] }

function normalizeLimit(value: string | null) {
  const parsed = Number.parseInt(value || '10', 10);
  if (!Number.isFinite(parsed)) return '10';
  return String(Math.min(Math.max(parsed, 1), 50));
}

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрэх шаардлагатай.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = normalizeLimit(searchParams.get('limit'));
    const params = new URLSearchParams({ limit });

    const res = await djangoFetch(`/analytics/recent-updates/?${params.toString()}`);

    if (!res.ok) {
      return NextResponse.json(EMPTY_UPDATES);
    }

    const data = await res.json();
    return NextResponse.json({
      items: Array.isArray(data?.items) ? data.items : [],
    });
  } catch {
    return NextResponse.json(EMPTY_UPDATES);
  }
}
