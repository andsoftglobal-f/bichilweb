import PageBuilderInlineContent from '@/components/PageBuilderInlineContent'
import { fetchPageBySlug, type PageData } from '@/lib/pagesApi'
import { getApiBase } from '@/lib/apiBase'
import type { Locale } from '@/lib/i18n'

interface HomePageLink {
  id: number
  title: string
  page_url: string
  placement: string
  sort_order: number
  active: boolean
}

interface LinkedPage {
  link: HomePageLink
  page: PageData
}

function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object' && Array.isArray((raw as { results?: unknown[] }).results)) {
    return (raw as { results: T[] }).results
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown[] }).data)) {
    return (raw as { data: T[] }).data
  }
  return []
}

async function getLinkedPages(placement: string): Promise<LinkedPage[]> {
  try {
    const params = new URLSearchParams({ active: 'true', placement })
    const response = await fetch(`${getApiBase()}/home-page-links/?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    })

    if (!response.ok) return []

    const links = toArray<HomePageLink>(await response.json())
      .filter((item) => item.active !== false && item.page_url)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

    const resolved = await Promise.all(
      links.map(async (link) => {
        const page = await fetchPageBySlug(link.page_url).catch(() => null)
        if (!page || page.active === false) return null
        return { link, page }
      }),
    )

    return resolved.filter((item): item is LinkedPage => item !== null)
  } catch (error) {
    console.warn('Failed to load home page links:', error)
    return []
  }
}

export default async function HomePageLinks({ placement, locale }: { placement: string; locale: Locale }) {
  const items = await getLinkedPages(placement)

  if (items.length === 0) return null

  return (
    <div className="w-full overflow-hidden">
      {items.map(({ link, page }) => (
        <PageBuilderInlineContent
          key={`${placement}-${link.id}-${page.id}`}
          page={page}
          language={locale}
          className="w-full"
        />
      ))}
    </div>
  )
}
