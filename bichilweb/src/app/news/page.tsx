import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import { getLocale } from '@/lib/serverLocale'
import NewsPageClient, { type ApiNewsItem, type CategoryAPI, type NewsPageSettings } from './NewsPageClient'

async function getNews(): Promise<{ items: ApiNewsItem[]; error: boolean }> {
  try {
    const res = await fetch(`${getApiBase()}/news/?summary=1`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error('Failed to fetch news')
    const raw = await res.json()
    const items: ApiNewsItem[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
    return { items, error: false }
  } catch (err) {
    logApiWarning('News list', err)
    return { items: [], error: true }
  }
}

async function getCategories(): Promise<{ items: CategoryAPI[]; error: boolean }> {
  try {
    const res = await fetch(`${getApiBase()}/news-category/`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error('Failed to fetch categories')
    const raw = await res.json()
    const items: CategoryAPI[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
    return { items, error: false }
  } catch (err) {
    logApiWarning('News categories', err)
    return { items: [], error: true }
  }
}

async function getPageSettings(): Promise<NewsPageSettings> {
  const defaults: NewsPageSettings = {
    latestHeading: 'Сүүлийн мэдээнүүд',
    featuredHeading: 'Онцлох мэдээ',
    latestHeadingEn: '',
    featuredHeadingEn: '',
  }
  try {
    const res = await fetch(`${getApiBase()}/news-page-settings/`, { next: { revalidate: 60 } })
    if (!res.ok) return defaults
    const data = await res.json()
    if (!data) return defaults
    return {
      latestHeading: data.latest_heading || defaults.latestHeading,
      featuredHeading: data.featured_heading || defaults.featuredHeading,
      latestHeadingEn: data.latest_heading_en || '',
      featuredHeadingEn: data.featured_heading_en || '',
    }
  } catch (err) {
    logApiWarning('News page settings', err)
    return defaults
  }
}

export default async function NewsPage() {
  const [locale, news, categories, pageSettings] = await Promise.all([
    getLocale(),
    getNews(),
    getCategories(),
    getPageSettings(),
  ])

  return (
    <NewsPageClient
      locale={locale}
      rawNews={news.items}
      rawCategories={categories.items}
      pageSettings={pageSettings}
      newsError={news.error}
      categoriesError={categories.error}
    />
  )
}
