'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import axiosInstance from '@/config/axiosConfig'

const API_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'

interface Advertisement {
  id: number
  title: string
  description: string | null
  image: string | null
  image_url: string | null
  url: string | null
  button_text?: string | null
  button_font_family?: string | null
  button_text_color?: string | null
  button_hover_text_color?: string | null
  button_text_size?: string | null
  active: boolean
}

function resolveUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export default function AdPopup() {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [intervalSeconds, setIntervalSeconds] = useState<number>(60)
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null)
  const [visible, setVisible] = useState(false)
  const [animStage, setAnimStage] = useState<'enter' | 'idle' | 'exit'>('enter')
  const adIndexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [buttonHovered, setButtonHovered] = useState(false)

  const doClose = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current)
    setAnimStage('exit')
    setTimeout(() => {
      setVisible(false)
      setCurrentAd(null)
    }, 400)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adsRes, configRes] = await Promise.all([
          axiosInstance.get('/advertisements/'),
          axiosInstance.get('/advertisements/config/'),
        ])
        const allAds: Advertisement[] = Array.isArray(adsRes.data) ? adsRes.data : adsRes.data.results || []
        setAds(allAds.filter((a) => a.active))
        if (configRes.data?.interval_seconds) {
          setIntervalSeconds(configRes.data.interval_seconds)
        }
      } catch {
        // Ad popup is non-critical, so the site should continue if this fails.
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (ads.length === 0) return
    const showAd = () => {
      const idx = adIndexRef.current % ads.length
      setCurrentAd(ads[idx])
      setAnimStage('enter')
      setVisible(true)
      setProgress(0)
      setButtonHovered(false)
      adIndexRef.current = idx + 1

      let tick = 0
      if (progressRef.current) clearInterval(progressRef.current)
      progressRef.current = setInterval(() => {
        tick += 50
        setProgress(Math.min((tick / 8000) * 100, 100))
        if (tick >= 8000) {
          if (progressRef.current) clearInterval(progressRef.current)
          doClose()
        }
      }, 50)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimStage('idle'))
      })
    }
    timerRef.current = setInterval(showAd, intervalSeconds * 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [ads, intervalSeconds, doClose])

  const handleClick = useCallback(() => {
    if (currentAd?.url) {
      window.open(currentAd.url, '_blank', 'noopener,noreferrer')
    }
    doClose()
  }, [currentAd, doClose])

  if (!visible || !currentAd) return null

  const imgSrc = resolveUrl(currentAd.image_url || currentAd.image)
  const isEntering = animStage === 'enter'
  const isExiting = animStage === 'exit'
  const buttonLabel = currentAd.button_text || 'Энд дарна уу'
  const buttonStyle = {
    color: buttonHovered
      ? currentAd.button_hover_text_color || currentAd.button_text_color || '#ef3f0a'
      : currentAd.button_text_color || '#ffffff',
    fontSize: currentAd.button_text_size || '18px',
    fontFamily: currentAd.button_font_family || undefined,
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background:
            isEntering || isExiting
              ? 'rgba(2, 6, 12, 0)'
              : 'radial-gradient(circle at 18% 35%, rgba(255, 90, 31, 0.18), transparent 25%), rgba(2, 6, 12, 0.76)',
          backdropFilter: isEntering || isExiting ? 'blur(0px)' : 'blur(12px) saturate(0.85)',
        }}
        onClick={doClose}
      />

      <div
        className="relative w-full sm:w-full"
        style={{
          maxWidth: 'min(980px, calc(100vw - 24px))',
          opacity: isExiting ? 0 : 1,
          transform: isEntering
            ? 'translateY(26px) scale(0.94)'
            : isExiting
              ? 'translateY(-16px) scale(0.97)'
              : 'translateY(0) scale(1)',
          transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease',
        }}
      >
        <button
          type="button"
          onClick={doClose}
          aria-label="Зарыг хаах"
          className="absolute right-2.5 top-2.5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-[#0b5ed7] text-white shadow-[0_10px_25px_rgba(11,94,215,0.35)] ring-1 ring-white/45 transition-all duration-200 hover:scale-105 hover:bg-[#084ab0] sm:right-4 sm:top-4 sm:h-12 sm:w-12"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div
          className="relative overflow-hidden bg-[#ff5a1f] ring-1 ring-white/25"
          style={{
            borderRadius: 'clamp(22px, 2vw, 34px)',
            boxShadow: '0 28px 75px rgba(0, 0, 0, 0.48), 0 0 0 1px rgba(255,255,255,0.16)',
          }}
        >
          {imgSrc ? (
            <div
              className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10]"
              style={{ maxHeight: '82vh' }}
            >
              <img
                src={imgSrc}
                alt={currentAd.title || 'Advertisement'}
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  transform: isEntering ? 'scale(1.025)' : 'scale(1)',
                  transition: 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.06)_34%,rgba(2,6,23,0.62)_100%)] sm:bg-[linear-gradient(90deg,rgba(2,6,23,0.38)_0%,rgba(2,6,23,0.05)_58%,rgba(2,6,23,0.12)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 via-black/12 to-transparent sm:hidden" />
              {(currentAd.title || currentAd.description) && (
                <div className="absolute left-4 right-14 top-4 z-10 rounded-2xl bg-black/25 px-4 py-3 text-white shadow-[0_12px_35px_rgba(0,0,0,0.18)] ring-1 ring-white/20 backdrop-blur-[5px] sm:left-7 sm:right-auto sm:top-7 sm:max-w-[64%] sm:px-6 sm:py-5">
                  {currentAd.title && (
                    <h3 className="text-[19px] font-black leading-[1.05] text-white drop-shadow-sm sm:text-3xl">{currentAd.title}</h3>
                  )}
                  {currentAd.description && (
                    <p className="mt-2 max-w-[28ch] whitespace-pre-line text-[12px] font-semibold leading-relaxed text-white/90 sm:mt-2 sm:max-w-none sm:text-base">
                      {currentAd.description}
                    </p>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={currentAd.url ? handleClick : undefined}
                onMouseEnter={() => setButtonHovered(true)}
                onMouseLeave={() => setButtonHovered(false)}
                className={`absolute bottom-4 left-4 right-4 z-20 inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/80 bg-white/20 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-white shadow-[0_12px_32px_rgba(0,0,0,0.34)] backdrop-blur-md transition hover:bg-white hover:text-[#ef3f0a] sm:bottom-7 sm:left-auto sm:right-7 sm:min-h-0 sm:rounded-full sm:border-2 sm:bg-[#f05a21]/55 sm:px-7 sm:py-3 sm:text-lg sm:backdrop-blur-[2px] ${currentAd.url ? 'cursor-pointer' : 'cursor-default'}`}
                style={buttonStyle}
              >
                {buttonLabel}
              </button>
            </div>
          ) : (
            <div className="relative min-h-[420px] overflow-hidden px-8 py-12 text-center text-white sm:min-h-[560px] sm:px-16">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.32),transparent_30%),linear-gradient(180deg,#ff9a5d_0%,#ff4a12_68%,#ef3305_100%)]" />
              <div className="relative z-10 mx-auto flex h-full max-w-[760px] flex-col items-center justify-center gap-5">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/90">{currentAd.description || 'Тусгай санал'}</p>
                <h3 className="text-4xl font-black leading-none tracking-tight sm:text-7xl">{currentAd.title}</h3>
                {currentAd.url && (
                  <button
                    type="button"
                    onClick={handleClick}
                    onMouseEnter={() => setButtonHovered(true)}
                    onMouseLeave={() => setButtonHovered(false)}
                    className="mt-4 inline-flex items-center rounded-full border border-white/70 px-7 py-3 text-lg font-bold text-white transition hover:bg-white hover:text-[#ef3f0a]"
                    style={buttonStyle}
                  >
                    {buttonLabel}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
            <div
              className="h-full bg-white/80"
              style={{
                width: `${progress}%`,
                transition: 'width 0.05s linear',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
