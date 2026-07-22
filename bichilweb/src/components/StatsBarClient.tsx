'use client'

import { useEffect, useState, useRef } from 'react'
import { getFontStyle } from '@/lib/fontUtils'
import Image from 'next/image'
import type { Locale } from '@/lib/i18n'

/* ── types ── */
export interface StatItem {
  id: number
  label_mn: string
  label_en: string
  value: string
  prefix: string
  suffix: string
  suffix_color: string
  icon: string | null
  active: boolean
}

export interface StatsConfig {
  title_mn: string
  title_en: string
  description_mn: string
  description_en: string
  section_image: string | null
  value_color: string
  value_font_size: string
  label_color: string
  label_font_size: string
  suffix_color: string
  title_color: string
  title_font_size: string
  description_color: string
  description_font_size: string
  mobile_title_font_size: string
  mobile_description_font_size: string
  mobile_value_font_size: string
  mobile_label_font_size: string
  fontfamily: string
  text_active: boolean
  image_active: boolean
}

export const DEFAULT_CONFIG: StatsConfig = {
  title_mn: 'Бидний тоон үзүүлэлтүүд',
  title_en: 'Our key metrics',
  description_mn: 'Глобус санхүүгийн байгууллагын бодит тоон үзүүлэлтүүд, манай үйл ажиллагааны хэмжүүр.',
  description_en: 'Real performance metrics from Globus Financial, measuring our operational impact.',
  section_image: null,
  value_color: '#1e293b',
  value_font_size: '2.6rem',
  label_color: '#94a3b8',
  label_font_size: '0.875rem',
  suffix_color: '#0048BA',
  title_color: '#ffffff',
  title_font_size: '1.75rem',
  description_color: 'rgba(255,255,255,0.7)',
  description_font_size: '0.875rem',
  mobile_title_font_size: '1.25rem',
  mobile_description_font_size: '0.75rem',
  mobile_value_font_size: '1.75rem',
  mobile_label_font_size: '0.75rem',
  fontfamily: '',
  text_active: true,
  image_active: true,
}

/* ── fallback SVG icons ── */
const FALLBACK_ICONS = [
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>,
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  <svg key="4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  <svg key="5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>,
]

/* ── count-up hook (re-triggers on every `cycle` change) ── */
function useCountUp(target: string, cycle: number) {
  const [display, setDisplay] = useState('0')
  const numericPart = target.replace(/[^0-9.]/g, '')
  const num = parseFloat(numericPart) || 0

  useEffect(() => {
    // Resets the counter at the start of each requestAnimationFrame-driven
    // cycle — an imperative browser-API animation, not derivable state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cycle === 0 || num === 0) { setDisplay('0'); return }
    setDisplay('0')
    const duration = 1800
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      const cur = Math.round(ease * num)
      const formatted = target.replace(numericPart, cur.toLocaleString('en-US'))
      setDisplay(formatted)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [cycle, target, num, numericPart])

  return display
}

/* ── icon rendering helper ── */
function StatIcon({ icon, index }: { icon: string | null; index: number }) {
  if (icon) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#0048BA]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <Image src={icon} alt="" width={24} height={24} className="w-6 h-6 object-contain" unoptimized />
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-[#0048BA]/10 flex items-center justify-center flex-shrink-0 text-[#0048BA]">
      {FALLBACK_ICONS[index % FALLBACK_ICONS.length]}
    </div>
  )
}

/* ── single stat cell ── */
function StatCell({ stat, index, cycle, language, config }: {
  stat: StatItem; index: number; cycle: number; language: string; config: StatsConfig
}) {
  const label = language === 'mn' ? stat.label_mn : stat.label_en
  const animatedValue = useCountUp(stat.value, cycle)
  const isVisible = cycle > 0
  const suffixColor = stat.suffix_color || config.suffix_color || '#0048BA'

  return (
    <div
      className="flex items-start gap-4 transition-all duration-700"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${index * 120}ms`,
      }}
    >
      <StatIcon icon={stat.icon} index={index} />

      <div className="min-w-0">
        {/* value + suffix on same baseline */}
        <div
          className="font-extrabold tracking-tight leading-none flex items-baseline gap-0"
          style={{ color: config.value_color, fontSize: config.value_font_size, ...getFontStyle(config.fontfamily) }}
        >
          {stat.prefix && <span>{stat.prefix}</span>}
          <span className="inline-block overflow-hidden">
            <span
              className="inline-block transition-transform duration-700"
              style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                transitionDelay: `${index * 120 + 200}ms`,
              }}
            >
              {animatedValue}
            </span>
          </span>
          {stat.suffix && (
            <span className="font-extrabold" style={{ color: suffixColor }}>
              {stat.suffix}
            </span>
          )}
        </div>
        {/* label */}
        <p
          className="font-medium mt-1.5 tracking-wide leading-snug"
          style={{ color: config.label_color, fontSize: config.label_font_size, ...getFontStyle(config.fontfamily) }}
        >
          {label}
        </p>
      </div>
    </div>
  )
}

/* ── check if URL is a video ── */
function isVideo(url: string | null): boolean {
  if (!url) return false
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url)
}

/* ── left-side media ── */
function SectionMedia({
  visible, config, language,
}: {
  visible: boolean; config: StatsConfig; language: string
}) {
  const [imgError, setImgError] = useState(false)
  const showImage = config.image_active
  const showText = config.text_active
  const hasMedia = showImage && !!config.section_image
  const isVid = isVideo(config.section_image)
  const title = language === 'mn' ? config.title_mn : config.title_en
  const desc = language === 'mn' ? config.description_mn : config.description_en

  return (
    <div
      className="relative w-full h-full min-h-[260px] md:min-h-[340px] rounded-2xl overflow-hidden transition-all duration-1000"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.95)',
      }}
    >
      {/* gradient background (always present as fallback) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0048BA] via-[#003d9e] to-[#002766]" />

      {/* media: video */}
      {hasMedia && isVid && (
        <video
          src={config.section_image!}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* media: image (jpg / png / gif / webp) */}
      {hasMedia && !isVid && !imgError && (
        <Image
          src={config.section_image!}
          alt=""
          fill
          className="object-cover"
          unoptimized
          onError={() => setImgError(true)}
        />
      )}

      {/* decorative elements when no image */}
      {(!hasMedia || imgError) && !isVid && (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/4 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/[0.03] rounded-full -translate-x-1/2 -translate-y-1/2" />
        </>
      )}

      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* text overlay */}
      {showText && (
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h2
            className="font-bold leading-snug transition-all duration-700 delay-200"
            style={{
              color: config.title_color,
              fontSize: config.title_font_size,
              ...getFontStyle(config.fontfamily),
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            {title}
          </h2>
          <p
            className="mt-2 max-w-[320px] transition-all duration-700 delay-300"
            style={{
              color: config.description_color,
              fontSize: config.description_font_size,
              ...getFontStyle(config.fontfamily),
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            {desc}
          </p>
        </div>
      )}
    </div>
  )
}

/* ── main component ── */
export default function StatsBarClient({ stats, config, language }: {
  stats: StatItem[]; config: StatsConfig; language: Locale
}) {
  const [cycle, setCycle] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  /* ── responsive: detect mobile ── */
  useEffect(() => {
    // window.matchMedia doesn't exist during SSR — this must run after
    // mount, both to read the initial value and to subscribe to changes.
    const mq = window.matchMedia('(max-width: 767px)')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  /* ── resolve config: swap mobile font sizes on small screens ── */
  const resolvedConfig: StatsConfig = isMobile ? {
    ...config,
    title_font_size: config.mobile_title_font_size || config.title_font_size,
    description_font_size: config.mobile_description_font_size || config.description_font_size,
    value_font_size: config.mobile_value_font_size || config.value_font_size,
    label_font_size: config.mobile_label_font_size || config.label_font_size,
  } : config

  /* re-trigger animation every time section enters viewport */
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setCycle((c) => c + 1)
        } else {
          setCycle(0)
        }
      },
      { threshold: 0.2 },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [stats])

  const isVisible = cycle > 0

  return (
    <section ref={ref} className="w-full py-8 md:py-14 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100/80 rounded-2xl md:rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-stretch">

            {/* left — image / media (only if image_active OR text_active needs the panel) */}
            {(config.image_active || config.text_active) && (
              <div className="lg:w-[40%] flex-shrink-0 p-4 md:p-5">
                <SectionMedia visible={isVisible} config={resolvedConfig} language={language} />
              </div>
            )}

            {/* right — stats grid */}
            <div className="flex-1 px-6 py-8 md:px-10 md:py-12 lg:py-10 flex items-center">
              <div className="w-full grid grid-cols-2 gap-x-8 md:gap-x-14 gap-y-8 md:gap-y-10">
                {stats.map((stat, i) => (
                  <StatCell
                    key={stat.id}
                    stat={stat}
                    index={i}
                    cycle={cycle}
                    language={language}
                    config={resolvedConfig}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
