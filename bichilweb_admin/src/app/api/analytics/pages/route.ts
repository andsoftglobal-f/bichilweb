import { NextResponse } from 'next/server';
import { djangoFetch, getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic'

const EMPTY_PAGES = { total_views: 0, pages: [] }

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
    const start = searchParams.get('start') || '';
    const end = searchParams.get('end') || '';
    const limit = normalizeLimit(searchParams.get('limit'));
    const params = new URLSearchParams({ limit });

    if (start) params.set('start', start);
    if (end) params.set('end', end);

    const res = await djangoFetch(`/analytics/pages/?${params.toString()}`);

    if (!res.ok) {
      return NextResponse.json(EMPTY_PAGES);
    }

    const data = await res.json();
    return NextResponse.json({
      total_views: Number(data?.total_views) || 0,
      pages: Array.isArray(data?.pages) ? data.pages : [],
    });
  } catch {
    return NextResponse.json(EMPTY_PAGES);
  }
}
