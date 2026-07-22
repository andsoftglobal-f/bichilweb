'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getFontStyle } from '@/lib/fontUtils'
import { t as translate, type Locale } from '@/lib/i18n'

/* ─── Scroll Reveal Hook ─── */
function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-revealed')
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.6, rootMargin: '0px 0px 0px 0px' }
    )
    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observerRef.current?.observe(el)
    })
  }, [])

  useEffect(() => {
    setupObserver()
    return () => observerRef.current?.disconnect()
  }, [setupObserver])

  return { refresh: setupObserver }
}

export interface ApiTranslation {
  id?: number
  language: number
  label: string
  font: string
  family: string
  weight: string
  size: string
}

export interface ApiImage {
  id: number
  image: string
}

export interface ApiSocial {
  id: number
  social: string
  icon: string
}

export interface ApiNewsItem {
  id: number
  category: number
  image: string
  image_url?: string
  video: string
  feature: boolean
  render: boolean
  readtime: number
  slug: string
  date: string
  images: ApiImage[]
  socials: ApiSocial[]
  title_translations: ApiTranslation[]
  shortdesc_translations: ApiTranslation[]
  content_translations: ApiTranslation[]
}

export interface CategoryTranslation {
  id: number
  language: number
  label: string
}

export interface CategoryAPI {
  id: number
  translations: CategoryTranslation[]
}

interface NewsItem {
  id: number
  title: string
  titleFontFamily: string
  slug: string
  excerpt: string
  bannerImage: string
  category: number
  publishedAt: string
  readTime: number
  isPinnedNews: boolean
}

interface Category {
  id: number
  label: string
}

export interface NewsPageSettings {
  latestHeading: string
  featuredHeading: string
  latestHeadingEn: string
  featuredHeadingEn: string
}

const getTranslation = (translations: ApiTranslation[], languageId: number): ApiTranslation | undefined => {
  return translations.find(t => t.language === languageId)
}

const getCategoryTranslation = (translations: CategoryTranslation[], languageId: number): CategoryTranslation | undefined => {
  return translations.find(t => t.language === languageId)
}

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

const mapAPICategoryToCategory = (apiCategory: CategoryAPI, languageId: number): Category => {
  const translation = getCategoryTranslation(apiCategory.translations, languageId)

  return {
    id: apiCategory.id,
    label: translation?.label || '',
  }
}

const mapApiNewsToFrontend = (item: ApiNewsItem, languageId: number): NewsItem => {
  const titleTranslation = getTranslation(item.title_translations, languageId)
  const excerptTranslation = getTranslation(item.shortdesc_translations, languageId)

  const imageUrl = item.image_url || item.image || '/placeholder-news.jpg'

  return {
    id: item.id,
    title: stripHtml(titleTranslation?.label || 'Гарчиггүй'),
    titleFontFamily: titleTranslation?.family || '',
    slug: item.slug || `news-${item.id}`,
    excerpt: stripHtml(excerptTranslation?.label || ''),
    bannerImage: imageUrl,
    category: item.category,
    publishedAt: item.date,
    readTime: item.readtime || 5,
    isPinnedNews: item.feature || false,
  }
}

export default function NewsPage(props: {
  locale: Locale
  rawNews: ApiNewsItem[]
  rawCategories: CategoryAPI[]
  pageSettings: NewsPageSettings
  newsError: boolean
  categoriesError: boolean
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <NewsPageContent {...props} />
    </Suspense>
  )
}

function NewsPageContent({ locale, rawNews, rawCategories, pageSettings, newsError, categoriesError }: {
  locale: Locale
  rawNews: ApiNewsItem[]
  rawCategories: CategoryAPI[]
  pageSettings: NewsPageSettings
  newsError: boolean
  categoriesError: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const language = locale
  const isEn = language === 'en'
  const languageId = language === 'mn' ? 1 : 2
  const t = (mn: string, en: string) => translate(locale, mn, en)

  const [activeCategory, setActiveCategory] = useState(0)
  const [sortOrder, setSortOrder] = useState("newest")
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [stickyBarShadow, setStickyBarShadow] = useState(false)
  const { refresh: refreshReveal } = useScrollReveal()

  // Translations
  const trans = {
    newsTitle: t('Мэдээ', 'News'),
    all: t('Бүгд', 'All'),
    sort: t('Эрэмбэ', 'Sort'),
    newest: t('Шинэ', 'Newest'),
    oldest: t('Хуучин', 'Oldest'),
    sortBy: t('Эрэмбэлэх', 'Sort by'),
    categoryInfo: t('ангилалд', 'in category'),
    newsCount: t('мэдээ байна', 'news found'),
    featured: t('Онцлох мэдээ', 'Featured News'),
    latestNews: t('Сүүлийн мэдээнүүд', 'Latest News'),
    noNews: t('Мэдээ олдсонгүй', 'No news found'),
    noNewsDesc: t('Энэ төрлийн мэдээ одоогоор байхгүй байна.', 'No news available in this category.'),
    backToAll: t('Бүх ангилалд буцах', 'Back to all categories'),
    readTime: t('минут унших', 'min read'),
    errorLoading: t('Мэдээ ачаалахад алдаа гарлаа', 'Failed to load news'),
    errorCategories: t('Ангилал ачаалахад алдаа гарлаа', 'Failed to load categories'),
    tryAgain: t('Дахин оролдох', 'Try again'),
  }

  const news = rawNews.filter(item => item.render).map(item => mapApiNewsToFrontend(item, languageId))
  const categories: Category[] = [
    { id: 0, label: trans.all },
    ...rawCategories.map(cat => mapAPICategoryToCategory(cat, languageId)),
  ]

  useEffect(() => {
    const savedPosition = sessionStorage.getItem("newsScrollPosition")
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition))
      sessionStorage.removeItem("newsScrollPosition")
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setStickyBarShadow(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sortDiv = document.getElementById("sort-dropdown-container")
      if (sortDiv && !sortDiv.contains(e.target as Node)) {
        setSortDropdownOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSortDropdownOpen(false)
      }
    }

    if (sortDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [sortDropdownOpen])

  useEffect(() => {
    // Mirrors the ?category= URL param into local state so back/forward
    // navigation and direct links land on the right tab — handleCategoryChange
    // below also sets this directly as a UX optimization that doesn't wait
    // for the router transition to complete.
    const categoryParam = searchParams.get("category")
    if (categoryParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCategory(parseInt(categoryParam))
    } else {
      setActiveCategory(0)
    }
  }, [searchParams])

  // Re-observe elements when filter/sort changes or data arrives
  useEffect(() => {
    setTimeout(() => refreshReveal(), 50)
  }, [activeCategory, sortOrder, news.length, refreshReveal])

  // Category солихдээ URL-г шинэчлэх
  const handleCategoryChange = (categoryId: number) => {
    sessionStorage.removeItem("newsScrollPosition")
    setActiveCategory(categoryId)
    if (categoryId === 0) {
      router.push("/news")
    } else {
      router.push(`/news?category=${categoryId}`)
    }
  }

  // Sort and filter news
  const sortedNews = [...news].sort((a, b) => {
    if (a.isPinnedNews === b.isPinnedNews) {
      if (sortOrder === "a-z") {
        return a.title.localeCompare(b.title, language)
      } else if (sortOrder === "z-a") {
        return b.title.localeCompare(a.title, language)
      } else {
        const timeA = new Date(a.publishedAt).getTime()
        const timeB = new Date(b.publishedAt).getTime()
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB
      }
    }
    return a.isPinnedNews ? -1 : 1
  })

  const filteredNews = sortedNews.filter((item) => {
    if (activeCategory === 0) return true
    return item.category === activeCategory
  })

  // Pinned news (max 3)
  const pinnedNews = filteredNews.filter((item) => item.isPinnedNews).slice(0, 3)
  // Regular news
  const gridItems = filteredNews.filter((item) => !item.isPinnedNews)

  const error = newsError ? trans.errorLoading : categoriesError ? trans.errorCategories : null

  return (
    <main className="min-h-screen bg-white">
      <div className="flex flex-col px-5 sm:px-20 lg:max-w-[1280px] lg:mx-auto">

        {/* Header */}
        <div className="pt-8 sm:pt-12 mb-6 sm:mb-9 lg:mb-16">
          <p className="text-gray-900 font-bold text-center text-2xl sm:text-3xl">
            {trans.newsTitle}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {trans.tryAgain}
            </button>
          </div>
        )}

        {/* Category Tabs and Sort */}
        <div className="flex flex-col gap-4 mb-10 sm:mb-16">
          {/* Category Tabs and Sort Controls - Sticky */}
          <div className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md -mx-5 sm:-mx-20 px-5 sm:px-20 transition-all duration-300 ${stickyBarShadow ? 'shadow-lg shadow-black/5' : ''}`}>
            <div className="lg:max-w-[1280px] lg:mx-auto py-3">
              <div className="flex gap-4 items-center justify-between">
                {/* Category Tabs - pill/chip style */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex gap-2 items-center overflow-x-auto scrollbar-hide py-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {categories.map((cat) => {
                      const count = cat.id === 0
                        ? news.length
                        : news.filter(n => n.category === cat.id).length
                      const isActive = activeCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryChange(cat.id)}
                          aria-pressed={isActive}
                          className={`relative px-4 py-2 text-[13px] font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 focus:outline-none rounded-full border ${
                            isActive
                              ? "bg-[#0048BA] text-white border-[#0048BA] shadow-md shadow-[#0048BA]/25"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#0048BA]/30 hover:text-[#0048BA] hover:bg-[#E6F0FF]/50"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {cat.label}
                            <span className={`text-[11px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full font-semibold transition-all duration-300 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {count}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="relative flex-shrink-0" id="sort-dropdown-container">
                  <button
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    aria-label={`${trans.sortBy}: ${sortOrder === "newest" ? trans.newest : sortOrder === "oldest" ? trans.oldest : sortOrder === "a-z" ? "A–Z" : "Z–A"}`}
                    aria-expanded={sortDropdownOpen}
                    aria-haspopup="menu"
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:border-[#0048BA]/30 hover:text-[#0048BA] hover:bg-[#E6F0FF]/50 transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0048BA]/20"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span className="hidden sm:inline">
                      {trans.sort}: <span className="font-semibold">
                        {sortOrder === "newest" ? trans.newest : sortOrder === "oldest" ? trans.oldest : sortOrder === "a-z" ? "A–Z" : "Z–A"}
                      </span>
                    </span>
                    <span className="sm:hidden text-xs font-semibold">
                      {sortOrder === "newest" ? trans.newest : sortOrder === "oldest" ? trans.oldest : sortOrder === "a-z" ? "A–Z" : "Z–A"}
                    </span>
                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {sortDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10" role="menu">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{trans.sortBy}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSortOrder("newest")
                          setSortDropdownOpen(false)
                        }}
                        role="menuitem"
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 flex items-center gap-2 focus:outline-none focus:bg-[#E6F0FF] ${
                          sortOrder === "newest"
                            ? "bg-[#E6F0FF] text-[#0048BA] font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {sortOrder === "newest" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        {trans.newest}
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("oldest")
                          setSortDropdownOpen(false)
                        }}
                        role="menuitem"
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 flex items-center gap-2 focus:outline-none focus:bg-[#E6F0FF] ${
                          sortOrder === "oldest"
                            ? "bg-[#E6F0FF] text-[#0048BA] font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {sortOrder === "oldest" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        {trans.oldest}
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("a-z")
                          setSortDropdownOpen(false)
                        }}
                        role="menuitem"
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 flex items-center gap-2 focus:outline-none focus:bg-[#E6F0FF] ${
                          sortOrder === "a-z"
                            ? "bg-[#E6F0FF] text-[#0048BA] font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {sortOrder === "a-z" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        A–Z
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("z-a")
                          setSortDropdownOpen(false)
                        }}
                        role="menuitem"
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 flex items-center gap-2 focus:outline-none focus:bg-[#E6F0FF] ${
                          sortOrder === "z-a"
                            ? "bg-[#E6F0FF] text-[#0048BA] font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {sortOrder === "z-a" && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        Z–A
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Reveal CSS */}
        <style jsx global>{`
          .scroll-reveal {
            opacity: 0;
            transform: translateY(40px);
            transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .scroll-reveal.from-left {
            transform: translateX(-60px) translateY(20px);
          }
          .scroll-reveal.from-right {
            transform: translateX(60px) translateY(20px);
          }
          .scroll-reveal.from-bottom {
            transform: translateY(50px);
          }
          .scroll-reveal.scroll-revealed {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        `}</style>

        {/* News Grid */}
        <div className="pb-16">
          {/* Contextual Info */}
          {filteredNews.length > 0 && (
            <div className="mb-8 text-xs text-gray-500 tracking-wide uppercase">
              <p>
                <span className="font-semibold text-gray-600">{categories.find(c => c.id === activeCategory)?.label}</span> {trans.categoryInfo} <span className="font-semibold text-gray-600">{filteredNews.length}</span> {trans.newsCount}
              </p>
            </div>
          )}

          {/* Featured/Pinned News Section */}
          {pinnedNews.length > 0 && (
            <div className="mb-10 sm:mb-16 bg-gray-50 rounded-2xl p-6 sm:p-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#0048BA]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                {(isEn && pageSettings.featuredHeadingEn) ? pageSettings.featuredHeadingEn : pageSettings.featuredHeading}
              </h2>
              <div className="grid grid-cols-1 gap-5">
                {/* All pinned news - Large cards */}
                {pinnedNews.map((item, idx) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className={`scroll-reveal from-left group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] lg:flex-row hover:shadow-lg transition-all border border-gray-200`}
                    style={{ transitionDelay: `${idx * 120}ms` }}
                  >
                    <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-none lg:rounded-l-[28px] overflow-hidden h-[200px] sm:h-[300px] lg:h-auto lg:w-2/3 bg-gray-200">
                      <Image
                        src={item.bannerImage}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-news.jpg'
                        }}
                      />
                    </div>

                    <div className="flex flex-col justify-between flex-1 p-5 lg:p-8 lg:w-1/3">
                      <div className="flex flex-col gap-2 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2.5 py-1 bg-[#E6F0FF] text-[#0048BA] text-xs font-semibold rounded-full">
                            {categories.find(c => c.id === item.category)?.label || trans.newsTitle}
                          </span>
                        </div>
                        <p className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis sm:text-2xl sm:leading-10 lg:text-2xl lg:leading-10 lg:max-h-[250px]" style={getFontStyle(item.titleFontFamily)}>
                          {item.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-4">
                        {new Date(item.publishedAt).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US')} • {item.readTime} {trans.readTime}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Regular News Section */}
          {gridItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{(isEn && pageSettings.latestHeadingEn) ? pageSettings.latestHeadingEn : pageSettings.latestHeading}</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {gridItems.map((item, idx) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className={`scroll-reveal ${idx % 2 === 0 ? 'from-left' : 'from-right'} group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] hover:shadow-lg transition-all border border-gray-200 hover:translate-y-[-2px]`}
                    style={{ transitionDelay: `${(idx % 4) * 100}ms` }}
                  >
                    <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-[28px] overflow-hidden h-[200px] sm:h-[250px] bg-gray-200">
                      <Image
                        src={item.bannerImage}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-news.jpg'
                        }}
                      />
                    </div>

                    <div className="flex flex-col justify-between flex-1 p-5 lg:p-8">
                      <div className="flex flex-col gap-2 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                            {categories.find(c => c.id === item.category)?.label || trans.newsTitle}
                          </span>
                        </div>
                        <p className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis lg:text-2xl lg:leading-10 transition-all" style={getFontStyle(item.titleFontFamily)}>
                          {item.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-4">
                        {new Date(item.publishedAt).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US')} • {item.readTime} {trans.readTime}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {filteredNews.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{trans.noNews}</h3>
              <p className="text-gray-500 mb-6">{trans.noNewsDesc}</p>
              <div className="flex flex-col gap-2 items-center justify-center">
                {activeCategory !== 0 && (
                  <button
                    onClick={() => handleCategoryChange(0)}
                    className="px-4 py-2 text-sm text-[#0048BA] font-medium hover:text-[#0048BA] transition-all duration-300"
                  >
                    ← {trans.backToAll}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
