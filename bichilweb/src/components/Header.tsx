'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setLocale } from '@/actions/locale'
import { LOCALE_COOKIE, isLocale, type Locale } from '@/lib/i18n'
import { fetchHeaderFromDB, readHeaderCache, type FrontendMenuItem, type FrontendHeaderStyle } from '@/lib/headerApi'
import { logApiWarning } from '@/lib/apiError'

const LEGACY_LANGUAGE_STORAGE_KEY = 'language'

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SubMenuItem {
  title_mn: string
  title_en: string
  href: string
  font?: string
}

interface MenuItem {
  title_mn: string
  title_en: string
  href?: string
  font?: string
  items?: SubMenuItem[]
  subMenus?: Record<string, SubMenuItem[]>
  tertiarySubMenus?: Record<string, SubMenuItem[]>
}

// ─── Font helper ────────────────────────────────────────────────────────────
const FONT_MAP: Record<string, { family: string; weight: number }> = {
  'Montserrat-Bold':    { family: "'Montserrat', sans-serif", weight: 700 },
  'Montserrat-Regular': { family: "'Montserrat', sans-serif", weight: 400 },
  'Montserrat-Black':   { family: "'Montserrat', sans-serif", weight: 900 },
  'OpenSans-ExtraBold': { family: "'Open Sans', sans-serif",  weight: 800 },
  'OpenSans-Regular':   { family: "'Open Sans', sans-serif",  weight: 400 },
  'Poppins-Bold':       { family: "'Poppins', sans-serif",    weight: 700 },
  'Poppins-Regular':    { family: "'Poppins', sans-serif",    weight: 400 },
}

function getFontStyle(fontValue?: string): React.CSSProperties {
  if (!fontValue) return {}
  const f = FONT_MAP[fontValue]
  if (!f) return {}
  return { fontFamily: f.family, fontWeight: f.weight }
}

function LanguageFlag({ language }: { language: string }) {
  const isMn = language === 'mn'

  return (
    <span className="inline-flex h-4 w-5 overflow-hidden rounded-[3px] border border-gray-200 shadow-sm" aria-hidden="true">
      {isMn ? (
        <svg viewBox="0 0 30 20" className="h-full w-full">
          <rect width="10" height="20" fill="#da2032" />
          <rect x="10" width="10" height="20" fill="#0066b3" />
          <rect x="20" width="10" height="20" fill="#da2032" />
          <circle cx="5" cy="5.2" r="1.7" fill="#ffd100" />
          <path d="M5 7.8v6.7M3.6 9.6h2.8M3.8 12h2.4M3.6 14.5h2.8" stroke="#ffd100" strokeWidth="1" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 30 20" className="h-full w-full">
          <rect width="30" height="20" fill="#fff" />
          {Array.from({ length: 7 }).map((_, index) => (
            <rect key={index} y={index * 3} width="30" height="1.55" fill="#b22234" />
          ))}
          <rect width="12.5" height="10.8" fill="#3c3b6e" />
          {Array.from({ length: 12 }).map((_, index) => (
            <circle
              key={index}
              cx={2 + (index % 4) * 2.6}
              cy={2 + Math.floor(index / 4) * 2.7}
              r="0.45"
              fill="#fff"
            />
          ))}
        </svg>
      )}
    </span>
  )
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function Header({ locale }: { locale: Locale }) {
  const language = locale
  const router = useRouter()
  const [, startLocaleTransition] = useTransition()

  const changeLocale = (next: Locale) => {
    startLocaleTransition(() => {
      setLocale(next).then(() => router.refresh())
    })
  }

  // One-time migration for returning visitors: the old localStorage-based
  // preference has no server-visible equivalent, so without this a visitor
  // who previously chose English would silently see Mongolian again on
  // their next visit until they re-toggle. Only runs when the `locale`
  // cookie hasn't been set yet at all.
  useEffect(() => {
    const hasLocaleCookie = document.cookie
      .split('; ')
      .some((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    if (hasLocaleCookie) return

    const legacy = window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY)
    if (isLocale(legacy) && legacy !== locale) {
      changeLocale(legacy)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [mobileOpen,              setMobileOpen]              = useState(false)
  const [activeDropdown,          setActiveDropdown]          = useState<number | null>(null)
  const [activeSubDropdown,       setActiveSubDropdown]       = useState<string | null>(null)
  const [activeQuatDropdown,      setActiveQuatDropdown]      = useState<string | null>(null)
  const [mobileActiveDropdown,    setMobileActiveDropdown]    = useState<number | null>(null)
  const [mobileActiveSubDropdown, setMobileActiveSubDropdown] = useState<string | null>(null)
  const [mobileActiveQuatDropdown, setMobileActiveQuatDropdown] = useState<string | null>(null)
  const [langOpen,                setLangOpen]                = useState(false)
  const [scrolled,                setScrolled]                = useState(false)
  const [adminHeaderMenu,         setAdminHeaderMenu]         = useState<MenuItem[]>([])
  const [adminMenuLoading,        setAdminMenuLoading]        = useState(false)
  // Ó¨Ð³Ó©Ð³Ð´Ð»Ð¸Ð¹Ð½ ÑÐ°Ð½Ð³Ð°Ð°Ñ Ð¸Ñ€ÑÑÐ½ header ÑÑ‚Ð¸Ð»ÑŒ (Ð»Ð¾Ð³Ð¾ URL-Ñ‚Ð°Ð¹)
  const [adminHeaderStyle,        setAdminHeaderStyle]        = useState<FrontendHeaderStyle | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const langRef     = useRef<HTMLDivElement>(null)

  const prefetchHref = (href?: string) => {
    if (!href || href === '#' || !href.startsWith('/')) return
    router.prefetch(href)
  }

  // â”€â”€ Ó¨Ð³Ó©Ð³Ð´Ð»Ð¸Ð¹Ð½ ÑÐ°Ð½Ð³Ð°Ð°Ñ header Ñ†ÑÑ Ñ‚Ð°Ñ‚Ð°Ñ… (Django backend) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    const loadHeaderFromDB = async () => {
      const cached = readHeaderCache()
      if (cached) {
        setAdminHeaderMenu(cached.menuItems)
        setAdminHeaderStyle(cached.style)
      }

      setAdminMenuLoading(true)
      try {
        // Django backend-Ð°Ð°Ñ header Ð¼ÑÐ´ÑÑÐ»ÑÐ» ÑˆÑƒÑƒÐ´ Ñ‚Ð°Ñ‚Ð½Ð°
        const result = await fetchHeaderFromDB()
        if (result) {
          setAdminHeaderMenu(result.menuItems)
        }
        // Ó¨Ð³Ó©Ð³Ð´Ð»Ð¸Ð¹Ð½ ÑÐ°Ð½Ð³Ð°Ð°Ñ Ð¸Ñ€ÑÑÐ½ ÑÑ‚Ð¸Ð»ÑŒ (Ð»Ð¾Ð³Ð¾ URL-Ñ‚Ð°Ð¹) Ñ…Ð°Ð´Ð³Ð°Ð»Ð°Ñ…
        if (result?.style) {
          setAdminHeaderStyle(result.style)
        }
      } catch (err) {
        logApiWarning('Header', err)
      } finally {
        setAdminMenuLoading(false)
      }
    }

    loadHeaderFromDB()
  }, [])

  useEffect(() => {
    const collectHrefs = (items: MenuItem[]) => {
      const hrefs: string[] = []

      items.forEach((item) => {
        if (item.href) hrefs.push(item.href)
        item.items?.forEach((subItem) => {
          hrefs.push(subItem.href)
        })
        Object.values(item.subMenus || {}).forEach((nestedItems) => {
          nestedItems.forEach((nestedItem) => hrefs.push(nestedItem.href))
        })
        Object.values(item.tertiarySubMenus || {}).forEach((nestedItems) => {
          nestedItems.forEach((nestedItem) => hrefs.push(nestedItem.href))
        })
      })

      return hrefs
    }

    collectHrefs(adminHeaderMenu)
      .filter((href) => href.startsWith('/products/'))
      .slice(0, 20)
      .forEach((href) => router.prefetch(href))
  }, [adminHeaderMenu, router])

  // Admin-Ð°Ð°Ñ ÑƒÐ´Ð¸Ñ€Ð´ÑÐ°Ð½ Ñ†ÑÑÐ½Ò¯Ò¯Ð´Ð¸Ð¹Ð³ Ð» Ñ…Ð°Ñ€ÑƒÑƒÐ»Ð½Ð°
  // DB-Ð´ Ñ†ÑÑ Ð±Ò¯Ñ€Ñ‚Ð³ÑÐ³Ð´ÑÑÐ³Ò¯Ð¹ Ð±Ð¾Ð» header Ñ…Ð¾Ð¾ÑÐ¾Ð½ Ð±Ð°Ð¹Ð½Ð°
  const menuItems: MenuItem[] = adminHeaderMenu
  const headerHeight = (() => {
    const parsed = Number.parseInt(adminHeaderStyle?.height || '', 10)
    const safeHeight = Number.isFinite(parsed) ? parsed : 64
    return `${Math.min(Math.max(safeHeight, 52), 64)}px`
  })()

  // â”€â”€ Scroll â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 6)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // â”€â”€ Click outside â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
        setActiveSubDropdown(null)
        setActiveQuatDropdown(null)
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <>
      <div className="pointer-events-none fixed top-4 left-1/2 z-[70] h-fit w-[calc(100%-32px)] -translate-x-1/2" style={{ maxWidth: adminHeaderStyle?.maxWidth || '1240px' }}>
        <header
          className={`pointer-events-auto w-full rounded-2xl transition-all duration-300 border ${
            scrolled
              ? 'bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-white/50'
              : 'bg-white/70 backdrop-blur-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)] border-white/40'
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between" style={{ height: headerHeight }}>

              {/* Logo + Desktop Nav */}
              <div className="flex items-center gap-6 xl:gap-8">
                <Link href="/" className="flex items-center">
                  <div className="flex items-center justify-center" style={{ width: `${adminHeaderStyle?.logoSize || 44}px`, height: `${adminHeaderStyle?.logoSize || 44}px` }}>
                    {/* Ð›Ð¾Ð³Ð¾: Ó©Ð³Ó©Ð³Ð´Ð»Ð¸Ð¹Ð½ ÑÐ°Ð½Ð³Ð°Ð°Ñ Ñ‚Ð°Ñ‚ÑÐ°Ð½ URL Ð°ÑˆÐ¸Ð³Ð»Ð°Ð½Ð°, Ð±Ð°Ð¹Ñ…Ð³Ò¯Ð¹ Ð±Ð¾Ð» Ð°Ð½Ñ…Ð´Ð°Ð³Ñ‡ Ð·ÑƒÑ€Ð°Ð³ */}
                    {adminHeaderStyle?.logoUrl && adminHeaderStyle.logoUrl !== '' ? (
                      <Image
                        src={
                          adminHeaderStyle.logoUrl.startsWith('/media')
                            ? `${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${adminHeaderStyle.logoUrl}`
                            : adminHeaderStyle.logoUrl.startsWith('blob:') || adminHeaderStyle.logoUrl.startsWith('data:')
                              ? '/browser-logo.png'
                              : adminHeaderStyle.logoUrl
                        }
                        alt="Logo"
                        width={adminHeaderStyle?.logoSize || 44}
                        height={adminHeaderStyle?.logoSize || 44}
                        className="object-cover"
                        priority
                        onError={() => console.warn('Logo image failed to load:', adminHeaderStyle.logoUrl)}
                      />
                    ) : (
                      <Image
                        src="/browser-logo.png"
                        alt="Default Logo"
                        width={adminHeaderStyle?.logoSize || 44}
                        height={adminHeaderStyle?.logoSize || 44}
                        className="object-cover"
                        priority
                      />
                    )}
                  </div>
                </Link>

                <nav className="hidden xl:flex items-center gap-1" ref={dropdownRef}>
                  {menuItems.map((item, index) => {
                    const itemSubMenus = item.subMenus || {}
                    const itemTertiarySubMenus = item.tertiarySubMenus || {}

                    return (
                      <div
                        key={index}
                        className="relative"
                        onMouseEnter={() => item.items && item.items.length > 0 && setActiveDropdown(index)}
                        onMouseLeave={() => {
                          if (!item.items) return
                          setActiveDropdown(null)
                          setActiveSubDropdown(null)
                          setActiveQuatDropdown(null)
                        }}
                      >
                        {item.items ? (
                          <>
                            <button
                              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeDropdown === index
                                  ? 'bg-gray-100 text-[#0048BA]'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-[#0048BA]'
                              } ${item.items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={item.items.length === 0}
                              style={getFontStyle(item.font)}
                            >
                              {language === 'mn' ? item.title_mn : item.title_en}
                              {item.items.length > 0 && (
                                <svg
                                  className={`w-4 h-4 transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`}
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </button>

                            {/* 2-Ñ€ Ñ‚Ò¯Ð²ÑˆÐ½Ð¸Ð¹ dropdown */}
                            {activeDropdown === index && item.items.length > 0 && (
                              <div className="absolute top-full left-0 pt-2 w-72">
                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                                  {item.items.map((subItem, subIndex) => {
                                    const key = language === 'mn' ? subItem.title_mn : subItem.title_en
                                    const hasSubMenu = !!itemSubMenus[key]

                                    return (
                                      <div
                                        key={subIndex}
                                        className="relative"
                                        onMouseEnter={() => hasSubMenu && setActiveSubDropdown(key)}
                                      >
                                        {hasSubMenu ? (
                                          <div
                                            className={`flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer ${
                                              activeSubDropdown === key ? 'bg-gray-50' : ''
                                            }`}
                                            style={getFontStyle(subItem.font)}
                                          >
                                            <span className="text-sm font-medium text-gray-900">
                                              {language === 'mn' ? subItem.title_mn : subItem.title_en}
                                            </span>
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                          </div>
                                        ) : (
                                          <Link
                                            href={subItem.href}
                                            onMouseEnter={() => prefetchHref(subItem.href)}
                                            className="block px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-900 hover:text-[#0048BA]"
                                            onClick={() => { setActiveDropdown(null); setActiveSubDropdown(null) }}
                                            style={getFontStyle(subItem.font)}
                                          >
                                            {language === 'mn' ? subItem.title_mn : subItem.title_en}
                                          </Link>
                                        )}

                                        {/* 3-Ñ€ Ñ‚Ò¯Ð²ÑˆÐ½Ð¸Ð¹ dropdown */}
                                        {activeSubDropdown === key && itemSubMenus[key] && (
                                          <div className="absolute left-full top-0 pl-2">
                                            <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 whitespace-nowrap">
                                              {itemSubMenus[key].map((nestedItem, nestedIndex) => {
                                                const nestedKey = language === 'mn' ? nestedItem.title_mn : nestedItem.title_en
                                                const hasQuatMenu = !!itemTertiarySubMenus[nestedKey]

                                                return (
                                                  <div
                                                    key={nestedIndex}
                                                    className="relative"
                                                    onMouseEnter={() => hasQuatMenu && setActiveQuatDropdown(nestedKey)}
                                                  >
                                                    {hasQuatMenu ? (
                                                      <div
                                                        className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                                                          activeQuatDropdown === nestedKey ? 'bg-gray-50' : ''
                                                        }`}
                                                        style={getFontStyle(nestedItem.font)}
                                                      >
                                                        <span className="text-sm text-gray-700">
                                                          {language === 'mn' ? nestedItem.title_mn : nestedItem.title_en}
                                                        </span>
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                      </div>
                                                    ) : (
                                                      <Link
                                                        href={nestedItem.href}
                                                        onMouseEnter={() => prefetchHref(nestedItem.href)}
                                                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#0048BA]"
                                                        style={getFontStyle(nestedItem.font)}
                                                        onClick={() => { setActiveDropdown(null); setActiveSubDropdown(null); setActiveQuatDropdown(null) }}
                                                      >
                                                        {language === 'mn' ? nestedItem.title_mn : nestedItem.title_en}
                                                      </Link>
                                                    )}

                                                    {/* 4th level fly-out */}
                                                    {activeQuatDropdown === nestedKey && itemTertiarySubMenus[nestedKey] && (
                                                      <div className="absolute left-full top-0 pl-2">
                                                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 whitespace-nowrap">
                                                          {itemTertiarySubMenus[nestedKey].map((quatItem, quatIndex) => (
                                                            <Link
                                                              key={quatIndex}
                                                              href={quatItem.href}
                                                              onMouseEnter={() => prefetchHref(quatItem.href)}
                                                              className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#0048BA]"
                                                              style={getFontStyle(quatItem.font)}
                                                              onClick={() => { setActiveDropdown(null); setActiveSubDropdown(null); setActiveQuatDropdown(null) }}
                                                            >
                                                              {language === 'mn' ? quatItem.title_mn : quatItem.title_en}
                                                            </Link>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href || '#'}
                            onMouseEnter={() => prefetchHref(item.href)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0048BA] transition-colors"
                            style={getFontStyle(item.font)}
                          >
                            {language === 'mn' ? item.title_mn : item.title_en}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </nav>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-2">

                {/* Language Selector */}
                <div className="relative" ref={langRef}>
                  <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    aria-label="Ð¥ÑÐ» ÑÐ¾Ð½Ð³Ð¾Ñ…"
                  >
                    <LanguageFlag language={language} />
                    <span className="text-sm font-medium text-gray-700">{language === 'mn' ? 'MN' : 'EN'}</span>
                    <svg className={`w-3 h-3 text-gray-500 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {langOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                      <button
                        onClick={() => { changeLocale('mn'); setLangOpen(false) }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                          language === 'mn' ? 'text-[#0048BA] bg-blue-50 hover:bg-blue-100' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <LanguageFlag language="mn" />Монгол
                      </button>
                      <button
                        onClick={() => { changeLocale('en'); setLangOpen(false) }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                          language === 'en' ? 'text-[#0048BA] bg-blue-50 hover:bg-blue-100' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <LanguageFlag language="en" />English
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="xl:hidden p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Ð¦ÑÑ"
                >
                  {mobileOpen ? (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileOpen && (
              <div className="xl:hidden py-4 border-t border-gray-100">
                <nav className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {menuItems.map((item, index) => {
                    const itemSubMenus = item.subMenus || {}
                    const itemTertiarySubMenus = item.tertiarySubMenus || {}

                    return (
                      <div key={index}>
                        {item.items && item.items.length > 0 ? (
                          <div>
                            <button
                              onClick={() => setMobileActiveDropdown(mobileActiveDropdown === index ? null : index)}
                              className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-50/80 rounded-lg"
                              style={getFontStyle(item.font)}
                            >
                              <span className="font-medium">{language === 'mn' ? item.title_mn : item.title_en}</span>
                              <svg
                                className={`w-5 h-5 transition-transform duration-200 ${mobileActiveDropdown === index ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {mobileActiveDropdown === index && (
                              <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                {item.items.map((subItem, subIndex) => {
                                  const key = language === 'mn' ? subItem.title_mn : subItem.title_en
                                  const hasSubMenu = !!itemSubMenus[key]

                                  return (
                                    <div key={subIndex}>
                                      {hasSubMenu ? (
                                        <>
                                          <button
                                            onClick={() => setMobileActiveSubDropdown(mobileActiveSubDropdown === key ? null : key)}
                                            className="flex items-center justify-between w-full px-4 py-2.5 text-gray-600 hover:bg-gray-50/80 rounded-lg"
                                            style={getFontStyle(subItem.font)}
                                          >
                                            <span className="text-sm">{language === 'mn' ? subItem.title_mn : subItem.title_en}</span>
                                            <svg
                                              className={`w-4 h-4 transition-transform duration-200 ${mobileActiveSubDropdown === key ? 'rotate-90' : ''}`}
                                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                          </button>

                                          {mobileActiveSubDropdown === key && (
                                            <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                              {itemSubMenus[key].map((nestedItem, nestedIndex) => {
                                                const nestedKey = language === 'mn' ? nestedItem.title_mn : nestedItem.title_en
                                                const hasQuatMenu = !!itemTertiarySubMenus[nestedKey]

                                                return (
                                                  <div key={nestedIndex}>
                                                    {hasQuatMenu ? (
                                                      <>
                                                        <button
                                                          onClick={() => setMobileActiveQuatDropdown(mobileActiveQuatDropdown === nestedKey ? null : nestedKey)}
                                                          className="flex items-center justify-between w-full px-4 py-2 text-gray-500 hover:bg-gray-50/80 rounded-lg"
                                                          style={getFontStyle(nestedItem.font)}
                                                        >
                                                          <span className="text-sm">{language === 'mn' ? nestedItem.title_mn : nestedItem.title_en}</span>
                                                          <svg
                                                            className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileActiveQuatDropdown === nestedKey ? 'rotate-90' : ''}`}
                                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                          >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                          </svg>
                                                        </button>

                                                        {mobileActiveQuatDropdown === nestedKey && (
                                                          <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                            {itemTertiarySubMenus[nestedKey].map((quatItem, quatIndex) => (
                                                              <Link
                                                                key={quatIndex}
                                                                href={quatItem.href}
                                                                className="block px-4 py-1.5 text-xs text-gray-400 hover:text-[#0048BA] hover:bg-gray-50/80 rounded-lg"
                                                                onClick={() => { setMobileOpen(false); setMobileActiveDropdown(null); setMobileActiveSubDropdown(null); setMobileActiveQuatDropdown(null) }}
                                                                style={getFontStyle(quatItem.font)}
                                                              >
                                                                {language === 'mn' ? quatItem.title_mn : quatItem.title_en}
                                                              </Link>
                                                            ))}
                                                          </div>
                                                        )}
                                                      </>
                                                    ) : (
                                                      <Link
                                                        href={nestedItem.href}
                                                        className="block px-4 py-2 text-sm text-gray-500 hover:text-[#0048BA] hover:bg-gray-50/80 rounded-lg"
                                                        onClick={() => { setMobileOpen(false); setMobileActiveDropdown(null); setMobileActiveSubDropdown(null); setMobileActiveQuatDropdown(null) }}
                                                        style={getFontStyle(nestedItem.font)}
                                                      >
                                                        {language === 'mn' ? nestedItem.title_mn : nestedItem.title_en}
                                                      </Link>
                                                    )}
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <Link
                                          href={subItem.href}
                                          className="block px-4 py-2.5 text-sm text-gray-600 hover:text-[#0048BA] hover:bg-gray-50/80 rounded-lg"
                                          onClick={() => { setMobileOpen(false); setMobileActiveDropdown(null) }}
                                          style={getFontStyle(subItem.font)}
                                        >
                                          {language === 'mn' ? subItem.title_mn : subItem.title_en}
                                        </Link>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={item.href || '#'}
                            className="block px-4 py-3 text-gray-700 font-medium hover:bg-gray-50/80 rounded-lg"
                            onClick={() => setMobileOpen(false)}
                            style={getFontStyle(item.font)}
                          >
                            {language === 'mn' ? item.title_mn : item.title_en}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </nav>
              </div>
            )}
          </div>
        </header>
      </div>
    </>
  )
}
