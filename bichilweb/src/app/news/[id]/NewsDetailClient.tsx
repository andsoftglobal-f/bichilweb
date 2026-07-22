"use client";

import { useEffect, useState, type MouseEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import Container from "@/components/Container"
import { getFontStyle } from '@/lib/fontUtils'
import type { Locale } from '@/lib/i18n'

export interface NewsItem {
  id: number
  title: string
  titleFontFamily: string
  slug: string
  excerpt: string
  excerptFontFamily: string
  content: string
  contentFontFamily: string
  bannerImage: string
  category: number
  categoryLabel: string
  publishedAt: string
  readTime: number
  isPinnedNews: boolean
  images: string[]
  socials: { social: string; icon: string }[]
  video: string
  videoOrientation: NewsVideoOrientation
  facebookUrl: string
}

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  'https://bichilglobus.mn'
).replace(/\/$/, '')

const SHARE_WINDOW_FEATURES = 'popup=yes,width=720,height=760,scrollbars=yes,resizable=yes'

const getNewsPageUrl = (slug: string): string => {
  if (typeof window !== 'undefined') {
    return window.location.href.split('#')[0]
  }

  return `${SITE_URL}/news/${slug}`
}

const getSocialShareUrl = (platform: string, pageUrl: string, title: string): string => {
  const encodedUrl = encodeURIComponent(pageUrl)
  const encodedTitle = encodeURIComponent(title)

  if (platform === 'facebook') {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`
  }

  if (platform === 'twitter' || platform === 'x') {
    return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
  }

  if (platform === 'linkedin') {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  }

  if (platform === 'telegram') {
    return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
  }

  if (platform === 'youtube') return 'https://www.youtube.com/'
  if (platform === 'tiktok') return 'https://www.tiktok.com/'

  return pageUrl
}

export type NewsVideoOrientation = 'horizontal' | 'vertical'

export const normalizeVideoOrientation = (value?: string | null): NewsVideoOrientation => {
  const normalized = String(value || '').trim().toLowerCase()

  if (
    normalized.includes('vertical') ||
    normalized.includes('portrait') ||
    normalized.includes('bosoo') ||
    normalized.includes('босоо') ||
    normalized.includes('9/16') ||
    normalized.includes('9:16')
  ) {
    return 'vertical'
  }

  return 'horizontal'
}

const getYouTubeVideoId = (url: string): string | null => {
  return url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] || null
}

const isDirectVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url)
}

const isFacebookVideoUrl = (url: string): boolean => {
  return /(?:facebook\.com|fb\.watch)/i.test(url)
}

const isFacebookReelUrl = (url: string): boolean => {
  return /(?:facebook\.com\/reel\/|fb\.watch)/i.test(url)
}

const splitNewsVideoUrls = (value?: string | null): string[] => {
  return String(value || '')
    .split(/[\n,]+/)
    .map(url => url.trim())
    .filter(Boolean)
    .slice(0, 3)
}

const getAutoVideoOrientation = (url: string, fallback?: string | null): NewsVideoOrientation => {
  const normalizedUrl = url.toLowerCase()

  if (
    isFacebookReelUrl(url) ||
    normalizedUrl.includes('/shorts/') ||
    normalizedUrl.includes('tiktok.com') ||
    normalizedUrl.includes('instagram.com/reel') ||
    normalizedUrl.includes('instagram.com/p/')
  ) {
    return 'vertical'
  }

  return normalizeVideoOrientation(fallback)
}

const getFacebookVideoEmbedUrl = (url: string, width = 500): string => {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=${width}`
}

const getNewsVideoEmbedUrl = (url: string): string => {
  const youtubeId = getYouTubeVideoId(url)
  if (youtubeId) return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`

  try {
    const host = new URL(url).hostname.toLowerCase()

    if (host.includes('facebook.com') || host.includes('fb.watch')) {
      return getFacebookVideoEmbedUrl(url)
    }

    if (host.includes('tiktok.com')) {
      const match = url.match(/\/video\/(\d+)/)
      if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`
    }

    if (host.includes('instagram.com')) {
      const clean = url.split('?')[0].replace(/\/$/, '')
      return `${clean}/embed`
    }
  } catch {
    return isDirectVideoUrl(url) ? url : ''
  }

  return url
}

const getNewsVideoThumbnail = (url: string, fallback?: string | null): string | null => {
  const youtubeId = getYouTubeVideoId(url)
  if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
  return fallback || null
}

function NewsVideoModal({
  url,
  orientation,
  onClose,
}: {
  url: string
  orientation: NewsVideoOrientation
  onClose: () => void
}) {
  const isDirectVideo = isDirectVideoUrl(url)
  const isFacebookVideo = isFacebookVideoUrl(url)
  const effectiveOrientation = isFacebookReelUrl(url) ? 'vertical' : orientation
  const isVertical = effectiveOrientation === 'vertical'
  const embedUrl = isFacebookVideo
    ? getFacebookVideoEmbedUrl(url, isVertical ? 420 : 900)
    : getNewsVideoEmbedUrl(url)

  if (!embedUrl) return null

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Video"
    >
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl ${isVertical ? 'max-w-[430px]' : 'max-w-5xl'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/90"
          aria-label="Close video"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isFacebookVideo ? (
          <div className={`w-full bg-black ${isVertical ? 'aspect-[9/16] max-h-[88vh]' : 'aspect-video max-h-[86vh]'}`}>
            <iframe
              src={embedUrl}
              title="Video"
              width={isVertical ? '420' : '900'}
              height={isVertical ? '746' : '506'}
              scrolling="no"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="block h-full w-full border-0 bg-black"
            />
          </div>
        ) : (
          <div className={`relative w-full bg-black ${isVertical ? 'aspect-[9/16] max-h-[82vh]' : 'aspect-video'}`}>
            {isDirectVideo ? (
              <video
                src={embedUrl}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : (
              <iframe
                src={embedUrl}
                title="Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full border-0"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const renderSocialPlatformIcon = (platform: string) => {
  const p = platform.toLowerCase()
  if (p === 'facebook') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
  )
  if (p === 'instagram') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
  )
  if (p === 'twitter' || p === 'x') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694-5.979 6.694H2.42l7.728-8.835L1.497 2.25h6.886l4.612 6.105L17.457 2.25zM16.369 20.033h1.83L5.337 4.059H3.425l12.944 15.974z" /></svg>
  )
  if (p === 'youtube') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
  )
  if (p === 'linkedin') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
  )
  if (p === 'tiktok') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
  )
  if (p === 'telegram') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
  )
  // Default link icon
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
  )
}

export default function NewsDetailClient({ news, relatedNews, nextNews, locale, error }: {
  news: NewsItem | null
  relatedNews: NewsItem[]
  nextNews: NewsItem | null
  locale: Locale
  error: boolean
}) {
  const isEn = locale === 'en';
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ url: string; orientation: NewsVideoOrientation } | null>(null);
  const [copied, setCopied] = useState(false);

  const tr = {
    featured: isEn ? 'Featured' : 'Онцлох',
    min: isEn ? 'min' : 'мин',
    home: isEn ? 'Home' : 'Нүүр',
    news: isEn ? 'News' : 'Мэдээ',
    video: isEn ? 'Video' : 'Видео',
    additionalImages: isEn ? 'Gallery' : 'Нэмэлт зургууд',
    shareNews: isEn ? 'Share' : 'Хуваалцах',
    copyLink: isEn ? 'Copied' : 'Хуулсан',
    relatedNews: isEn ? 'Related News' : 'Холбоотой мэдээ',
    nextNews: isEn ? 'Next News' : 'Дараагийн мэдээ',
    notFound: isEn ? 'News not found' : 'Мэдээ олдсонгүй',
    notFoundDesc: isEn ? 'Sorry, the news you are looking for was not found.' : 'Уучлаарай, хайсан мэдээ олдсонгүй.',
    backToNews: isEn ? 'Back to News' : 'Мэдээ рүү буцах',
    errorTitle: isEn ? 'Error occurred' : 'Алдаа гарлаа',
    errorDesc: isEn ? 'Failed to load news. Please try again.' : 'Мэдээ ачаалахад асуудал гарав. Дахин оролдоно уу.',
    reload: isEn ? 'Reload' : 'Дахин ачаалах',
    shareOn: isEn ? 'Share on' : '',
    copyLinkTitle: isEn ? 'Copy' : 'Хуулах',
    largeImage: isEn ? 'Full image' : 'Том зураг',
    noTitle: isEn ? 'Untitled' : 'Гарчиггүй',
    defaultCategory: isEn ? 'News' : 'Мэдээ',
  };

  const galleryImages = news
    ? Array.from(new Set([news.bannerImage, ...news.images, selectedImage].filter(Boolean) as string[]))
    : selectedImage ? [selectedImage] : []
  const selectedImageIndex = selectedImage ? galleryImages.indexOf(selectedImage) : -1

  const showGalleryImage = (step: number) => {
    if (!selectedImage || galleryImages.length <= 1) return

    const currentIndex = selectedImageIndex >= 0 ? selectedImageIndex : 0
    const nextIndex = (currentIndex + step + galleryImages.length) % galleryImages.length
    setSelectedImage(galleryImages[nextIndex])
  }

  const handleContentImageClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const image = target.closest('img') as HTMLImageElement | null
    const src = image?.currentSrc || image?.src || image?.getAttribute('src')

    if (!src) return

    event.preventDefault()
    event.stopPropagation()
    setSelectedImage(src)
  }

  const handleSocialShare = async (platform: string, pageUrl: string, newsTitle: string) => {
    if (platform === 'instagram') {
      try {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: newsTitle,
            text: stripHtml(news?.excerpt || newsTitle),
            url: pageUrl,
          })
          return
        }

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(pageUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
      } catch {
        // If native share is cancelled or unavailable, just fall back to Instagram.
      }

      window.open('https://www.instagram.com/', '_blank', SHARE_WINDOW_FEATURES)
      return
    }

    window.open(getSocialShareUrl(platform, pageUrl, newsTitle), '_blank', SHARE_WINDOW_FEATURES)
  }

  useEffect(() => {
    if (!selectedImage) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null)
      }

      if (event.key === 'ArrowLeft') {
        showGalleryImage(-1)
      }

      if (event.key === 'ArrowRight') {
        showGalleryImage(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedImage, selectedImageIndex, galleryImages.length]);

  if (!news) {
    if (error) {
      return (
        <main className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{tr.errorTitle}</h1>
            <p className="text-gray-500 mb-8">{tr.errorDesc}</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/news"
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                {tr.backToNews}
              </Link>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{tr.notFound}</h1>
          <p className="text-gray-500 mb-8">{tr.notFoundDesc}</p>
          <Link href="/news" className="inline-flex items-center gap-2 px-6 py-3 text-white bg-[#0048BA] hover:bg-[#003d9e] rounded-xl transition-all duration-200 font-medium shadow-lg shadow-[#0048BA]/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {tr.backToNews}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner Image - extends behind header */}
      <div
        className="relative w-full h-[calc(50vh+5rem)] md:h-[calc(60vh+5rem)] lg:h-[calc(60vh+6rem)] -mt-20 lg:-mt-24 cursor-pointer"
        onClick={() => setSelectedImage(news.bannerImage)}
      >
        <Image
          src={news.bannerImage}
          alt={news.title}
          fill
          unoptimized
          priority
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-news.jpg'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Category & meta on hero bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <Container>
            <div className="pb-20 md:pb-24 flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-full text-sm font-medium border border-white/20">
                {news.categoryLabel}
              </span>
              {news.isPinnedNews && (
                <span className="px-3.5 py-1.5 bg-amber-500/20 backdrop-blur-md text-amber-200 rounded-full text-sm font-medium flex items-center gap-1.5 border border-amber-400/20">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  {tr.featured}
                </span>
              )}
              <span className="text-white/70 text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {new Date(news.publishedAt).toLocaleDateString(isEn ? 'en-US' : 'mn-MN')}
              </span>
              <span className="text-white/70 text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {news.readTime} {tr.min}
              </span>
            </div>
          </Container>
        </div>
      </div>

      {/* Content Card - overlaps hero */}
      <Container>
        <div className="max-w-4xl mx-auto -mt-12 md:-mt-16 relative z-10 pb-16">
          <article className="bg-white rounded-2xl shadow-xl">
            {/* Breadcrumb */}
            <div className="px-6 md:px-10 pt-6 md:pt-8">
              <nav className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/" className="hover:text-[#0048BA] transition-colors">{tr.home}</Link>
                <span>/</span>
                <Link href="/news" className="hover:text-[#0048BA] transition-colors">{tr.news}</Link>
                <span>/</span>
                <span className="text-gray-600 font-medium truncate max-w-[220px]">{stripHtml(news.title)}</span>
              </nav>
            </div>

            {/* Title & Excerpt */}
            <div className="px-6 md:px-10 pt-4 md:pt-5">
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4"
                style={getFontStyle(news.titleFontFamily)}
                dangerouslySetInnerHTML={{ __html: news.title }}
              />
              {news.excerpt && (
                <div
                  className="text-base md:text-lg text-gray-500 leading-relaxed"
                  style={getFontStyle(news.excerptFontFamily)}
                  dangerouslySetInnerHTML={{ __html: news.excerpt }}
                />
              )}
            </div>

            {/* Divider */}
            <div className="mx-6 md:mx-10 my-6 md:my-8 border-t border-gray-100" />

            {/* Content */}
            {news.content && (
              <div className="px-6 md:px-10 pb-2">
                <div
                  className="prose prose-lg max-w-none text-gray-700 leading-[1.85] text-[15px] md:text-base [&_img]:cursor-zoom-in [&_img]:rounded-2xl [&_img]:shadow-sm [&_img]:transition-transform [&_img:hover]:scale-[1.01]"
                  style={getFontStyle(news.contentFontFamily)}
                  onClick={handleContentImageClick}
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
              </div>
            )}

            {/* Video */}
            {news.video && (() => {
              const videoUrls = splitNewsVideoUrls(news.video).filter(url => getNewsVideoEmbedUrl(url))
              if (!videoUrls.length) return null

              return (
                <div className="px-6 md:px-10 pt-6 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {tr.video}
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide cursor-grab active:cursor-grabbing overscroll-x-contain">
                    {videoUrls.map((videoUrl, index) => {
                      const orientation = getAutoVideoOrientation(videoUrl)
                      const isVertical = orientation === 'vertical'
                      const thumb = getNewsVideoThumbnail(videoUrl, news.bannerImage)

                      return (
                        <button
                          key={`${videoUrl}-${index}`}
                          type="button"
                          onClick={() => setActiveVideo({ url: videoUrl, orientation })}
                          className={`group block flex-shrink-0 overflow-hidden rounded-2xl border border-blue-100 bg-[#EEF3FA] text-left shadow-sm transition-all hover:shadow-md ${isVertical ? 'w-[220px] sm:w-[240px]' : 'w-[260px] sm:w-[280px]'}`}
                          aria-label={`${tr.video} ${index + 1}`}
                        >
                          <div className={`relative w-full overflow-hidden bg-slate-200 ${isVertical ? 'aspect-[9/16]' : 'h-[160px]'}`}>
                            {thumb ? (
                              <img
                                src={thumb}
                                alt=""
                                draggable={false}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-blue-100 to-slate-200" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white transition-colors group-hover:bg-black/70">
                                <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Facebook Post Embed */}
            {news.facebookUrl && (() => {
              const fbUrl = news.facebookUrl
              const encodedUrl = encodeURIComponent(fbUrl)
              const embedSrc = `https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500&appId`
              return (
                <div className="px-6 md:px-10 pt-6 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    Facebook
                  </h3>
                  <div className="flex justify-center">
                    <iframe
                      src={embedSrc}
                      width="500"
                      height="680"
                      style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }}
                      scrolling="no"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    />
                  </div>
                </div>
              )
            })()}

            {/* Additional Images */}
            {news.images && news.images.length > 0 && (
              <div className="px-6 md:px-10 pt-6 pb-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {tr.additionalImages}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {news.images.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group"
                      onClick={() => setSelectedImage(img)}
                    >
                      <Image
                        src={img}
                        alt={`${news.title} - Зураг ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-news.jpg'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Share & Links */}
            <div className="px-6 md:px-10 py-6 md:py-8 mt-4">
              <div className="border-t border-b border-gray-100 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{tr.shareNews}</span>
                  <div className="flex items-center gap-2">
                    {/* Share buttons from DB socials — each icon opens platform share */}
                    {news.socials && news.socials.length > 0 && news.socials.map((s, idx) => {
                      const platform = (s.icon || s.social || '').toLowerCase()
                      const pageUrl = getNewsPageUrl(news.slug)
                      const newsTitle = stripHtml(news.title)

                      const hoverColors: Record<string, string> = {
                        facebook: 'hover:bg-[#1877F2] hover:text-white',
                        twitter: 'hover:bg-gray-900 hover:text-white',
                        x: 'hover:bg-gray-900 hover:text-white',
                        linkedin: 'hover:bg-[#0A66C2] hover:text-white',
                        telegram: 'hover:bg-[#0088cc] hover:text-white',
                        instagram: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#dc2743] hover:text-white',
                        youtube: 'hover:bg-[#FF0000] hover:text-white',
                        tiktok: 'hover:bg-gray-900 hover:text-white',
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSocialShare(platform, pageUrl, newsTitle)}
                          className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-50 text-gray-500 transition-all duration-300 ${hoverColors[platform] || 'hover:bg-[#0048BA] hover:text-white'}`}
                          title={`${s.icon} ${isEn ? 'Share' : 'Хуваалцах'}`}
                        >
                          {renderSocialPlatformIcon(s.icon || s.social)}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(getNewsPageUrl(news.slug))
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                        copied
                          ? 'bg-[#0048BA] text-white'
                          : 'bg-gray-50 text-gray-500 hover:bg-[#0048BA] hover:text-white'
                      }`}
                      title={tr.copyLinkTitle}
                    >
                      {copied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {tr.copyLink}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {tr.copyLinkTitle}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Related News */}
          {relatedNews.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{tr.relatedNews}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedNews.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                      <Image
                        src={item.bannerImage}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-news.jpg'
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-[#0048BA] bg-[#E6F0FF] px-2 py-0.5 rounded-full">{item.categoryLabel}</span>
                        <span className="text-xs text-gray-400">{new Date(item.publishedAt).toLocaleDateString(isEn ? 'en-US' : 'mn-MN')}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-[#0048BA] transition-colors leading-snug">
                        {stripHtml(item.title)}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Next News */}
          {nextNews && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{tr.nextNews}</h2>
              <Link
                href={`/news/${nextNews.slug}`}
                className="group flex gap-5 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300"
              >
                <div className="relative w-36 sm:w-44 flex-shrink-0 overflow-hidden bg-gray-100">
                  <Image
                    src={nextNews.bannerImage}
                    alt={stripHtml(nextNews.title)}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-news.jpg'
                    }}
                  />
                </div>
                <div className="py-4 pr-4 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-[#0048BA] bg-[#E6F0FF] px-2 py-0.5 rounded-full">{nextNews.categoryLabel}</span>
                    <span className="text-xs text-gray-400">{new Date(nextNews.publishedAt).toLocaleDateString(isEn ? 'en-US' : 'mn-MN')}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-[#0048BA] transition-colors leading-snug">
                    {stripHtml(nextNews.title)}
                  </h3>
                </div>
                <div className="flex items-center pr-5 text-[#00B2E7] group-hover:translate-x-1 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </section>
          )}
        </div>
      </Container>

      {activeVideo && (
        <NewsVideoModal
          url={activeVideo.url}
          orientation={activeVideo.orientation}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* Image Modal - spaced away from header & floating bottom menu */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/90 px-3 py-4 backdrop-blur-xl sm:px-6"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={tr.largeImage}
        >
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          <div className="relative flex h-full w-full max-w-7xl flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 pb-3 sm:pb-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                  {tr.largeImage}
                </p>
                <p className="mt-1 truncate text-sm text-white/75">
                  {galleryImages.length > 1 && selectedImageIndex >= 0
                    ? `${selectedImageIndex + 1} / ${galleryImages.length}`
                    : stripHtml(news?.title || '')}
                </p>
              </div>

              <button
                onClick={() => setSelectedImage(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-2xl shadow-black/30 transition hover:bg-white hover:text-slate-950"
                aria-label="Close image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => showGalleryImage(-1)}
                    className="absolute left-1 z-20 hidden h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur-md transition hover:bg-white hover:text-slate-950 sm:flex"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => showGalleryImage(1)}
                    className="absolute right-1 z-20 hidden h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur-md transition hover:bg-white hover:text-slate-950 sm:flex"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              <div className="relative flex max-h-full max-w-full items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-2 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-3">
            <Image
              src={selectedImage}
              alt="Том зураг"
              width={1400}
              height={900}
              unoptimized
              className="max-h-[calc(100vh-13rem)] w-auto max-w-full rounded-[1.35rem] object-contain sm:max-h-[calc(100vh-15rem)]"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-news.jpg'
              }}
            />
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4">
                <button
                  type="button"
                  onClick={() => showGalleryImage(-1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white sm:hidden"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex max-w-[72vw] gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/10 px-2 py-2 backdrop-blur-md">
                  {galleryImages.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-full border transition sm:h-14 sm:w-20 ${
                        img === selectedImage ? 'border-white ring-2 ring-white/35' : 'border-white/15 opacity-65 hover:opacity-100'
                      }`}
                      aria-label={`Image ${index + 1}`}
                    >
                      <Image
                        src={img}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => showGalleryImage(1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white sm:hidden"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
