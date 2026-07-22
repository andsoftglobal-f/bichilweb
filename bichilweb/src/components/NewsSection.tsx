import Image from 'next/image'
import Link from 'next/link'
import { getFontStyle } from '@/lib/fontUtils'
import { getHomeNews as fetchHomeNewsData, getNewsCategories as fetchNewsCategoriesData } from '@/actions/news'
import { getApiBase } from '@/lib/apiBase'
import type { Locale } from '@/lib/i18n'
import type {
  ApiNewsItem,
  NewsCategoryAPI as CategoryAPI,
  NewsTranslation as ApiTranslation,
  NewsCategoryTranslation as CategoryTranslation,
} from '@/types/news'

interface NewsItem {
  id: number
  title: string
  titleFontFamily: string
  slug: string
  bannerImage: string
  category: number
  publishedAt: string
  readTime: number
  isPinnedNews: boolean
  showOnHome: boolean
}

interface Category {
  id: number
  label: string
}

interface NewsStyles {
  homeHeading: string
  homeHeadingEn: string
  sectionLabelColor: string
  sectionLabelSize: string
  headingColor: string
  headingSize: string
  headingFontFamily: string
  dividerColor: string
  dividerWidth: string
  dividerHeight: string
  dividerMarginTop: string
  dividerMarginBottom: string
  buttonColor: string
  buttonText: string
  buttonTextEn: string
  buttonTextColor: string
  buttonSize: string
  buttonFontFamily: string
}

const defaultStyles: NewsStyles = {
  homeHeading: 'Мэдээ',
  homeHeadingEn: 'News',
  sectionLabelColor: '#0d9488',
  sectionLabelSize: '14px',
  headingColor: '#111827',
  headingSize: '48px',
  headingFontFamily: '',
  dividerColor: '#0048BA',
  dividerWidth: '64px',
  dividerHeight: '4px',
  dividerMarginTop: '12px',
  dividerMarginBottom: '80px',
  buttonColor: '#0048BA',
  buttonText: 'Дэлгэрэнгүй',
  buttonTextEn: 'View All',
  buttonTextColor: '#ffffff',
  buttonSize: '16px',
  buttonFontFamily: '',
}

const stripHtml = (html: string): string => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const getTranslation = (translations: ApiTranslation[] = [], language: number): ApiTranslation | undefined => {
  return translations.find(t => t.language === language) || translations[0]
}

const getCategoryTranslation = (
  translations: CategoryTranslation[] = [],
  language: number,
): CategoryTranslation | undefined => {
  return translations.find(t => t.language === language) || translations[0]
}

function mapAPICategoryToCategory(apiCategory: CategoryAPI, languageId: number): Category {
  const translation = getCategoryTranslation(apiCategory.translations, languageId)
  return {
    id: apiCategory.id,
    label: stripHtml(translation?.label || ''),
  }
}

function mapApiNewsToFrontend(item: ApiNewsItem, languageId: number): NewsItem {
  const titleTranslation = getTranslation(item.title_translations, languageId)
  const title = stripHtml(titleTranslation?.label || '')
  const imageUrl = item.image_url || item.image || '/placeholder-news.jpg'

  return {
    id: item.id,
    title,
    titleFontFamily: titleTranslation?.family || '',
    slug: item.slug || `news-${item.id}`,
    bannerImage: imageUrl,
    category: item.category,
    publishedAt: item.date,
    readTime: item.readtime || 5,
    isPinnedNews: item.feature || false,
    showOnHome: item.show_on_home || false,
  }
}

function getHomeNews(items: ApiNewsItem[], languageId: number): NewsItem[] {
  return items
    .filter(item => item.render && item.show_on_home)
    .map(item => mapApiNewsToFrontend(item, languageId))
    .filter(item => item.title)
}

async function getNewsPageSettings(): Promise<NewsStyles> {
  try {
    const res = await fetch(`${getApiBase()}/news-page-settings/`, { next: { revalidate: 60 } })
    if (!res.ok) return defaultStyles
    const data = await res.json()
    if (!data) return defaultStyles
    return {
      homeHeading: data.home_heading || defaultStyles.homeHeading,
      homeHeadingEn: data.home_heading_en || defaultStyles.homeHeadingEn,
      sectionLabelColor: data.section_label_color || defaultStyles.sectionLabelColor,
      sectionLabelSize: data.section_label_size || defaultStyles.sectionLabelSize,
      headingColor: data.heading_color || defaultStyles.headingColor,
      headingSize: data.heading_size || defaultStyles.headingSize,
      headingFontFamily: data.heading_font_family || defaultStyles.headingFontFamily,
      dividerColor: data.divider_color || defaultStyles.dividerColor,
      dividerWidth: data.divider_width || defaultStyles.dividerWidth,
      dividerHeight: data.divider_height || defaultStyles.dividerHeight,
      dividerMarginTop: data.divider_margin_top || defaultStyles.dividerMarginTop,
      dividerMarginBottom: data.divider_margin_bottom || defaultStyles.dividerMarginBottom,
      buttonColor: data.button_color || defaultStyles.buttonColor,
      buttonText: data.button_text || defaultStyles.buttonText,
      buttonTextEn: data.button_text_en || defaultStyles.buttonTextEn,
      buttonTextColor: data.button_text_color || defaultStyles.buttonTextColor,
      buttonSize: data.button_size || defaultStyles.buttonSize,
      buttonFontFamily: data.button_font_family || defaultStyles.buttonFontFamily,
    }
  } catch {
    return defaultStyles
  }
}

export default async function NewsSection({ locale }: { locale: Locale }) {
  const [rawNews, rawCategories, styles] = await Promise.all([
    fetchHomeNewsData(),
    fetchNewsCategoriesData(),
    getNewsPageSettings(),
  ])

  const languageId = locale === 'mn' ? 1 : 2
  const news = getHomeNews(rawNews, languageId)
  const categories = rawCategories.map(cat => mapAPICategoryToCategory(cat, languageId))

  const trans = {
    sectionLabel: locale === 'mn' ? 'Онцлох мэдээ' : 'Featured News',
    readTime: locale === 'mn' ? 'минут унших' : 'min read',
    newsLabel: locale === 'mn' ? 'Мэдээ' : 'News',
    latestNews: locale === 'mn' ? 'Сүүлийн мэдээнүүд' : 'Latest News',
    empty: locale === 'mn'
      ? 'Мэдээ түр ачаалж чадсангүй. Түр хүлээгээд дахин шинэчлээрэй.'
      : 'News could not be loaded right now. Please refresh again shortly.',
  }

  const sectionTitle = locale === 'mn'
    ? (stripHtml(styles.homeHeading) || 'Мэдээ')
    : (stripHtml(styles.homeHeadingEn) || stripHtml(styles.homeHeading) || 'News')
  const viewAllLabel = locale === 'mn'
    ? (stripHtml(styles.buttonText) || 'Дэлгэрэнгүй')
    : (stripHtml(styles.buttonTextEn) || stripHtml(styles.buttonText) || 'View All')

  const sortedNews = [...news].sort((a, b) => {
    if (a.isPinnedNews === b.isPinnedNews) {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    }
    return a.isPinnedNews ? -1 : 1
  })

  const pinnedNews = sortedNews.filter(item => item.isPinnedNews).slice(0, 3)
  const gridItems = sortedNews.filter(item => !item.isPinnedNews)

  const getCategoryLabel = (categoryId: number): string => {
    return categories.find(c => c.id === categoryId)?.label || trans.newsLabel
  }

  return (
    <section className="py-10 sm:py-14 lg:py-20 px-5 sm:px-20 flex flex-col">
      <div className="flex flex-col lg:max-w-[1280px] lg:mx-auto w-full">
        {/* Header */}
        <div className="text-center" style={{ marginBottom: styles.dividerMarginBottom }}>
          <div className="inline-block">
            <h2
              className="font-bold"
              style={{
                color: styles.headingColor,
                fontSize: styles.headingSize,
                ...getFontStyle(styles.headingFontFamily),
              }}
            >
              {sectionTitle}
            </h2>
            <div
              className="mx-auto rounded-full"
              style={{
                width: styles.dividerWidth,
                height: styles.dividerHeight,
                marginTop: styles.dividerMarginTop,
                backgroundColor: styles.dividerColor,
              }}
            />
          </div>
        </div>

        {sortedNews.length > 0 && (
          <>
            {pinnedNews.length > 0 && (
              <div className="mb-10 sm:mb-16 bg-gray-50 rounded-2xl p-6 sm:p-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#0048BA]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  {trans.sectionLabel}
                </h3>
                <div className="grid grid-cols-1 gap-5">
                  {pinnedNews.map(item => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] lg:flex-row hover:shadow-lg transition-all border border-gray-200"
                    >
                      <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-none lg:rounded-l-[28px] overflow-hidden h-[200px] sm:h-[300px] lg:h-auto lg:w-2/3 bg-gray-200">
                        <Image
                          src={item.bannerImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex flex-col justify-between flex-1 p-5 lg:p-8 lg:w-1/3">
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <span className="inline-block w-fit px-2.5 py-1 bg-[#E6F0FF] text-[#0048BA] text-xs font-semibold rounded-full">
                            {getCategoryLabel(item.category)}
                          </span>
                          <p
                            className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis sm:text-2xl sm:leading-10 lg:text-2xl lg:leading-10 lg:max-h-[250px]"
                            style={getFontStyle(item.titleFontFamily)}
                          >
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          {new Date(item.publishedAt).toLocaleDateString(locale === 'mn' ? 'mn-MN' : 'en-US')} • {item.readTime} {trans.readTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {gridItems.length > 0 && (
              <div className="mb-10">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{trans.latestNews}</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {gridItems.map(item => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] hover:shadow-lg transition-all border border-gray-200 hover:translate-y-[-2px]"
                    >
                      <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-[28px] overflow-hidden h-[200px] sm:h-[250px] bg-gray-200">
                        <Image
                          src={item.bannerImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex flex-col justify-between flex-1 p-5 lg:p-8">
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <span className="inline-block w-fit px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                            {getCategoryLabel(item.category)}
                          </span>
                          <p
                            className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis lg:text-2xl lg:leading-10 transition-all"
                            style={getFontStyle(item.titleFontFamily)}
                          >
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          {new Date(item.publishedAt).toLocaleDateString(locale === 'mn' ? 'mn-MN' : 'en-US')} • {item.readTime} {trans.readTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center mt-8">
              <Link
                href="/news"
                className="group inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 font-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  backgroundColor: styles.buttonColor,
                  color: styles.buttonTextColor,
                  fontSize: styles.buttonSize,
                  ...getFontStyle(styles.buttonFontFamily),
                }}
              >
                {viewAllLabel}
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </>
        )}

        {sortedNews.length === 0 && (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-5 py-8 text-center text-sm text-slate-600">
            {trans.empty}
          </div>
        )}
      </div>
    </section>
  )
}
