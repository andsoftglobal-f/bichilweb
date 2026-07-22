import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import HeroClient, { type SliderItem } from './HeroClient'

function normalizeSliderItems(rawData: unknown): SliderItem[] {
  const dataArray: SliderItem[] = Array.isArray(rawData)
    ? rawData
    : rawData && typeof rawData === 'object' && Array.isArray((rawData as { results?: unknown }).results)
      ? (rawData as { results: SliderItem[] }).results
      : []

  return dataArray
    .filter((item: SliderItem) => Boolean(item.visible))
    .sort((a: SliderItem, b: SliderItem) => Number(a.index || 0) - Number(b.index || 0))
}

async function getSliderItems(): Promise<SliderItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/hero-slider/`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return normalizeSliderItems(await res.json())
  } catch (err) {
    logApiWarning('Hero slider', err)
    return []
  }
}

export default async function Hero() {
  const sliderItems = await getSliderItems()

  return <HeroClient sliderItems={sliderItems} />
}
