import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import type { Locale } from '@/lib/i18n'
import StatsBarClient, { DEFAULT_CONFIG, type StatItem, type StatsConfig } from './StatsBarClient'

async function getStatsData(): Promise<{ stats: StatItem[]; config: StatsConfig }> {
  try {
    const [itemsRes, cfgRes] = await Promise.all([
      fetch(`${getApiBase()}/stat-items/`, { next: { revalidate: 60 } }),
      fetch(`${getApiBase()}/stats-config/?light=1`, { next: { revalidate: 60 } }),
    ])

    const raw = itemsRes.ok ? await itemsRes.json() : []
    const items: StatItem[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
    const stats = items.filter((s) => s.active)

    let config = DEFAULT_CONFIG
    const cfgData = cfgRes.ok ? await cfgRes.json() : null
    if (cfgData) {
      config = { ...DEFAULT_CONFIG, ...cfgData }

      if (config.image_active && !config.section_image) {
        try {
          const imageRes = await fetch(`${getApiBase()}/stats-config/image/`, { next: { revalidate: 60 } })
          const imageData = imageRes.ok ? await imageRes.json() : null
          if (imageData?.section_image) {
            config = { ...config, section_image: imageData.section_image }
          }
        } catch (err) {
          logApiWarning('Stats image', err)
        }
      }
    }

    return { stats, config }
  } catch (err) {
    logApiWarning('Stats', err)
    return { stats: [], config: DEFAULT_CONFIG }
  }
}

export default async function StatsBar({ locale }: { locale: Locale }) {
  const { stats, config } = await getStatsData()

  if (stats.length === 0) return null

  return <StatsBarClient stats={stats} config={config} language={locale} />
}
