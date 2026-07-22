import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import type { Locale } from '@/lib/i18n'
import ProductTutorialsClient, { DEFAULT_CONFIG, type Tutorial, type TutorialConfig } from './ProductTutorialsClient'

function normalizeTutorials(raw: unknown): Tutorial[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { results?: unknown }).results)
      ? (raw as { results: unknown[] }).results
      : []

  return list.flatMap(item => {
    if (!item || typeof item !== 'object') return []

    const tutorial = item as Partial<Tutorial>
    const id = typeof tutorial.id === 'number' ? tutorial.id : Number(tutorial.id)
    const videoUrl = typeof tutorial.video_url === 'string' ? tutorial.video_url.trim() : ''

    if (!Number.isFinite(id) || !videoUrl) return []

    return [{
      id,
      title_mn: typeof tutorial.title_mn === 'string' ? tutorial.title_mn : '',
      title_en: typeof tutorial.title_en === 'string' ? tutorial.title_en : '',
      video_url: videoUrl,
      thumbnail_url: typeof tutorial.thumbnail_url === 'string' && tutorial.thumbnail_url.trim()
        ? tutorial.thumbnail_url
        : null,
    }]
  })
}

async function getTutorials(): Promise<Tutorial[]> {
  try {
    const res = await fetch(`${getApiBase()}/product-tutorials/`, { next: { revalidate: 60 } })
    return res.ok ? normalizeTutorials(await res.json()) : []
  } catch (err) {
    logApiWarning('ProductTutorials.items', err)
    return []
  }
}

async function getTutorialConfig(): Promise<TutorialConfig> {
  try {
    const res = await fetch(`${getApiBase()}/product-tutorial-config/`, { next: { revalidate: 60 } })
    const data = res.ok ? await res.json() : null
    return data ? { ...DEFAULT_CONFIG, ...data } : DEFAULT_CONFIG
  } catch (err) {
    logApiWarning('ProductTutorials.config', err)
    return DEFAULT_CONFIG
  }
}

export default async function ProductTutorials({ locale }: { locale: Locale }) {
  const [items, config] = await Promise.all([getTutorials(), getTutorialConfig()])

  return <ProductTutorialsClient items={items} config={config} language={locale} />
}
