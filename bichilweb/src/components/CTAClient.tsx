'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n'

export interface Translation {
  id: number
  language: number
  label: string
}

export interface SlideData {
  id: number
  file: string
  file_url: string
  collapsed_file: string
  collapsed_file_url: string
  mobile_expanded_file: string
  mobile_expanded_file_url: string
  index: number
  font: string
  description_font: string
  subtitle_font: string
  color: string
  number: string
  description: string
  description_position: string
  description_align: string
  url: string
  titles: Translation[]
  subtitles: Translation[]
}

const FONT_MAP: Record<string, { family: string; weight: number }> = {
  'Montserrat-Bold': { family: "'Montserrat', sans-serif", weight: 700 },
  'Montserrat-Regular': { family: "'Montserrat', sans-serif", weight: 400 },
  'Montserrat-Black': { family: "'Montserrat', sans-serif", weight: 900 },
  'OpenSans-ExtraBold': { family: "'Open Sans', sans-serif", weight: 800 },
  'OpenSans-Regular': { family: "'Open Sans', sans-serif", weight: 400 },
  'Poppins-Bold': { family: "'Poppins', sans-serif", weight: 700 },
  'Poppins-Regular': { family: "'Poppins', sans-serif", weight: 400 },
}

function getFontStyle(fontValue: string | undefined | null): React.CSSProperties {
  if (!fontValue) return {}
  const m = FONT_MAP[fontValue]
  if (!m) return { fontFamily: fontValue }
  return { fontFamily: m.family, fontWeight: m.weight }
}

export default function CTAClient({ slidesData, language }: { slidesData: SlideData[]; language: Locale }) {
  const router = useRouter()
  const [active, setActive] = useState<number>(0)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const getTranslation = useCallback((translations: Translation[]) => {
    const langId = language === 'mn' ? 2 : 1
    const translation = translations.find(t => t.language === langId)
    return translation?.label || translations[0]?.label || ''
  }, [language])

  const getSubtitles = useCallback((subtitles: Translation[]) => {
    const langId = language === 'mn' ? 2 : 1
    return subtitles.filter(sub => sub.language === langId)
  }, [language])

  const resolveImageUrl = (fileUrl: string | null | undefined, fileFallback: string | null | undefined): string => {
    const url = fileUrl || fileFallback
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) {
      const baseURL = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'
      return `${baseURL}${url}`
    }
    const baseURL = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'
    return `${baseURL}/${url}`
  }

  // Desktop expanded image (main image)
  const getExpandedImageUrl = (slide: SlideData): string => {
    return resolveImageUrl(slide.file_url, slide.file)
  }

  // Desktop collapsed image (falls back to main image with CSS filter)
  const getCollapsedImageUrl = (slide: SlideData): string => {
    if (slide.collapsed_file_url || slide.collapsed_file) {
      return resolveImageUrl(slide.collapsed_file_url, slide.collapsed_file)
    }
    // Fallback to main image
    return getExpandedImageUrl(slide)
  }

  // Mobile expanded image (falls back to main image)
  const getMobileExpandedImageUrl = (slide: SlideData): string => {
    if (slide.mobile_expanded_file_url || slide.mobile_expanded_file) {
      return resolveImageUrl(slide.mobile_expanded_file_url, slide.mobile_expanded_file)
    }
    // Fallback to main image
    return getExpandedImageUrl(slide)
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Clamps the active index back in bounds if slidesData shrinks after a
    // locale refresh — can't be derived inline since it must reset state,
    // not just the rendered value, so later clicks/keys start from a valid index.
    if (slidesData.length > 0 && active >= slidesData.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(0)
    }
  }, [active, slidesData.length])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setActive(prev => (prev - 1 + slidesData.length) % slidesData.length)
      if (e.key === 'ArrowRight') setActive(prev => (prev + 1) % slidesData.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [slidesData.length])

  const handleDesktopHover = (i: number) => {
    if (!isMobile) {
      setActive(i)
    }
  }

  const handleDesktopLeave = () => {
    // Do nothing — keep the last hovered/clicked slide active
  }

  const navigateWithinSite = useCallback((rawUrl: string) => {
    if (!rawUrl) return
    try {
      const resolved = new URL(rawUrl, window.location.origin)
      const path = `${resolved.pathname}${resolved.search}${resolved.hash}`
      router.push(path || '/')
    } catch {
      const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`
      router.push(path)
    }
  }, [router])

  const isSlideActive = (i: number) => {
    return active === i
  }

  return (
    <section className="w-full py-6 md:py-10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">

        {/* === DESKTOP ACCORDION === */}
        {!isMobile && (
          <div className="flex gap-3 lg:gap-4 h-[70vh] lg:h-[75vh]" ref={containerRef}>
            {slidesData.map((s, i) => {
              const title = getTranslation(s.titles)
              const subtitles = getSubtitles(s.subtitles)
              const expandedImageUrl = getExpandedImageUrl(s)
              const collapsedImageUrl = getCollapsedImageUrl(s)
              const isActive = isSlideActive(i)

              return (
                <div
                  key={s.id}
                  className="group relative overflow-hidden rounded-2xl cursor-pointer"
                  style={{
                    flex: isActive ? 3.5 : 1,
                    transition: 'flex 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: 0,
                  }}
                  onMouseEnter={() => handleDesktopHover(i)}
                  onMouseLeave={handleDesktopLeave}
                  onClick={() => {
                    setActive(i)
                  }}
                  role="listitem"
                  aria-expanded={isActive}
                >
                  {/* Expanded background image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-[1.2s] ease-out"
                    style={{
                      backgroundImage: expandedImageUrl
                        ? `url('${expandedImageUrl}')`
                        : 'linear-gradient(135deg, #0f766e, #1e3a5f)',
                      transform: isActive ? 'scale(1.05)' : 'scale(1.15)',
                      opacity: isActive ? 1 : 0,
                    }}
                  />

                  {/* Collapsed background image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-[1.2s] ease-out"
                    style={{
                      backgroundImage: collapsedImageUrl
                        ? `url('${collapsedImageUrl}')`
                        : 'linear-gradient(135deg, #0f766e, #1e3a5f)',
                      transform: isActive ? 'scale(1.15)' : 'scale(1.15)',
                      filter: 'grayscale(0.5) brightness(0.7)',
                      opacity: isActive ? 0 : 1,
                    }}
                  />

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      background: isActive
                        ? 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 40%, transparent 50%, rgba(0,0,0,0.85) 100%)'
                        : 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.7) 100%)',
                    }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6 lg:p-8 z-10">
                    {/* Top-left: Title */}
                    <div className="relative">
                      <h3
                        className="font-bold leading-tight"
                        style={{
                          ...getFontStyle(s.font),
                          color: s.color && s.color !== '#' ? s.color : '#fff',
                          fontSize: isActive ? '1.5rem' : '0.95rem',
                          opacity: isActive ? 1 : 0,
                          transform: isActive ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
                          transition: isActive
                            ? 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s, font-size 0.5s ease'
                            : 'opacity 0.25s ease, transform 0.25s ease, font-size 0.5s ease',
                        }}
                      >
                        {title}
                      </h3>
                      {/* Collapsed title - separate element for smooth crossfade */}
                      {!isActive && (
                        <h3
                          className="font-bold leading-tight absolute"
                          style={{
                            ...getFontStyle(s.font),
                            color: s.color && s.color !== '#' ? s.color : '#fff',
                            fontSize: '0.95rem',
                            opacity: isActive ? 0 : 0.85,
                            transform: isActive ? 'translateY(8px)' : 'translateY(0)',
                            transition: 'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
                            top: s.number && s.number !== '0' ? '46px' : '0',
                          }}
                        >
                          {title}
                        </h3>
                      )}
                    </div>

                    {/* Bottom: Subtitles + Description (only when active) */}
                    <div>
                      <div
                        className="overflow-hidden"
                        style={{
                          maxHeight: isActive ? '400px' : '0px',
                          opacity: isActive ? 1 : 0,
                          transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                          transition: isActive
                            ? 'max-height 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s'
                            : 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, transform 0.3s ease',
                        }}
                      >
                        {(() => {
                          const descBlock = s.description ? (
                            <p
                              className="text-[14px] text-white/80 leading-[1.7] mb-4 tracking-wide"
                              style={{
                                ...getFontStyle(s.description_font),
                                textAlign: (s.description_align || 'left') as React.CSSProperties['textAlign'],
                                opacity: isActive ? 1 : 0,
                                transform: isActive ? 'translateY(0)' : 'translateY(10px)',
                                transition: isActive
                                  ? 'opacity 0.5s ease 0.25s, transform 0.5s ease 0.25s'
                                  : 'opacity 0.2s ease, transform 0.2s ease',
                              }}
                            >
                              {s.description}
                            </p>
                          ) : null

                          const subsBlock = subtitles.length > 0 ? (
                            <ul className="space-y-2 mb-4">
                              {subtitles.map((sub, idx) => (
                                <li
                                  key={sub.id}
                                  className="flex items-start gap-2.5 text-sm text-white/85 leading-relaxed"
                                  style={{
                                    opacity: isActive ? 1 : 0,
                                    transform: isActive ? 'translateX(0)' : 'translateX(-12px)',
                                    transition: isActive
                                      ? `opacity 0.4s ease ${0.3 + idx * 0.1}s, transform 0.4s ease ${0.3 + idx * 0.1}s`
                                      : 'opacity 0.2s ease, transform 0.2s ease',
                                  }}
                                >
                                  <span className="mt-0.5 w-5 h-5 rounded-full bg-[#0048BA]/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-[#0048BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                  <span style={getFontStyle(s.subtitle_font)}>{sub.label}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null

                          return s.description_position === 'bottom'
                            ? <>{subsBlock}{descBlock}</>
                            : <>{descBlock}{subsBlock}</>
                        })()}

                        {/* URL indicator */}
                        {s.url && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateWithinSite(s.url)
                            }}
                            className="mt-4 inline-flex items-center rounded-md bg-[#0048BA] text-white text-xs font-semibold px-3 py-1.5 shadow-md active:scale-95 transition-transform"
                            style={{
                              opacity: isActive ? 1 : 0,
                              transform: isActive ? 'translateY(0)' : 'translateY(8px)',
                              transition: isActive
                                ? 'opacity 0.4s ease 0.45s, transform 0.4s ease 0.45s'
                                : 'opacity 0.2s ease, transform 0.2s ease',
                            }}
                          >
                            Дэлгэрэнгүй
                          </button>
                        )}
                      </div>


                    </div>
                  </div>


                </div>
              )
            })}
          </div>
        )}

        {/* === MOBILE: VERTICAL ACCORDION (tap to expand down) === */}
        {isMobile && (
          <div className="flex flex-col gap-2">
            {slidesData.map((s, i) => {
              const title = getTranslation(s.titles)
              const subtitles = getSubtitles(s.subtitles)
              const mobileExpandedImage = getMobileExpandedImageUrl(s)
              const isOpen = active === i

              return (
                <div
                  key={s.id}
                  className="relative overflow-hidden rounded-xl cursor-pointer"
                  style={{
                    height: isOpen ? '55vh' : '48px',
                    transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onClick={() => {
                    setActive(i)
                  }}
                >
                  {/* Mobile expanded: background image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                    style={{
                      backgroundImage: isOpen && mobileExpandedImage
                        ? `url('${mobileExpandedImage}')`
                        : 'none',
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? 'scale(1.02)' : 'scale(1.1)',
                    }}
                  />

                  {/* Mobile collapsed: gray glass/translucent effect (no image) */}
                  <div
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      background: isOpen
                        ? 'transparent'
                        : 'linear-gradient(135deg, rgba(120,120,130,0.45) 0%, rgba(160,160,170,0.35) 50%, rgba(120,120,130,0.45) 100%)',
                      backdropFilter: isOpen ? 'none' : 'blur(12px)',
                      WebkitBackdropFilter: isOpen ? 'none' : 'blur(12px)',
                      opacity: isOpen ? 0 : 1,
                    }}
                  />

                  {/* Gradient overlay (only when expanded) */}
                  <div
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      background: isOpen
                        ? 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 40%, transparent 50%, rgba(0,0,0,0.85) 100%)'
                        : 'none',
                      opacity: isOpen ? 1 : 0,
                    }}
                  />

                  {/* Collapsed: Horizontal title bar */}
                  {!isOpen && (
                    <div className="absolute inset-0 flex items-center px-4 z-10">
                      <h3
                        className="text-sm font-bold truncate"
                        style={{
                          ...getFontStyle(s.font),
                          color: s.color && s.color !== '#' ? s.color : '#334155',
                        }}
                      >
                        {title}
                      </h3>
                      <svg className="w-4 h-4 text-slate-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}

                  {/* Expanded: Full content */}
                  {isOpen && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
                      {/* Top: Title */}
                      <div>
                        <h3
                          className="text-base font-bold leading-tight"
                          style={{
                            ...getFontStyle(s.font),
                            color: s.color && s.color !== '#' ? s.color : '#fff',
                          }}
                        >
                          {title}
                        </h3>
                      </div>

                      {/* Bottom: Description + Subtitles */}
                      <div>
                        {(() => {
                          const descBlock = s.description ? (
                            <p className="text-xs text-white/70 leading-relaxed mb-2" style={{ ...getFontStyle(s.description_font), textAlign: (s.description_align || 'left') as React.CSSProperties['textAlign'] }}>
                              {s.description}
                            </p>
                          ) : null

                          const subsBlock = subtitles.length > 0 ? (
                            <ul className="space-y-1">
                              {subtitles.map((sub, idx) => (
                                <li
                                  key={sub.id}
                                  className="flex items-start gap-1.5 text-xs text-white/85 leading-relaxed"
                                  style={{
                                    transition: `opacity 0.3s ease ${idx * 0.06}s, transform 0.3s ease ${idx * 0.06}s`,
                                    opacity: 1,
                                    transform: 'translateX(0)',
                                  }}
                                >
                                  <span className="mt-0.5 w-4 h-4 rounded-full bg-[#0048BA]/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-2.5 h-2.5 text-[#0048BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                  <span style={getFontStyle(s.subtitle_font)}>{sub.label}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null

                          return s.description_position === 'bottom'
                            ? <>{subsBlock}{descBlock}</>
                            : <>{descBlock}{subsBlock}</>
                        })()}
                        {s.url && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateWithinSite(s.url)
                            }}
                            className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#0048BA] text-white text-xs font-semibold px-3 py-1.5 shadow-md active:scale-95 transition-transform"
                          >
                            <span>Дэлгэрэнгүй</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </section>
  )
}
