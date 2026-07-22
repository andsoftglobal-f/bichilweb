import type { Metadata } from 'next'
import { headers } from 'next/headers'

const API_BASE = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000/api/v1'
).replace(/\/$/, '')

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  'https://bichilglobus.mn'
).replace(/\/$/, '')

const MEDIA_BASE = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDIA_URL ||
  API_BASE.replace(/\/api\/v1$/, '') ||
  SITE_URL
).replace(/\/$/, '')

async function getRequestSiteUrl(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host')

  if (!host) return SITE_URL

  const forwardedProto = headerList.get('x-forwarded-proto')
  const protocol = forwardedProto || (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https')

  return `${protocol}://${host}`.replace(/\/$/, '')
}

interface NewsAPIItem {
  id: number
  slug: string
  image: string
  image_url?: string
  date?: string
  title_translations: { language: number; label: string }[]
  shortdesc_translations: { language: number; label: string }[]
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function toAbsoluteUrl(value: string, baseUrl = SITE_URL): string {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `${baseUrl}${value.startsWith('/') ? '' : '/'}${value}`
}

function resolveImageUrl(value: string): string {
  return toAbsoluteUrl(value, MEDIA_BASE)
}

function optimizeOgImage(url: string): string {
  if (!url) return url

  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/f_jpg,w_1200,h_630,c_fill,g_center,q_auto/')
  }

  return url
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const siteUrl = await getRequestSiteUrl()

  try {
    const res = await fetch(`${API_BASE}/news/?slug=${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) throw new Error('Failed to fetch news metadata')

    const json = await res.json()
    const items: NewsAPIItem[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.results)
        ? json.results
        : []
    const item = items[0]

    if (!item) {
      return {
        title: 'Мэдээ олдсонгүй',
        metadataBase: new URL(siteUrl),
      }
    }

    const titleMn = item.title_translations?.find((t) => t.language === 1)
    const titleEn = item.title_translations?.find((t) => t.language === 2)
    const excerptMn = item.shortdesc_translations?.find((t) => t.language === 1)
    const excerptEn = item.shortdesc_translations?.find((t) => t.language === 2)

    const title = stripHtml(titleMn?.label || titleEn?.label || 'BichilGlobus news')
    const description = stripHtml(excerptMn?.label || excerptEn?.label || title).slice(0, 220)
    const slug = id || item.slug || `news-${item.id}`
    const pageUrl = `${siteUrl}/news/${slug}`
    const imageUrl = optimizeOgImage(resolveImageUrl(item.image_url || item.image || ''))

    return {
      title,
      description,
      metadataBase: new URL(siteUrl),
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title,
        description,
        url: pageUrl,
        images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: title }] : [],
        type: 'article',
        siteName: 'BichilGlobus',
        locale: 'mn_MN',
        publishedTime: item.date,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch {
    return {
      title: 'BichilGlobus - Мэдээ',
      description: 'BichilGlobus мэдээ мэдээлэл',
      metadataBase: new URL(siteUrl),
    }
  }
}

export default function NewsDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
