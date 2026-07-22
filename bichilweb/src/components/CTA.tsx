import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import type { Locale } from '@/lib/i18n'
import CTAClient, { type SlideData } from './CTAClient'

function normalizeSlides(rawData: unknown): SlideData[] {
  const dataArray: SlideData[] = Array.isArray(rawData)
    ? rawData
    : rawData && typeof rawData === 'object' && Array.isArray((rawData as { results?: unknown }).results)
      ? (rawData as { results: SlideData[] }).results
      : []

  return [...dataArray].sort((a: SlideData, b: SlideData) => Number(a.index || 0) - Number(b.index || 0))
}

async function getSlides(): Promise<SlideData[]> {
  try {
    const res = await fetch(`${getApiBase()}/CTA/`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return normalizeSlides(await res.json())
  } catch (err) {
    logApiWarning('CTA slides', err)
    return []
  }
}

export default async function CTA({ locale }: { locale: Locale }) {
  const slidesData = await getSlides()

  if (slidesData.length === 0) return null

  return <CTAClient slidesData={slidesData} language={locale} />
}
