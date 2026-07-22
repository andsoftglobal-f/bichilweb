'use client'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import RatesTicker from './RatesTicker'

const BACKEND = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'

export interface SliderItem {
  id: number
  type: 'i' | 'v'
  file: string
  time: number
  index: number
  visible: boolean
  file_url: string
  tablet_file: string
  tablet_type: 'i' | 'v'
  tablet_file_url: string
  mobile_file: string
  mobile_type: 'i' | 'v'
  mobile_file_url: string
}

type DeviceType = 'desktop' | 'tablet' | 'mobile'

function normalizeMediaSrc(raw?: string | null): string {
  if (!raw || raw === 'null' || raw === 'undefined') return ''
  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('blob:') ||
    raw.startsWith('data:') ||
    raw.startsWith('/')
  ) {
    return raw
  }
  return `${BACKEND.replace(/\/$/, '')}/${raw.replace(/^\/+/, '')}`
}

function useDeviceType(): DeviceType {
  const [device, setDevice] = useState<DeviceType>('desktop')

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      if (w < 768) setDevice('mobile')
      else if (w < 1024) setDevice('tablet')
      else setDevice('desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return device
}

export default function HeroClient({ sliderItems }: { sliderItems: SliderItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)
  const [animating, setAnimating] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const device = useDeviceType()
  const animTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    // Clamps the current index back in bounds if sliderItems shrinks after a
    // locale refresh — can't be derived inline since it must reset state,
    // not just the rendered value, so the next auto-advance starts from a valid index.
    if (sliderItems.length > 0 && currentIndex >= sliderItems.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentIndex(0)
    }
  }, [currentIndex, sliderItems.length])

  const currentMedia = sliderItems[currentIndex]

  const doTransition = (nextIndex: number) => {
    if (sliderItems.length <= 1 || animating || nextIndex === currentIndex) return
    setPrevIndex(currentIndex)
    setCurrentIndex(nextIndex)
    // Force browser to paint the initial state (scale 1.3, opacity 0) before animating
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimating(true)
        if (animTimerRef.current) clearTimeout(animTimerRef.current)
        animTimerRef.current = setTimeout(() => {
          setPrevIndex(null)
          setAnimating(false)
        }, 900)
      })
    })
  }

  const goToNext = () => {
    doTransition((currentIndex + 1) % sliderItems.length)
  }

  const goToPrevious = () => {
    doTransition((currentIndex - 1 + sliderItems.length) % sliderItems.length)
  }

  useEffect(() => {
    if (!currentMedia || sliderItems.length <= 1) return
    const timer = setTimeout(() => {
      goToNext()
    }, currentMedia.time * 1000)
    return () => clearTimeout(timer)
  }, [currentIndex, currentMedia, sliderItems.length])

  // Get the right media URL and type for the current device
  // Full URL аль хэдийн absolute тул шууд буцаана
  const getMediaSrc = (media: SliderItem): string => {
    let raw = ''
    if (device === 'mobile' && (media.mobile_file_url || media.mobile_file)) {
      raw = media.mobile_file_url || media.mobile_file
    } else if (device === 'tablet' && (media.tablet_file_url || media.tablet_file)) {
      raw = media.tablet_file_url || media.tablet_file
    } else {
      raw = media.file_url || media.file
    }
    return normalizeMediaSrc(raw)
  }

  const getMediaType = (media: SliderItem): 'i' | 'v' => {
    if (device === 'mobile' && media.mobile_file) return media.mobile_type || 'i'
    if (device === 'tablet' && media.tablet_file) return media.tablet_type || 'i'
    return media.type
  }

  if (sliderItems.length === 0) {
    return (
      <section className="relative h-[50vh] sm:h-screen w-full overflow-hidden -mt-20 lg:-mt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-blue-700" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white text-2xl font-semibold">No slider content available</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <RatesTicker />
        </div>
      </section>
    )
  }

  return (
    <section ref={heroRef} className="relative h-[50vh] sm:h-screen w-full overflow-hidden -mt-20 lg:-mt-24">
      <div className="absolute inset-0">
        {sliderItems.map((media, index) => {
          const src = getMediaSrc(media)
          const mediaType = getMediaType(media)

          const isActive = index === currentIndex
          const isLeaving = index === prevIndex

          if (!isActive && !isLeaving) return null

          let opacity = 0
          let scale = 'scale(1.3)'
          let transition = 'none'

          if (isActive && !animating && prevIndex === null) {
            // Idle: current slide fully visible
            opacity = 1
            scale = 'scale(1)'
          } else if (isActive && !animating && prevIndex !== null) {
            // Just mounted as new current, before animation starts - initial state
            opacity = 0
            scale = 'scale(1.3)'
          } else if (isActive && animating) {
            // Animating in: zoom from 1.3 to 1, fade in
            opacity = 1
            scale = 'scale(1)'
            transition = 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out'
          } else if (isLeaving && animating) {
            // Animating out: zoom from 1 to 0.75, fade out
            opacity = 0
            scale = 'scale(0.75)'
            transition = 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out'
          } else if (isLeaving && !animating) {
            opacity = 1
            scale = 'scale(1)'
          }

          return (
            <div
              key={media.id}
              className="absolute inset-0"
              style={{
                opacity,
                transform: scale,
                transition,
                zIndex: isActive ? 2 : isLeaving ? 1 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
                willChange: isActive || isLeaving ? 'transform, opacity' : 'auto',
              }}
            >
              {src ? (
                mediaType === 'i' ? (
                  <Image
                    src={src}
                    alt="Hero"
                    fill
                    sizes="100vw"
                    quality={100}
                    unoptimized
                    className="object-cover object-center"
                    priority={index === 0}
                  />
                ) : (
                  <video
                    src={src}
                    className="w-full h-full object-cover object-center"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                )
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white">
                  No Media
                </div>
              )}
            </div>
          )
        })}

        <div className="absolute inset-0 bg-black/40" />
      </div>

      {sliderItems.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

        </>
      )}

      {/* Rates Ticker */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <RatesTicker />
      </div>
    </section>
  )
}
