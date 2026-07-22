'use client'

import { useCallback, useRef, useState, type PointerEvent } from 'react'
import type { Locale } from '@/lib/i18n'

export interface Tutorial {
  id: number
  title_mn: string
  title_en: string
  video_url: string
  thumbnail_url: string | null
}

export interface TutorialConfig {
  title_mn: string
  title_en: string
  title_color: string
  title_font_size: string
  title_font_family: string
  title_align: 'left' | 'center' | 'right'
  bg_color: string
  divider_width: string
  divider_height: string
  divider_color: string
  divider_margin_top: string
  divider_margin_bottom: string
}

export const DEFAULT_CONFIG: TutorialConfig = {
  title_mn: 'Аппликейшн ашиглах заавар',
  title_en: 'Product Instructions',
  title_color: '#0f172a',
  title_font_size: '1.875rem',
  title_font_family: '',
  title_align: 'center',
  bg_color: '#ffffff',
  divider_width: '64px',
  divider_height: '4px',
  divider_color: '#0048BA',
  divider_margin_top: '12px',
  divider_margin_bottom: '32px',
}

/* Extract YouTube thumbnail from URL */
function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
  return null
}

function TutorialCard({ item, lang, onClick }: {
  item: Tutorial
  lang: string
  onClick: () => void
}) {
  const thumb = item.thumbnail_url || getYouTubeThumbnail(item.video_url)
  const title = lang === 'en' ? (item.title_en || item.title_mn) : item.title_mn

  return (
    <button
      onClick={onClick}
      draggable={false}
      className="group flex-shrink-0 w-[260px] sm:w-[280px] rounded-2xl overflow-hidden bg-[#EEF3FA] border border-blue-100 shadow-sm hover:shadow-md transition-all text-left"
    >
      {/* Thumbnail */}
      <div className="relative w-full h-[160px] bg-slate-200 overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            draggable={false}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-slate-200" />
        )}
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/55 flex items-center justify-center group-hover:bg-black/70 transition-colors">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      {/* Title */}
      {title && (
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{title}</p>
        </div>
      )}
    </button>
  )
}

/* Video Modal */
function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  const videoId = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )?.[1]

  const isDirectVideo = !videoId && (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg'))
  const embedSrc = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
    : url

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {isDirectVideo ? (
          <video
            src={url}
            controls
            autoPlay
            className="w-full aspect-video"
          />
        ) : (
          <iframe
            src={embedSrc}
            className="w-full aspect-video"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  )
}

export default function ProductTutorialsClient({ items, config, language }: {
  items: Tutorial[]; config: TutorialConfig; language: Locale
}) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  const title = language === 'en' ? (config.title_en || config.title_mn) : config.title_mn
  const dividerMargin = config.title_align === 'left'
    ? '0 auto 0 0'
    : config.title_align === 'right'
      ? '0 0 0 auto'
      : '0 auto'
  const hasItems = items.length > 0

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    if (!el) return
    if (e.pointerType === 'touch') return
    isDraggingRef.current = true
    hasDraggedRef.current = false
    startXRef.current = e.clientX
    scrollLeftRef.current = el.scrollLeft
    el.setPointerCapture?.(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    if (!isDraggingRef.current || !el) return
    const walk = e.clientX - startXRef.current
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true
      e.preventDefault()
    }
    el.scrollLeft = scrollLeftRef.current - walk
  }, [])

  const stopDragging = useCallback((e?: PointerEvent<HTMLDivElement>) => {
    if (e && scrollRef.current?.hasPointerCapture?.(e.pointerId)) {
      scrollRef.current.releasePointerCapture(e.pointerId)
    }
    isDraggingRef.current = false
  }, [])

  const openTutorial = useCallback((url: string) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false
      return
    }
    setActiveUrl(url)
  }, [])

  return (
    <section className="w-full min-h-[320px] py-10" style={{ backgroundColor: config.bg_color }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div style={{ textAlign: config.title_align, marginBottom: config.divider_margin_bottom }}>
          <h2
            className="font-bold"
            style={{
              color: config.title_color,
              fontSize: config.title_font_size,
              fontFamily: config.title_font_family || undefined,
            }}
          >
            {title}
          </h2>
          <div
            className="rounded-full"
            style={{
              width: config.divider_width,
              height: config.divider_height,
              backgroundColor: config.divider_color,
              margin: dividerMargin,
              marginTop: config.divider_margin_top,
            }}
          />
        </div>

        {/* Scrollable row */}
        {hasItems && (
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 sm:w-20"
              style={{ background: `linear-gradient(to right, ${config.bg_color || '#ffffff'} 0%, color-mix(in srgb, ${config.bg_color || '#ffffff'} 0%, transparent) 100%)` }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 sm:w-20"
              style={{ background: `linear-gradient(to left, ${config.bg_color || '#ffffff'} 0%, color-mix(in srgb, ${config.bg_color || '#ffffff'} 0%, transparent) 100%)` }}
            />
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-3 px-8 sm:px-12 scrollbar-hide cursor-grab select-none active:cursor-grabbing overscroll-x-contain"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onLostPointerCapture={stopDragging}
            >
              {items.map(item => (
                <div key={item.id}>
                  <TutorialCard
                    item={item}
                    lang={language}
                    onClick={() => openTutorial(item.video_url)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasItems && (
          <p className="mt-3 text-center text-sm text-slate-500">
            Видео мэдээлэл түр ачаалж чадсангүй. Түр хүлээгээд дахин шинэчлээрэй.
          </p>
        )}
      </div>

      {activeUrl && (
        <VideoModal url={activeUrl} onClose={() => setActiveUrl(null)} />
      )}
    </section>
  )
}
