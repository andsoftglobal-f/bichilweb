'use client'

import { useEffect, useState, useRef } from 'react'
import type { Locale } from '@/lib/i18n'

export interface Partner {
  id: number
  name: string
  logo: string | null
  logo_url: string | null
  url: string
  active: boolean
}

export interface PartnerSectionConfig {
  title_mn: string
  title_en: string
  title_color: string
  title_font_size: string
  title_font_family: string
  divider_width: string
  divider_height: string
  divider_color: string
  divider_margin_top: string
  divider_margin_bottom: string
}

export const DEFAULT_SECTION_CONFIG: PartnerSectionConfig = {
  title_mn: 'Хамтрагч байгууллагууд',
  title_en: 'Partner organizations',
  title_color: '#9ca3af',
  title_font_size: '0.875rem',
  title_font_family: '',
  divider_width: '64px',
  divider_height: '4px',
  divider_color: '#0048BA',
  divider_margin_top: '12px',
  divider_margin_bottom: '24px',
}

const LOGO_W_DESKTOP = 200
const LOGO_W_MOBILE = 120
const LOGO_GAP_DESKTOP = 12
const LOGO_GAP_MOBILE = 0

export default function PartnersMarqueeClient({ partners, sectionConfig, language }: {
  partners: Partner[]; sectionConfig: PartnerSectionConfig; language: Locale
}) {
  const [isMobile, setIsMobile] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const offsetRef = useRef(0)
  const pausedRef = useRef(false)
  const lastTimeRef = useRef(0)
  const draggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartOffsetRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  // Properly detect mobile with SSR safety and resize listener
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const logoW = isMobile ? LOGO_W_MOBILE : LOGO_W_DESKTOP
  const logoGap = isMobile ? LOGO_GAP_MOBILE : LOGO_GAP_DESKTOP
  const logoH = isMobile ? 80 : 120
  const setWidth = partners.length * (logoW + logoGap)

  const normalizeOffset = (offset: number) => {
    if (setWidth <= 0) return offset
    let nextOffset = offset
    while (nextOffset <= -setWidth) nextOffset += setWidth
    while (nextOffset > 0) nextOffset -= setWidth
    return nextOffset
  }

  const applyOffset = (offset: number) => {
    offsetRef.current = normalizeOffset(offset)
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${offsetRef.current}px)`
    }
  }

  const stopDragging = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    pausedRef.current = false
    setIsDragging(false)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (partners.length === 0) return
    draggingRef.current = true
    pausedRef.current = true
    dragStartXRef.current = event.clientX
    dragStartOffsetRef.current = offsetRef.current
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    const delta = event.clientX - dragStartXRef.current
    applyOffset(dragStartOffsetRef.current + delta)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Pointer capture can already be released by the browser.
    }
    stopDragging()
  }

  useEffect(() => {
    if (partners.length === 0) return
    const animate = (time: number) => {
      if (!trackRef.current || partners.length === 0) {
        animRef.current = requestAnimationFrame(animate)
        return
      }

      if (lastTimeRef.current === 0) lastTimeRef.current = time
      const delta = time - lastTimeRef.current
      lastTimeRef.current = time

      if (!pausedRef.current) {
        const mobile = window.innerWidth < 768
        const w = mobile ? LOGO_W_MOBILE : LOGO_W_DESKTOP
        const g = mobile ? LOGO_GAP_MOBILE : LOGO_GAP_DESKTOP
        const speed = mobile ? 40 : 60
        offsetRef.current -= (speed * delta) / 1000

        const loopWidth = partners.length * (w + g)
        if (Math.abs(offsetRef.current) >= loopWidth) {
          offsetRef.current += loopWidth
        }

        trackRef.current.style.transform = `translateX(${offsetRef.current}px)`
      }

      animRef.current = requestAnimationFrame(animate)
    }

    lastTimeRef.current = 0
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [partners])

  if (partners.length === 0) return null

  // Triple the logos to ensure seamless wrapping with no gaps
  const logos = [...partners, ...partners, ...partners]
  const title = language === 'en'
    ? (sectionConfig.title_en || sectionConfig.title_mn)
    : (sectionConfig.title_mn || DEFAULT_SECTION_CONFIG.title_mn)

  const renderLogo = (p: Partner, i: number) => (
    <div
      key={`${p.id}-${i}`}
      className="flex-shrink-0 flex items-center justify-center"
      style={{ width: `${logoW}px`, height: `${logoH}px`, margin: `0 ${logoGap / 2}px` }}
    >
      {p.url ? (
        <a href={p.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full flex items-center justify-center">
          <img
            src={p.logo_url!}
            alt={p.name || 'Partner'}
            loading="lazy"
            decoding="async"
            className="max-w-full max-h-full object-contain"
          />
        </a>
      ) : (
        <img
          src={p.logo_url!}
          alt={p.name || 'Partner'}
          loading="lazy"
          decoding="async"
          className="max-w-full max-h-full object-contain"
        />
      )}
    </div>
  )

  return (
    <section className="w-full py-4 md:py-6 overflow-hidden bg-white">
      <div
        className="max-w-[1400px] mx-auto px-4 md:px-8"
        style={{ marginBottom: sectionConfig.divider_margin_bottom }}
      >
        <h3
          className="text-center font-semibold uppercase tracking-[0.2em]"
          style={{
            color: sectionConfig.title_color,
            fontSize: sectionConfig.title_font_size,
            fontFamily: sectionConfig.title_font_family || undefined,
          }}
        >
          {title}
        </h3>
        <div
          className="mx-auto rounded-full"
          style={{
            width: sectionConfig.divider_width,
            height: sectionConfig.divider_height,
            backgroundColor: sectionConfig.divider_color,
            marginTop: sectionConfig.divider_margin_top,
          }}
        />
      </div>

      <div
        className={`relative select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={stopDragging}
        onPointerLeave={stopDragging}
        style={{ touchAction: 'pan-y' }}
      >
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div
          ref={trackRef}
          className="flex will-change-transform"
          style={{ transform: 'translateX(-5px)' }}
        >
          {logos.map(renderLogo)}
        </div>
      </div>
    </section>
  )
}
