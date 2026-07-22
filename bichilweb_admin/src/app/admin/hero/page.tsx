'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Input, Button, PageHeader } from '@/components/FormElements'
import Modal from '@/components/Modal'
import { PlusIcon, TrashIcon, PencilIcon, PhotoIcon, VideoCameraIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, DeviceTabletIcon, ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import axiosInstance from '@/app/config/axiosConfig'

/* ═══════════════════════════════════════════════════════════════════════════
   Safe Zone Overlay – Header-ийн бүсийг banner preview дээр харуулна
   ═══════════════════════════════════════════════════════════════════════════ */
function SafeZoneOverlay({ headerHeight, containerHeight, show, bannerHeight = 0, device = 'desktop' }: {
  headerHeight: number
  containerHeight: number
  show: boolean
  bannerHeight?: number
  device?: 'desktop' | 'tablet' | 'mobile'
}) {
  if (!show) return null

  // Бодит banner хэмжээ (viewport 100vh ≈ 900px desktop, 700 mobile)
  const realBannerH = bannerHeight > 0 ? bannerHeight : (device === 'mobile' ? 700 : 900)
  // Header нь fixed top-4 (16px) + inner height + border/padding (~2px+16px)
  const topGap = 16 // top-4 = 16px
  const headerPadding = 18 // border + padding дээд доод
  const totalHeaderZone = topGap + headerHeight + headerPadding
  // Header бүс %
  const headerPct = (totalHeaderZone / realBannerH) * 100

  // CTA/ticker бүс доод хэсэг (~60px)
  const ctaRealPx = 60
  const ctaPct = (ctaRealPx / realBannerH) * 100

  const safePct = 100 - headerPct - ctaPct
  const safePx = Math.round(realBannerH - totalHeaderZone - ctaRealPx)

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {/* Header danger zone - яг header-ийн бүсийг харуулна */}
      <div
        className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-500"
        style={{
          height: `${headerPct}%`,
          background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(239,68,68,0.08) 6px, rgba(239,68,68,0.08) 12px)',
          backgroundColor: 'rgba(239,68,68,0.12)',
        }}
      >
        {/* Header-ийн бодит бүтэц харуулах */}
        <div
          className="absolute left-1/2 -translate-x-1/2 border-2 border-dashed border-red-400/60 rounded-2xl"
          style={{
            top: `${(topGap / totalHeaderZone) * 100}%`,
            bottom: `${(2 / totalHeaderZone) * 100}%`,
            width: device === 'mobile' ? '92%' : '95%',
            maxWidth: device === 'desktop' ? '1240px' : undefined,
          }}
        >
          <div className="absolute inset-0 bg-red-500/5 rounded-2xl" />
        </div>
        <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
          <ShieldCheckIcon className="w-3 h-3" />
          HEADER ({totalHeaderZone}px = top:{topGap} + bar:{headerHeight} + pad:{headerPadding})
        </div>
      </div>
      {/* Safe zone label */}
      <div
        className="absolute left-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm"
        style={{ top: `calc(${headerPct}% + 6px)` }}
      >
        ✓ АЮУЛГҮЙ БҮС ({safePx}px)
      </div>
      {/* Bottom CTA/ticker zone */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-sky-500/6 border-t border-dashed border-sky-400/40"
        style={{ height: `${ctaPct}%` }}
      >
        <div className="absolute top-1 left-2 text-[10px] font-bold text-sky-700 bg-sky-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
          RATES TICKER ({ctaRealPx}px)
        </div>
      </div>
      {/* ── Right-side px ruler ── */}
      <div className="absolute top-0 right-8 h-full flex flex-col items-center" style={{ width: '30px' }}>
        {/* Header zone */}
        <div className="flex flex-col items-center" style={{ height: `${headerPct}%` }}>
          <div className="w-px bg-red-400 flex-1" />
          <div className="text-[8px] font-bold text-red-700 bg-red-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
            {totalHeaderZone}px
          </div>
          <div className="w-px bg-red-400 flex-1" />
        </div>
        {/* Safe zone */}
        <div className="flex flex-col items-center" style={{ height: `${safePct}%` }}>
          <div className="w-px bg-emerald-400 flex-1" />
          <div className="text-[8px] font-bold text-emerald-700 bg-emerald-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
            {safePx}px
          </div>
          <div className="w-px bg-emerald-400 flex-1" />
        </div>
        {/* CTA zone */}
        <div className="flex flex-col items-center" style={{ height: `${ctaPct}%` }}>
          <div className="w-px bg-sky-400 flex-1" />
          <div className="text-[8px] font-bold text-sky-700 bg-sky-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
            {ctaRealPx}px
          </div>
          <div className="w-px bg-sky-400 flex-1" />
        </div>
      </div>
      {/* Center guides */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400/15" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-400/15" />
    </div>
  )
}

interface HeroSlide {
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

type DeviceTab = 'desktop' | 'tablet' | 'mobile'

const normalizeMediaSrc = (src?: string | null) => {
  if (!src || src === 'null' || src === 'undefined') return ''
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('/')) {
    return src
  }
  return `/${src.replace(/^\/+/, '')}`
}

export default function HeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  const [previewDevice, setPreviewDevice] = useState<DeviceTab>('desktop')

  // ── Safe Zone state ──
  const [showSafeZone, setShowSafeZone] = useState(false)
  const [headerHeightDesktop, setHeaderHeightDesktop] = useState(80)
  const [headerHeightMobile, setHeaderHeightMobile] = useState(64)

  // Desktop fields
  const [mediaType, setMediaType] = useState<'i' | 'v'>('i')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [videoDuration, setVideoDuration] = useState<number>(0)

  // Tablet fields
  const [tabletMediaType, setTabletMediaType] = useState<'i' | 'v'>('i')
  const [tabletSelectedFile, setTabletSelectedFile] = useState<File | null>(null)
  const [tabletPreviewUrl, setTabletPreviewUrl] = useState<string>('')

  // Mobile fields
  const [mobileMediaType, setMobileMediaType] = useState<'i' | 'v'>('i')
  const [mobileSelectedFile, setMobileSelectedFile] = useState<File | null>(null)
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string>('')

  // Active device tab in modal
  const [activeDeviceTab, setActiveDeviceTab] = useState<DeviceTab>('desktop')

  // Upload progress
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [formData, setFormData] = useState({
    type: 'i' as 'i' | 'v',
    time: 5,
    index: 1,
    visible: true,
  })

  // Fetch header config for safe zone calculation
  useEffect(() => {
    const fetchHeader = async () => {
      try {
        const res = await axiosInstance.get('/headers/')
        const raw = res.data
        const header = Array.isArray(raw) ? raw[0] : raw?.results?.[0] || raw
        if (header?.styles && header.styles.length > 0) {
          const h = Number(header.styles[0].height) || 80
          const logoSize = Number(header.styles[0].logo_size) || 40
          setHeaderHeightDesktop(h)
          setHeaderHeightMobile(Math.min(h, 64)) // mobile header is typically shorter
        }
      } catch (e) {
        console.warn('Header config fetch failed for safe zone, using defaults')
      }
    }
    fetchHeader()
  }, [])

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/hero-slider/')
      const data = response.data
      setSlides(Array.isArray(data) ? data : (data?.results && Array.isArray(data.results) ? data.results : []))
    } catch (error) {
      console.error('Error fetching slides:', error)
      alert('Өгөгдөл татахад алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const activeSlides = [...slides].filter(s => s.visible).sort((a, b) => Number(a.index || 0) - Number(b.index || 0))
    if (activeSlides.length === 0) return

    const safeIndex = currentPreviewIndex % activeSlides.length
    const currentSlide = activeSlides[safeIndex]
    const timer = setTimeout(() => {
      setCurrentPreviewIndex((prev) => (prev + 1) % activeSlides.length)
    }, (currentSlide?.time || 5) * 1000)

    return () => clearTimeout(timer)
  }, [currentPreviewIndex, slides])

  const handleVideoLoad = (file: File) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      const duration = Math.round(video.duration)
      setVideoDuration(duration)
      setFormData(prev => ({ ...prev, time: duration }))
    }
    video.src = URL.createObjectURL(file)
  }

  const handleOpenCreate = () => {
    setEditingSlide(null)
    setActiveDeviceTab('desktop')
    setMediaType('i')
    setSelectedFile(null)
    setPreviewUrl('')
    setTabletMediaType('i')
    setTabletSelectedFile(null)
    setTabletPreviewUrl('')
    setMobileMediaType('i')
    setMobileSelectedFile(null)
    setMobilePreviewUrl('')
    setVideoDuration(0)
    const maxIndex = slides.length > 0 ? Math.max(...slides.map(s => s.index)) : 0
    setFormData({
      type: 'i',
      time: 5,
      index: maxIndex + 1,
      visible: true,
    })
    setModalOpen(true)
  }

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setActiveDeviceTab('desktop')
    // Desktop
    setMediaType(slide.type || 'i')
    setSelectedFile(null)
    setPreviewUrl(slide.file || '')
    // Tablet
    setTabletMediaType(slide.tablet_type || 'i')
    setTabletSelectedFile(null)
    setTabletPreviewUrl(slide.tablet_file || '')
    // Mobile
    setMobileMediaType(slide.mobile_type || 'i')
    setMobileSelectedFile(null)
    setMobilePreviewUrl(slide.mobile_file || '')

    setFormData({
      type: slide.type || 'i',
      time: slide.time,
      index: slide.index,
      visible: slide.visible,
    })
    setModalOpen(true)
  }

  const MAX_VIDEO_SIZE = 300 * 1024 * 1024 // 300MB

  const handleSave = async () => {
    if (!editingSlide && !selectedFile) {
      alert('Desktop зураг эсвэл бичлэг сонгоно уу')
      return
    }

    // Видео хэмжээ шалгах (100MB = ~2 минут)
    const allFiles = [selectedFile, tabletSelectedFile, mobileSelectedFile].filter(Boolean) as File[]
    for (const f of allFiles) {
      if (f.type.startsWith('video/') && f.size > MAX_VIDEO_SIZE) {
        alert(`"${f.name}" файл хэт том байна (${(f.size / (1024*1024)).toFixed(1)}MB).\nХамгийн ихдээ ${MAX_VIDEO_SIZE / (1024*1024)}MB видео хадгалах боломжтой.`)
        return
      }
    }

    try {
      setSaving(true)
      setUploadProgress(0)

      const payload = new FormData()
      payload.append('type', mediaType)
      payload.append('time', formData.time.toString())
      payload.append('index', formData.index.toString())
      payload.append('visible', formData.visible ? '1' : '0')
      payload.append('tablet_type', tabletMediaType)
      payload.append('mobile_type', mobileMediaType)

      if (selectedFile) {
        payload.append('file', selectedFile)
      }
      if (tabletSelectedFile) {
        payload.append('tablet_file', tabletSelectedFile)
      }
      if (mobileSelectedFile) {
        payload.append('mobile_file', mobileSelectedFile)
      }

      const axiosConfig = {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 минут (видео upload удаан байж болно)
        onUploadProgress: (progressEvent: any) => {
          const total = progressEvent.total || 1
          const pct = Math.round((progressEvent.loaded * 100) / total)
          // Upload 0-80%, серверт S3 руу хадгалах 80-100%
          setUploadProgress(Math.min(pct, 80))
        },
      }

      if (editingSlide) {
        await axiosInstance.put(`/hero-slider/${editingSlide.id}/`, payload, axiosConfig)
      } else {
        await axiosInstance.post('/hero-slider/', payload, axiosConfig)
      }

      setUploadProgress(100)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      await fetchSlides()
      setModalOpen(false)
    } catch (error: any) {
      console.error('Error:', error)
      const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error'
      if (isNetworkError) {
        alert('Сервер холболтын алдаа (Network Error).\n\n• Видео файл хэт том байж магадгүй — 100MB-с бага видео оруулна уу.\n• Серверийн холболт тасарсан байж магадгүй.\n• Дахин оролдоно уу.')
      } else {
        alert(`Алдаа: ${error.response?.data?.detail || error.message}`)
      }
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Устгах уу?')) return
    try {
      await axiosInstance.delete(`/hero-slider/${id}/`)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      await fetchSlides()
    } catch (error) {
      alert('Устгахад алдаа гарлаа')
    }
  }

  const getMediaUrl = (slide: HeroSlide, device: DeviceTab) => {
    if (device === 'tablet') return normalizeMediaSrc(slide.tablet_file_url || slide.file_url || slide.tablet_file || slide.file)
    if (device === 'mobile') return normalizeMediaSrc(slide.mobile_file_url || slide.file_url || slide.mobile_file || slide.file)
    return normalizeMediaSrc(slide.file_url || slide.file)
  }

  const getMediaType = (slide: HeroSlide, device: DeviceTab): 'i' | 'v' => {
    if (device === 'tablet' && slide.tablet_file) return slide.tablet_type || 'i'
    if (device === 'mobile' && slide.mobile_file) return slide.mobile_type || 'i'
    return slide.type
  }

  // Preview size classes for different devices — бүтэн хэмжээгээр харуулах
  const sortedSlides = [...slides].sort((a, b) => Number(a.index || 0) - Number(b.index || 0))
  const visibleSlides = sortedSlides.filter((slide) => Boolean(slide.visible))
  const safePreviewIndex = visibleSlides.length > 0 ? currentPreviewIndex % visibleSlides.length : 0

  const previewSizeClass = previewDevice === 'desktop'
    ? 'aspect-video w-full'
    : previewDevice === 'tablet'
      ? 'aspect-[1024/600] max-w-[900px] mx-auto'
      : 'aspect-[750/1000] max-w-[400px] mx-auto'

  if (loading) {
    return (
      <AdminLayout title="Hero Slider">
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </AdminLayout>
    )
  }

  const deviceTabs: { key: DeviceTab; label: string; icon: React.ReactNode }[] = [
    { key: 'desktop', label: 'Desktop', icon: <ComputerDesktopIcon className="h-5 w-5" /> },
    { key: 'tablet', label: 'Tablet', icon: <DeviceTabletIcon className="h-5 w-5" /> },
    { key: 'mobile', label: 'Гар утас', icon: <DevicePhoneMobileIcon className="h-5 w-5" /> },
  ]

  const renderMediaUpload = (
    device: DeviceTab,
    currentType: 'i' | 'v',
    setType: (t: 'i' | 'v') => void,
    currentFile: File | null,
    setFile: (f: File | null) => void,
    currentPreview: string,
    setPreview: (u: string) => void,
    isRequired: boolean
  ) => {
    const existingSrc = normalizeMediaSrc(
      editingSlide
        ? device === 'desktop'
          ? editingSlide.file_url || editingSlide.file
          : device === 'tablet'
            ? editingSlide.tablet_file_url || editingSlide.tablet_file || editingSlide.file_url || editingSlide.file
            : editingSlide.mobile_file_url || editingSlide.mobile_file || editingSlide.file_url || editingSlide.file
        : null
    )

    return (
      <div className="space-y-4">
        {/* Media type selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setType('i')
              setFile(null)
              setPreview('')
            }}
            className={`p-3 rounded-xl border-2 transition-all ${currentType === 'i' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <PhotoIcon className={`h-6 w-6 mx-auto mb-1 ${currentType === 'i' ? 'text-teal-600' : 'text-slate-400'}`} />
            <div className="text-xs font-medium">Зураг</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('v')
              setFile(null)
              setPreview('')
            }}
            className={`p-3 rounded-xl border-2 transition-all ${currentType === 'v' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <VideoCameraIcon className={`h-6 w-6 mx-auto mb-1 ${currentType === 'v' ? 'text-teal-600' : 'text-slate-400'}`} />
            <div className="text-xs font-medium">Бичлэг</div>
          </button>
        </div>

        {/* File input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {currentType === 'i' ? 'Зураг' : 'Бичлэг'}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
            {!isRequired && <span className="text-slate-400 text-xs ml-2">(заавал биш)</span>}
          </label>
          <input
            type="file"
            accept={currentType === 'i' ? 'image/*' : 'video/*'}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setFile(f)
                setPreview(URL.createObjectURL(f))
                if (currentType === 'v' && device === 'desktop') {
                  handleVideoLoad(f)
                }
              }
            }}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:cursor-pointer"
          />
        </div>

        {/* Preview */}
        {(currentPreview || (existingSrc && !currentFile)) && (
          <div className="rounded-lg overflow-hidden border border-slate-200">
            {currentType === 'i' ? (
              <img
                src={currentPreview || existingSrc || ''}
                alt="Preview"
                className="w-full h-auto object-cover max-h-48"
              />
            ) : (
              <video
                src={currentPreview || existingSrc || ''}
                controls
                className="w-full max-h-48"
              />
            )}
          </div>
        )}

        {!isRequired && !currentPreview && !existingSrc && (
          <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 text-center">
            Хоосон үлдээвэл Desktop-н зураг/бичлэг ашиглагдана
          </div>
        )}
      </div>
    )
  }

  return (
    <AdminLayout title="Hero Slider">
      <div className="max-w-6xl mx-auto">
        {saveSuccess && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-900">Амжилттай!</h4>
              <p className="text-xs text-emerald-700">Хадгалагдсан</p>
            </div>
          </div>
        )}

        <PageHeader
          title="Hero Slider"
          description="Нүүр хуудасны слайдер — Desktop, Tablet, Гар утасны хэмжээ тус бүрд зураг тохируулах"
          action={
            <Button variant="dark" onClick={handleOpenCreate}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Нэмэх
            </Button>
          }
        />
      </div>

        {/* Preview Section — full width */}
        {visibleSlides.length > 0 && (
          <div className="mb-6 overflow-hidden border-y border-slate-200">
            <div className="px-4 py-2.5 border-b flex items-center justify-between bg-white">
              <span className="text-xs font-semibold text-slate-600">PREVIEW</span>
              <div className="flex items-center gap-2">
                {/* Safe Zone Toggle */}
                <button
                  onClick={() => setShowSafeZone(!showSafeZone)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    showSafeZone
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheckIcon className="h-4 w-4" />
                  Safe Zone {showSafeZone ? 'ON' : 'OFF'}
                </button>
                <div className="w-px h-5 bg-slate-200" />
                {/* Device tabs */}
                {deviceTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setPreviewDevice(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      previewDevice === tab.key
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50">
              <div className={`relative overflow-hidden bg-black transition-all duration-500 ${previewSizeClass}`}>
                <SafeZoneOverlay
                  headerHeight={previewDevice === 'mobile' ? headerHeightMobile : headerHeightDesktop}
                  containerHeight={0}
                  show={showSafeZone}
                  device={previewDevice}
                />
                {visibleSlides.map((slide, idx) => {
                  const mediaUrl = getMediaUrl(slide, previewDevice)
                  const mediaT = getMediaType(slide, previewDevice)
                  return (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        idx === safePreviewIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {mediaUrl ? (
                        mediaT === 'i' ? (
                          <img
                            src={mediaUrl}
                            alt="Hero preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white">
                          No Media
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 text-white bg-black/30 px-3 py-1 rounded-full text-sm">
                        {idx + 1} / {visibleSlides.length}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      <div className="max-w-6xl mx-auto">
        {/* Slide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSlides.length > 0 && sortedSlides.map((slide) => (
            <div key={slide.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="relative aspect-[16/5] bg-black">
                <SafeZoneOverlay headerHeight={headerHeightDesktop} containerHeight={0} show={showSafeZone} device="desktop" />
                {slide.file ? (
                  slide.type === 'i' ? (
                    <img
                      src={normalizeMediaSrc(slide.file_url || slide.file)}
                      alt="Hero preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={normalizeMediaSrc(slide.file_url || slide.file)}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white">
                    No Media
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button onClick={() => handleEdit(slide)} className="p-2 bg-white rounded-lg shadow-sm hover:shadow">
                    <PencilIcon className="h-4 w-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(slide.id)} className="p-2 bg-white rounded-lg shadow-sm hover:shadow">
                    <TrashIcon className="h-4 w-4 text-red-600" />
                  </button>
                </div>
                {/* Device badges */}
                <div className="absolute bottom-2 left-2 flex gap-1.5">
                  <div className="p-1.5 bg-white/90 rounded-md" title="Desktop">
                    <ComputerDesktopIcon className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                  {slide.tablet_file && (
                    <div className="p-1.5 bg-white/90 rounded-md" title="Tablet">
                      <DeviceTabletIcon className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                  )}
                  {slide.mobile_file && (
                    <div className="p-1.5 bg-white/90 rounded-md" title="Mobile">
                      <DevicePhoneMobileIcon className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Эрэмбэ: {slide.index}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${slide.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    {slide.visible ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-3">
                  <span>Хугацаа: {slide.time}с</span>
                  <span className="text-xs text-slate-400">
                    {slide.tablet_file ? '✓ Tablet' : ''} {slide.mobile_file ? '✓ Mobile' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {slides.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <PhotoIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">Слайд байхгүй</p>
            <Button variant="dark" onClick={handleOpenCreate}>Нэмэх</Button>
          </div>
        )}

        {/* Safe Zone Guide Legend */}
        {showSafeZone && (
          <div className="mt-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-red-500" />
              Banner Safe Zone Guide
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                <div className="w-5 h-5 rounded bg-red-500/20 border-2 border-dashed border-red-400 shrink-0" />
                <span className="text-slate-700">Header бүс (top:16 + bar:{headerHeightDesktop} + pad:18 = {16 + headerHeightDesktop + 18}px)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50">
                <div className="w-5 h-5 rounded bg-emerald-500/20 border-2 border-emerald-400 shrink-0" />
                <span className="text-slate-700">Аюулгүй бүс — Гол контент</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-sky-50">
                <div className="w-5 h-5 rounded bg-sky-500/15 border-2 border-dashed border-sky-400 shrink-0" />
                <span className="text-slate-700">Rates Ticker (~60px) — Доод хэсэг</span>
              </div>
            </div>
            {/* Banner зургийн зөвлөмж хэмжээ */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <ComputerDesktopIcon className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-700">Desktop Banner</span>
                </div>
                <div className="text-xs text-indigo-600 space-y-0.5">
                  <p><strong>Зөвлөмж:</strong> 1920 × 600px</p>
                  <p><strong>Харьцаа:</strong> 16:5 (3.2:1)</p>
                  <p><strong>Файл:</strong> JPG/WebP, 300KB-аас бага</p>
                </div>
              </div>
              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <DeviceTabletIcon className="w-4 h-4 text-cyan-600" />
                  <span className="text-xs font-bold text-cyan-700">Tablet Banner</span>
                </div>
                <div className="text-xs text-cyan-600 space-y-0.5">
                  <p><strong>Зөвлөмж:</strong> 1024 × 600px</p>
                  <p><strong>Харьцаа:</strong> ~17:10 (1.7:1)</p>
                  <p><strong>Файл:</strong> JPG/WebP, 250KB-аас бага</p>
                </div>
              </div>
              <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <DevicePhoneMobileIcon className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-bold text-violet-700">Mobile Banner</span>
                </div>
                <div className="text-xs text-violet-600 space-y-0.5">
                  <p><strong>Зөвлөмж:</strong> 750 × 1000px</p>
                  <p><strong>Харьцаа:</strong> 3:4 (0.75:1)</p>
                  <p><strong>Файл:</strong> JPG/WebP, 200KB-аас бага</p>
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed">
              <p><strong>Header бүтэц:</strong> fixed top-4 (16px gap) + Header bar ({headerHeightDesktop}px) + padding/border (18px) = <strong>{16 + headerHeightDesktop + 18}px</strong> нийт даруулах бүс</p>
              <p className="mt-1"><strong>Banner:</strong> 100vh (desktop ~900px, mobile ~700px). Доод хэсэгт Rates Ticker (~60px)</p>
              <p className="mt-1"><strong>Зөвлөгөө:</strong> Чухал контент (нүүр царай, текст)-г улаан бүсээс доош байрлуулна уу.</p>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingSlide ? 'Засах' : 'Нэмэх'} size="lg">
        <div className="space-y-5">
          {/* ─── Идэвхжүүлэх Toggle (бүх дэлгэцэнд) ─── */}
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${formData.visible ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50'}`}>
            <div>
              <h4 className={`text-sm font-bold ${formData.visible ? 'text-teal-800' : 'text-slate-600'}`}>
                {formData.visible ? '✓ Бүх дэлгэцэнд идэвхтэй' : 'Идэвхгүй'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {formData.visible
                  ? 'Desktop, Tablet, Гар утас бүгдэд харагдана. Tablet/Mobile зураг заавал биш — Desktop зураг ашиглагдана.'
                  : 'Слайд нуугдсан байна — нүүр хуудсанд харагдахгүй.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input type="checkbox" checked={formData.visible} onChange={(e) => setFormData({ ...formData, visible: e.target.checked })} className="sr-only peer" />
              <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal-600 shadow-inner"></div>
            </label>
          </div>

          {/* Device Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {deviceTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveDeviceTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeDeviceTab === tab.key
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.key !== 'desktop' && (
                  <span className="text-[10px] text-slate-400">(заавал биш)</span>
                )}
              </button>
            ))}
          </div>

          {/* Desktop Media */}
          {activeDeviceTab === 'desktop' && renderMediaUpload(
            'desktop', mediaType,
            (t) => setMediaType(t),
            selectedFile,
            (f) => setSelectedFile(f),
            previewUrl,
            (u) => setPreviewUrl(u),
            true
          )}

          {/* Tablet Media */}
          {activeDeviceTab === 'tablet' && renderMediaUpload(
            'tablet', tabletMediaType,
            (t) => setTabletMediaType(t),
            tabletSelectedFile,
            (f) => setTabletSelectedFile(f),
            tabletPreviewUrl,
            (u) => setTabletPreviewUrl(u),
            false
          )}

          {/* Mobile Media */}
          {activeDeviceTab === 'mobile' && renderMediaUpload(
            'mobile', mobileMediaType,
            (t) => setMobileMediaType(t),
            mobileSelectedFile,
            (f) => setMobileSelectedFile(f),
            mobilePreviewUrl,
            (u) => setMobilePreviewUrl(u),
            false
          )}

          {/* Common Settings */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Ерөнхий тохиргоо</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Хугацаа (сек)</label>
                <Input type="number" value={formData.time} onChange={(e) => setFormData({ ...formData, time: +e.target.value })} min="1" />
                {videoDuration > 0 && <p className="text-xs text-blue-600 mt-1">Бичлэг хугацаа: {videoDuration}с</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Дараалал</label>
                <Input type="number" value={formData.index} onChange={(e) => setFormData({ ...formData, index: +e.target.value })} min="1" />
              </div>
            </div>
          </div>

          {/* Upload progress */}
          {saving && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">
                  {uploadProgress < 80 ? 'Файл илгээж байна...' : uploadProgress < 100 ? 'S3 дээр хадгалж байна (удаж магадгүй)...' : 'Амжилттай!'}
                </span>
                <span className="text-teal-700 font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${uploadProgress}%`,
                    background: uploadProgress < 100
                      ? 'linear-gradient(90deg, #0048BA, #00B2E7)'
                      : 'linear-gradient(90deg, #00B2E7, #4dc0ed)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <button onClick={() => setModalOpen(false)} disabled={saving} className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50">Буцах</button>
            <Button variant="dark" onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Хадгалж байна... {uploadProgress}%
                </span>
              ) : 'Хадгалах'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
