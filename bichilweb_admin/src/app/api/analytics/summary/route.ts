import { NextResponse } from 'next/server';
import { djangoFetch, getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic'

const EMPTY_SUMMARY = {
  totals: { visitors: 0, sessions: 0, pageViews: 0, bounceRate: 0 },
  daily: [],
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
    const params = new URLSearchParams();

    if (start) params.set('start', start);
    if (end) params.set('end', end);

    const res = await djangoFetch(`/analytics/summary/?${params.toString()}`);

    if (!res.ok) {
      return NextResponse.json(EMPTY_SUMMARY);
    }

    const data = await res.json();
    return NextResponse.json({
      totals: data?.totals || EMPTY_SUMMARY.totals,
      daily: Array.isArray(data?.daily) ? data.daily : [],
    });
  } catch {
    return NextResponse.json(EMPTY_SUMMARY);
  }
}
