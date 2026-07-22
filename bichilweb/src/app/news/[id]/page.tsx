import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import { getLocale } from '@/lib/serverLocale'
import NewsDetailClient, { normalizeVideoOrientation, type NewsItem } from './NewsDetailClient'

interface ApiTranslation {
  id?: number
  language: number
  label: string
  font: string
  family: string
  weight: string
  size: string
}

interface ApiImage {
  id: number
  image: string
}

interface ApiSocial {
  id: number
  social: string
  icon: string
}

interface ApiNewsItem {
  id: number
  category: number
  image: string
  image_url?: string
  video: string
  video_orientation?: string
  facebook_url?: string
  feature: boolean
  render: boolean
  readtime: number
  slug: string
  date: string
  images?: ApiImage[]
  socials?: ApiSocial[]
  title_translations: ApiTranslation[]
  shortdesc_translations?: ApiTranslation[]
  content_translations?: ApiTranslation[]
}

interface CategoryTranslation {
  id: number
  language: number
  label: string
}

interface CategoryAPI {
  id: number
  translations: CategoryTranslation[]
}

const getTranslation = (translations: ApiTranslation[] | undefined, language: number): ApiTranslation | undefined => {
  return translations?.find(t => t.language === language)
}

const getCategoryTranslation = (translations: CategoryTranslation[], language: number, defaultCategory: string): string => {
  const translation = translations.find(t => t.language === language)
  return translation?.label || defaultCategory
}

async function getCategories(): Promise<CategoryAPI[]> {
  try {
    const res = await fetch(`${getApiBase()}/news-category/`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const raw = await res.json()
    return Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
  } catch (err) {
    logApiWarning('News detail categories', err)
    return []
  }
}

async function getAllNews(): Promise<ApiNewsItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/news/?summary=1`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const raw = await res.json()
    const items: ApiNewsItem[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
    return items.filter(item => item.render)
  } catch (err) {
    logApiWarning('News detail list', err)
    return []
  }
}

async function getNewsBySlug(slug: string): Promise<ApiNewsItem | null> {
  try {
    const res = await fetch(`${getApiBase()}/news/?slug=${encodeURIComponent(slug)}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const raw = await res.json()
    const items: ApiNewsItem[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
    return items[0] || null
  } catch (err) {
    logApiWarning('News detail', err)
    return null
  }
}

function mapToNewsItem(item: ApiNewsItem, languageId: number, defaultCategory: string, noTitle: string, categories: CategoryAPI[], full: boolean): NewsItem {
  const titleTr = getTranslation(item.title_translations, languageId)
  const category = categories.find(c => c.id === item.category)
  const categoryLabel = category ? getCategoryTranslation(category.translations, languageId, defaultCategory) : defaultCategory
  const imageUrl = item.image_url || item.image || '/placeholder-news.jpg'

  if (!full) {
    return {
      id: item.id,
      title: titleTr?.label || noTitle,
      titleFontFamily: titleTr?.family || '',
      slug: item.slug || `news-${item.id}`,
      excerpt: '',
      excerptFontFamily: '',
      content: '',
      contentFontFamily: '',
      bannerImage: imageUrl,
      category: item.category,
      categoryLabel,
      publishedAt: item.date,
      readTime: item.readtime || 5,
      isPinnedNews: item.feature || false,
      images: [],
      socials: [],
      video: item.video || '',
      videoOrientation: normalizeVideoOrientation(item.video_orientation),
      facebookUrl: item.facebook_url || '',
    }
  }

  const excerpt = getTranslation(item.shortdesc_translations, languageId)
  const content = getTranslation(item.content_translations, languageId)

  return {
    id: item.id,
    title: titleTr?.label || noTitle,
    titleFontFamily: titleTr?.family || '',
    slug: item.slug || `news-${item.id}`,
    excerpt: excerpt?.label || '',
    excerptFontFamily: excerpt?.family || '',
    content: content?.label || '',
    contentFontFamily: content?.family || '',
    bannerImage: imageUrl,
    category: item.category,
    categoryLabel,
    publishedAt: item.date,
    readTime: item.readtime || 5,
    isPinnedNews: item.feature || false,
    images: item.images?.map(img => img.image) || [],
    socials: item.socials?.map(s => ({ social: s.social, icon: s.icon })) || [],
    video: item.video || '',
    videoOrientation: normalizeVideoOrientation(item.video_orientation),
    facebookUrl: item.facebook_url || '',
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: newsSlug } = await params
  const [locale, categories, allNews, detailNews] = await Promise.all([
    getLocale(),
    getCategories(),
    getAllNews(),
    getNewsBySlug(newsSlug),
  ])

  const isEn = locale === 'en'
  const languageId = isEn ? 2 : 1
  const defaultCategory = isEn ? 'News' : 'Мэдээ'
  const noTitle = isEn ? 'Untitled' : 'Гарчиггүй'

  const foundNews = detailNews || allNews.find((item) => (item.slug || `news-${item.id}`) === newsSlug) || null
  const news = foundNews ? mapToNewsItem(foundNews, languageId, defaultCategory, noTitle, categories, true) : null
  // A fetch failure is distinguished from a genuine 404: both categories and
  // allNews empty (their endpoints never responded) but a slug was requested.
  const error = !news && categories.length === 0 && allNews.length === 0

  // Related news (same category, excluding current)
  const relatedNews: NewsItem[] = news
    ? allNews
        .filter(item => (item.slug || `news-${item.id}`) !== newsSlug && item.category === news.category)
        .slice(0, 3)
        .map(item => mapToNewsItem(item, languageId, defaultCategory, noTitle, categories, false))
    : []

  // Next news (by date)
  let nextNews: NewsItem | null = null
  if (allNews.length > 0) {
    const sortedByDate = [...allNews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const currentIndex = sortedByDate.findIndex(item => item.slug === newsSlug)
    if (currentIndex >= 0 && currentIndex < sortedByDate.length - 1) {
      nextNews = mapToNewsItem(sortedByDate[currentIndex + 1], languageId, defaultCategory, noTitle, categories, false)
    }
  }

  return (
    <NewsDetailClient
      news={news}
      relatedNews={relatedNews}
      nextNews={nextNews}
      locale={locale}
      error={error}
    />
  )
}
