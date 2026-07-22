'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Input, Button, PageHeader } from '@/components/FormElements'
import Modal from '@/components/Modal'
import { PlusIcon, TrashIcon, PencilIcon, ShieldCheckIcon, ComputerDesktopIcon, DeviceTabletIcon, DevicePhoneMobileIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline'
import axiosInstance from '@/app/config/axiosConfig'

/* ═══════════════════════════════════════════════════════════════════════════
   CTA Text Safe Zone – Слайд тус бүрийн текст контентын бүсийг харуулна
   Дэлгэгдсэн (expanded) ба хураагдсан (collapsed) төлөв тусдаа
   ═══════════════════════════════════════════════════════════════════════════ */
function CTATextSafeZone({ isActive, show, hasNumber }: {
  isActive: boolean
  show: boolean
  hasNumber: boolean
}) {
  if (!show) return null

  // Reference: Expanded banner = 1920×800px, Collapsed = 400×800px
  const REF_H = 800
  const expTopPct = hasNumber ? 22 : 14
  const expBotPct = 45
  const colTopPct = hasNumber ? 25 : 16
  const expTopPx = Math.round(REF_H * expTopPct / 100)   // 176 or 112
  const expBotPx = Math.round(REF_H * expBotPct / 100)   // 360
  const expMidPx = REF_H - expTopPx - expBotPx            // 264 or 328
  const colTopPx = Math.round(REF_H * colTopPct / 100)   // 200 or 128
  const colBotPx = REF_H - colTopPx

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {isActive ? (
        /* ── Дэлгэгдсэн (Expanded) үе ── */
        <>
          {/* Гарчиг + Дугаар бүс (дээд) */}
          <div
            className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-violet-400"
            style={{
              height: `${expTopPct}%`,
              backgroundColor: 'rgba(139,92,246,0.10)',
            }}
          >
            <div className="absolute bottom-1.5 left-2 text-[10px] font-bold text-violet-700 bg-violet-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
              📝 ГАРЧИГ {hasNumber && '+ ДУГААР'}
            </div>
          </div>
          {/* Аюулгүй бүс (дунд) */}
          <div
            className="absolute left-2 text-[10px] font-bold text-emerald-700 bg-emerald-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm"
            style={{ top: `calc(${expTopPct}% + 6px)` }}
          >
            ✓ ЗУРГИЙН АЮУЛГҮЙ БҮС
          </div>
          {/* Тайлбар + Subtitle бүс (доод) */}
          <div className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-sky-400" style={{ height: `${expBotPct}%`, backgroundColor: 'rgba(14,165,233,0.08)' }}>
            <div className="absolute top-1.5 left-2 text-[10px] font-bold text-sky-700 bg-sky-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
              📋 ТАЙЛБАР + SUBTITLE
            </div>
          </div>
          {/* ── Right-side px measurement ruler ── */}
          <div className="absolute top-0 right-1.5 lg:right-3 h-full flex flex-col items-center" style={{ width: '28px' }}>
            {/* Top zone height */}
            <div className="flex flex-col items-center" style={{ height: `${expTopPct}%` }}>
              <div className="w-px bg-violet-400 flex-1" />
              <div className="text-[8px] font-bold text-violet-700 bg-violet-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
                {expTopPx}px
              </div>
              <div className="w-px bg-violet-400 flex-1" />
            </div>
            {/* Middle zone height */}
            <div className="flex flex-col items-center" style={{ height: `${100 - expTopPct - expBotPct}%` }}>
              <div className="w-px bg-emerald-400 flex-1" />
              <div className="text-[8px] font-bold text-emerald-700 bg-emerald-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
                {expMidPx}px
              </div>
              <div className="w-px bg-emerald-400 flex-1" />
            </div>
            {/* Bottom zone height */}
            <div className="flex flex-col items-center" style={{ height: `${expBotPct}%` }}>
              <div className="w-px bg-sky-400 flex-1" />
              <div className="text-[8px] font-bold text-sky-700 bg-sky-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
                {expBotPx}px
              </div>
              <div className="w-px bg-sky-400 flex-1" />
            </div>
          </div>
          {/* Padding guides */}
          <div className="absolute top-0 bottom-0 left-0 w-6 lg:w-8 border-r border-dotted border-white/20" />
          <div className="absolute top-0 bottom-0 right-8 lg:right-10 w-px border-l border-dotted border-white/20" />
        </>
      ) : (
        /* ── Хураагдсан (Collapsed) үе ── */
        <>
          {/* Дугаар + Гарчиг бүс (дээд хэсэг) */}
          <div
            className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-amber-400"
            style={{
              height: `${colTopPct}%`,
              backgroundColor: 'rgba(245,158,11,0.10)',
            }}
          >
            <div className="absolute bottom-1.5 left-1 right-6 text-[9px] font-bold text-amber-700 bg-amber-50/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm text-center truncate">
              📝 ГАРЧИГ
            </div>
          </div>
          {/* Аюулгүй зургийн бүс */}
          <div
            className="absolute left-1 text-[8px] font-bold text-emerald-700 bg-emerald-50/95 backdrop-blur-sm px-1 py-0.5 rounded shadow-sm"
            style={{ top: `calc(${colTopPct}% + 4px)` }}
          >
            ✓ ЗУРАГ
          </div>
          {/* ── Right-side px ruler (collapsed) ── */}
          <div className="absolute top-0 right-0.5 h-full flex flex-col items-center" style={{ width: '22px' }}>
            <div className="flex flex-col items-center" style={{ height: `${colTopPct}%` }}>
              <div className="w-px bg-amber-400 flex-1" />
              <div className="text-[7px] font-bold text-amber-700 bg-amber-50/95 px-0.5 py-px rounded shadow-sm whitespace-nowrap my-px">
                {colTopPx}px
              </div>
              <div className="w-px bg-amber-400 flex-1" />
            </div>
            <div className="flex flex-col items-center" style={{ height: `${100 - colTopPct}%` }}>
              <div className="w-px bg-emerald-400 flex-1" />
              <div className="text-[7px] font-bold text-emerald-700 bg-emerald-50/95 px-0.5 py-px rounded shadow-sm whitespace-nowrap my-px">
                {colBotPx}px
              </div>
              <div className="w-px bg-emerald-400 flex-1" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Constants
const API_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'

const LANGUAGE_IDS = {
  EN: 1,
  MN: 2,
} as const

const DEFAULT_FONT = ''
const DEFAULT_COLOR = '#ffffff'
const SUCCESS_MESSAGE_DURATION = 3000

const FONT_OPTIONS = [
  { value: '', label: 'Default', family: 'inherit', weight: 400 },
  { value: 'Montserrat-Bold', label: 'Montserrat Bold', family: "'Montserrat', sans-serif", weight: 700 },
  { value: 'Montserrat-Regular', label: 'Montserrat Regular', family: "'Montserrat', sans-serif", weight: 400 },
  { value: 'Montserrat-Black', label: 'Montserrat Black', family: "'Montserrat', sans-serif", weight: 900 },
  { value: 'OpenSans-ExtraBold', label: 'Open Sans Extra Bold', family: "'Open Sans', sans-serif", weight: 800 },
  { value: 'OpenSans-Regular', label: 'Open Sans Regular', family: "'Open Sans', sans-serif", weight: 400 },
  { value: 'Poppins-Bold', label: 'Poppins Bold', family: "'Poppins', sans-serif", weight: 700 },
  { value: 'Poppins-Regular', label: 'Poppins Regular', family: "'Poppins', sans-serif", weight: 400 },
]

function getFontStyle(fontValue: string): React.CSSProperties {
  const opt = FONT_OPTIONS.find(f => f.value === fontValue)
  if (!opt || !opt.value) return {}
  return { fontFamily: opt.family, fontWeight: opt.weight }
}

// Types
interface CTASlide {
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
  titles: Array<{
    id: number
    language: number
    label: string
  }>
  subtitles: Array<{
    id: number
    language: number
    label: string
  }>
}

interface SubtitlePair {
  mn: string
  en: string
}

interface FormData {
  number: string
  title_mn: string
  title_en: string
  subtitlePairs: SubtitlePair[]
  description: string
  descriptionPosition: string
  descriptionAlign: string
  url: string
  font: string
  descriptionFont: string
  subtitleFont: string
  textColor: string
  index: number
}

function normalizeCtaSlides(raw: unknown): CTASlide[] {
  const items: CTASlide[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { results?: unknown }).results)
      ? (raw as { results: CTASlide[] }).results
      : []

  return [...items].sort((a, b) => Number(a.index || 0) - Number(b.index || 0))
}

export default function CTAPage() {
  // State
  const [slides, setSlides] = useState<CTASlide[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<CTASlide | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [previewLang, setPreviewLang] = useState<'mn' | 'en'>('mn')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedCollapsedFile, setSelectedCollapsedFile] = useState<File | null>(null)
  const [collapsedPreviewUrl, setCollapsedPreviewUrl] = useState<string>('')
  const [selectedMobileExpandedFile, setSelectedMobileExpandedFile] = useState<File | null>(null)
  const [mobileExpandedPreviewUrl, setMobileExpandedPreviewUrl] = useState<string>('')
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({})

  // ── Safe Zone state ──
  const [showSafeZone, setShowSafeZone] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  const [formData, setFormData] = useState<FormData>({
    number: '01',
    title_mn: '',
    title_en: '',
    subtitlePairs: [{ mn: '', en: '' }],
    description: '',
    url: '',
    font: DEFAULT_FONT,
    descriptionFont: DEFAULT_FONT,
    subtitleFont: DEFAULT_FONT,
    textColor: DEFAULT_COLOR,
    index: 1,
    descriptionPosition: 'top',
    descriptionAlign: 'left',
  })

  // Cleanup preview URLs on unmount or when they change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      if (collapsedPreviewUrl && collapsedPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(collapsedPreviewUrl)
      }
      if (mobileExpandedPreviewUrl && mobileExpandedPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mobileExpandedPreviewUrl)
      }
    }
  }, [previewUrl, collapsedPreviewUrl, mobileExpandedPreviewUrl])

  const getTitle = useCallback((slide: CTASlide, lang: 'mn' | 'en') => {
    const languageId = lang === 'mn' ? LANGUAGE_IDS.MN : LANGUAGE_IDS.EN
    return slide.titles.find(t => t.language === languageId)?.label || ''
  }, [])

  const getSubtitle = useCallback((slide: CTASlide, lang: 'mn' | 'en') => {
    const languageId = lang === 'mn' ? LANGUAGE_IDS.MN : LANGUAGE_IDS.EN
    return slide.subtitles.filter(s => s.language === languageId).map(s => s.label).join(', ')
  }, [])

  const getSubtitlesList = useCallback((slide: CTASlide, lang: 'mn' | 'en') => {
    const languageId = lang === 'mn' ? LANGUAGE_IDS.MN : LANGUAGE_IDS.EN
    return slide.subtitles.filter(s => s.language === languageId)
  }, [])

  // Image URL resolvers (matching frontend logic)
  const resolveImageUrl = useCallback((fileUrl: string | null | undefined, fileFallback: string | null | undefined): string => {
    const url = fileUrl || fileFallback
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `${API_BASE_URL}${url}`
    return `${API_BASE_URL}/${url}`
  }, [])

  const getExpandedImageUrl = useCallback((slide: CTASlide): string => {
    return resolveImageUrl(slide.file_url, slide.file)
  }, [resolveImageUrl])

  const getCollapsedImageUrl = useCallback((slide: CTASlide): string => {
    if (slide.collapsed_file_url || slide.collapsed_file) {
      return resolveImageUrl(slide.collapsed_file_url, slide.collapsed_file)
    }
    return getExpandedImageUrl(slide)
  }, [resolveImageUrl, getExpandedImageUrl])

  const getMobileExpandedImageUrl = useCallback((slide: CTASlide): string => {
    if (slide.mobile_expanded_file_url || slide.mobile_expanded_file) {
      return resolveImageUrl(slide.mobile_expanded_file_url, slide.mobile_expanded_file)
    }
    return getExpandedImageUrl(slide)
  }, [resolveImageUrl, getExpandedImageUrl])

  // Fetch slides from backend using axiosInstance
  const fetchSlides = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axiosInstance.get('/CTA/')
      
      const raw = response.data
      const slidesData = normalizeCtaSlides(raw)
      setSlides(slidesData)
      setHoveredIndex((current) => {
        if (slidesData.length === 0) return null
        return current !== null && current >= 0 && current < slidesData.length ? current : 0
      })
      
      // Initialize image loading states
      const loadingStates: { [key: number]: boolean } = {}
      slidesData.forEach((slide: CTASlide) => {
        loadingStates[slide.id] = true
      })
      setImageLoading(loadingStates)
      
    } catch (err: any) {
      console.error('Backend-ээс татахад алдаа:', err)
      const message = err.response?.data?.message || err.message || 'Өгөгдөл татахад алдаа гарлаа'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  // Image selection handler
  const handleImageSelect = useCallback((file: File) => {
    // Revoke previous preview URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [previewUrl])

  // Form validation
  const validateForm = useCallback((): string | null => {
    if (!selectedFile && !editingSlide) {
      return 'Зураг сонгоно уу'
    }
    
    if (!formData.title_mn.trim() && !formData.title_en.trim()) {
      return 'Хамгийн багадаа нэг хэл дээр гарчиг оруулна уу'
    }
    
    if (formData.index < 1) {
      return 'Эрэмбэ 1-ээс их байх ёстой'
    }
    
    if (!formData.number.trim()) {
      return 'Дугаар оруулна уу'
    }
    
    return null
  }, [selectedFile, editingSlide, formData])

  // Reset form
  const resetForm = useCallback(() => {
    const maxIndex = slides.length > 0 ? Math.max(...slides.map(s => s.index)) : 0
    
    setFormData({
      number: `0${slides.length + 1}`,
      title_mn: '',
      title_en: '',
      subtitlePairs: [{ mn: '', en: '' }],
      description: '',
      descriptionPosition: 'top',
      descriptionAlign: 'left',
      url: '',
      font: DEFAULT_FONT,
      descriptionFont: DEFAULT_FONT,
      subtitleFont: DEFAULT_FONT,
      textColor: DEFAULT_COLOR,
      index: maxIndex + 1,
    })
    
    setSelectedFile(null)
    
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl('')

    setSelectedCollapsedFile(null)
    if (collapsedPreviewUrl && collapsedPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(collapsedPreviewUrl)
    }
    setCollapsedPreviewUrl('')

    setSelectedMobileExpandedFile(null)
    if (mobileExpandedPreviewUrl && mobileExpandedPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mobileExpandedPreviewUrl)
    }
    setMobileExpandedPreviewUrl('')
  }, [slides.length, previewUrl, collapsedPreviewUrl, mobileExpandedPreviewUrl])

  // Modal handlers
  const handleOpenCreate = useCallback(() => {
    setError(null)
    setEditingSlide(null)
    resetForm()
    setModalOpen(true)
  }, [resetForm])

  const handleOpenEdit = useCallback((slide: CTASlide) => {
    setError(null)
    setEditingSlide(slide)
    setSelectedFile(null)
    setSelectedCollapsedFile(null)
    setSelectedMobileExpandedFile(null)
    
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(slide.file_url?.startsWith('http') ? slide.file_url : `${API_BASE_URL}${slide.file_url}`)

    if (collapsedPreviewUrl && collapsedPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(collapsedPreviewUrl)
    }
    setCollapsedPreviewUrl(
      slide.collapsed_file_url
        ? (slide.collapsed_file_url.startsWith('http') ? slide.collapsed_file_url : `${API_BASE_URL}${slide.collapsed_file_url}`)
        : ''
    )

    if (mobileExpandedPreviewUrl && mobileExpandedPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mobileExpandedPreviewUrl)
    }
    setMobileExpandedPreviewUrl(
      slide.mobile_expanded_file_url
        ? (slide.mobile_expanded_file_url.startsWith('http') ? slide.mobile_expanded_file_url : `${API_BASE_URL}${slide.mobile_expanded_file_url}`)
        : ''
    )
    
    // Parse subtitles into pairs
    const mnSubs = slide.subtitles.filter(s => s.language === LANGUAGE_IDS.MN)
    const enSubs = slide.subtitles.filter(s => s.language === LANGUAGE_IDS.EN)
    const pairCount = Math.max(mnSubs.length, enSubs.length, 1)
    const pairs: SubtitlePair[] = []
    for (let i = 0; i < pairCount; i++) {
      pairs.push({
        mn: mnSubs[i]?.label || '',
        en: enSubs[i]?.label || '',
      })
    }
    
    setFormData({
      number: slide.number,
      title_mn: getTitle(slide, 'mn'),
      title_en: getTitle(slide, 'en'),
      subtitlePairs: pairs,
      description: slide.description || '',
      descriptionPosition: slide.description_position || 'top',
      descriptionAlign: slide.description_align || 'left',
      url: slide.url || '',
      font: slide.font || '',
      descriptionFont: slide.description_font || '',
      subtitleFont: slide.subtitle_font || '',
      textColor: slide.color,
      index: slide.index,
    })
    
    setModalOpen(true)
  }, [getTitle, previewUrl, collapsedPreviewUrl, mobileExpandedPreviewUrl])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setEditingSlide(null)
    setSelectedFile(null)
    setSelectedCollapsedFile(null)
    setSelectedMobileExpandedFile(null)
    setError(null)
    
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl('')
    if (collapsedPreviewUrl && collapsedPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(collapsedPreviewUrl)
    }
    setCollapsedPreviewUrl('')
    if (mobileExpandedPreviewUrl && mobileExpandedPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mobileExpandedPreviewUrl)
    }
    setMobileExpandedPreviewUrl('')
  }, [previewUrl, collapsedPreviewUrl, mobileExpandedPreviewUrl])

  // Create slide using axiosInstance
  const createSlide = useCallback(async () => {
    if (!selectedFile) {
      setError('Зураг сонгоно уу')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = new FormData()
      payload.append('file', selectedFile)
      if (selectedCollapsedFile) {
        payload.append('collapsed_file', selectedCollapsedFile)
      }
      if (selectedMobileExpandedFile) {
        payload.append('mobile_expanded_file', selectedMobileExpandedFile)
      }
      payload.append('number', formData.number)
      payload.append('index', formData.index.toString())
      payload.append('font', formData.font)
      payload.append('description_font', formData.descriptionFont)
      payload.append('subtitle_font', formData.subtitleFont)
      payload.append('color', formData.textColor)
      payload.append('description', formData.description)
      payload.append('description_position', formData.descriptionPosition)
      payload.append('description_align', formData.descriptionAlign)
      payload.append('url', formData.url)

      const titles = [
        { language: LANGUAGE_IDS.EN, label: formData.title_en || '' },
        { language: LANGUAGE_IDS.MN, label: formData.title_mn || '' },
      ]
      payload.append('titles', JSON.stringify(titles))

      // Build subtitles array from pairs
      const subtitles: Array<{ language: number; label: string }> = []
      formData.subtitlePairs.forEach(pair => {
        if (pair.mn.trim()) subtitles.push({ language: LANGUAGE_IDS.MN, label: pair.mn })
        if (pair.en.trim()) subtitles.push({ language: LANGUAGE_IDS.EN, label: pair.en })
      })
      payload.append('subtitles', JSON.stringify(subtitles))

      const response = await axiosInstance.post('/CTA/', payload, {
        headers: {
          'Content-Type': undefined,
        },
      })

      await fetchSlides()
      setSuccess('Слайд амжилттай нэмэгдлээ!')
      handleCloseModal()
      
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Слайд үүсгэхэд алдаа гарлаа'
      setError(typeof message === 'string' ? message : JSON.stringify(message))
      console.error('Create error:', err.response?.data || err)
    } finally {
      setSaving(false)
    }
  }, [selectedFile, selectedCollapsedFile, selectedMobileExpandedFile, formData, fetchSlides, handleCloseModal])

  // Update slide using axiosInstance
  const updateSlide = useCallback(async () => {
    if (!editingSlide) return

    try {
      setSaving(true)
      setError(null)

      const payload = new FormData()

      if (selectedFile) {
        payload.append('file', selectedFile)
      }

      if (selectedCollapsedFile) {
        payload.append('collapsed_file', selectedCollapsedFile)
      }
      if (selectedMobileExpandedFile) {
        payload.append('mobile_expanded_file', selectedMobileExpandedFile)
      }

      payload.append('number', formData.number)
      payload.append('index', formData.index.toString())
      payload.append('font', formData.font)
      payload.append('description_font', formData.descriptionFont)
      payload.append('subtitle_font', formData.subtitleFont)
      payload.append('color', formData.textColor)
      payload.append('description', formData.description)
      payload.append('description_position', formData.descriptionPosition)
      payload.append('description_align', formData.descriptionAlign)
      payload.append('url', formData.url)

      const titles = [
        { language: LANGUAGE_IDS.EN, label: formData.title_en || '' },
        { language: LANGUAGE_IDS.MN, label: formData.title_mn || '' },
      ]
      payload.append('titles', JSON.stringify(titles))

      // Build subtitles array from pairs
      const subtitles: Array<{ language: number; label: string }> = []
      formData.subtitlePairs.forEach(pair => {
        if (pair.mn.trim()) subtitles.push({ language: LANGUAGE_IDS.MN, label: pair.mn })
        if (pair.en.trim()) subtitles.push({ language: LANGUAGE_IDS.EN, label: pair.en })
      })
      payload.append('subtitles', JSON.stringify(subtitles))

      const response = await axiosInstance.put(`/CTA/${editingSlide.id}/`, payload, {
        headers: {
          'Content-Type': undefined,
        },
      })

      await fetchSlides()
      setSuccess('Слайд амжилттай засагдлаа!')
      handleCloseModal()
      
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Слайд засахад алдаа гарлаа'
      setError(message)
      console.error('Update error:', err)
    } finally {
      setSaving(false)
    }
  }, [editingSlide, selectedFile, selectedCollapsedFile, selectedMobileExpandedFile, formData, fetchSlides, handleCloseModal])

  // Save handler
  const handleSave = useCallback(() => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (editingSlide) {
      updateSlide()
    } else {
      createSlide()
    }
  }, [validateForm, editingSlide, updateSlide, createSlide])

  // Delete slide using axiosInstance
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Энэ слайдыг устгах уу?')) return

    try {
      setError(null)
      
      await axiosInstance.delete(`/CTA/${id}/`)

      await fetchSlides()
      setSuccess('Слайд амжилттай устгагдлаа!')
      
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Слайд устгахад алдаа гарлаа'
      setError(message)
      console.error('Delete error:', err)
    }
  }, [fetchSlides])

  // Keyboard shortcut for closing modal (ESC)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        handleCloseModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [modalOpen, handleCloseModal])

  const sortedSlides = normalizeCtaSlides(slides)

  return (
    <AdminLayout title="CTA Slider">
      <div className="max-w-6xl mx-auto">
        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-emerald-900">Амжилттай!</h4>
              <p className="text-xs text-emerald-700">{success}</p>
            </div>
            <button 
              onClick={() => setSuccess(null)} 
              className="text-emerald-600 hover:text-emerald-800"
              aria-label="Хаах"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900">Алдаа!</h4>
              <p className="text-xs text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-red-600 hover:text-red-800"
              aria-label="Хаах"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Page Header */}
        <PageHeader
          title="CTA Accordion Slider"
          description="Нүүр хуудасны интерактив слайдер"
          action={
            <Button onClick={handleOpenCreate} disabled={saving || loading}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Шинэ слайд
            </Button>
          }
        />

        {/* Live Preview */}
        {slides.length > 0 && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50">
            <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-600 uppercase">Live Preview</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Safe Zone Toggle */}
                <button
                  onClick={() => setShowSafeZone(!showSafeZone)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    showSafeZone
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  Safe Zone {showSafeZone ? 'ON' : 'OFF'}
                </button>
                <div className="w-px h-5 bg-slate-200" />
                {/* Device tabs */}
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    previewDevice === 'desktop'
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <ComputerDesktopIcon className="h-4 w-4" />
                  Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    previewDevice === 'mobile'
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                  Mobile
                </button>
                <div className="w-px h-5 bg-slate-200" />
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                  <button
                    onClick={() => setPreviewLang('mn')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      previewLang === 'mn' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    aria-label="Монгол хэл"
                  >
                    MN
                  </button>
                  <button
                    onClick={() => setPreviewLang('en')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      previewLang === 'en' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    aria-label="Англи хэл"
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Desktop Accordion Preview */}
              {previewDevice === 'desktop' && (
              <div className="relative hidden sm:flex gap-3 lg:gap-4 h-[350px] sm:h-[500px] lg:h-[550px]">
                {sortedSlides
                  .map((slide, index) => {
                    const isActive = hoveredIndex === index
                    const title = getTitle(slide, previewLang)
                    const subtitles = getSubtitlesList(slide, previewLang)
                    const expandedImageUrl = getExpandedImageUrl(slide)
                    const collapsedImageUrl = getCollapsedImageUrl(slide)

                    return (
                      <div
                        key={slide.id}
                        className="group relative overflow-hidden rounded-2xl cursor-pointer"
                        style={{
                          flex: isActive ? 3.5 : 1,
                          transition: 'flex 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                          minWidth: 0,
                        }}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => {/* keep last hovered active */}}
                      >
                        {/* Expanded background image */}
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-all duration-[1.2s] ease-out"
                          style={{
                            backgroundImage: expandedImageUrl
                              ? `url('${expandedImageUrl}')`
                              : 'linear-gradient(135deg, #0048BA, #1e3a5f)',
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
                              : 'linear-gradient(135deg, #0048BA, #1e3a5f)',
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

                        {/* Per-slide text safe zone */}
                        <CTATextSafeZone
                          isActive={isActive}
                          show={showSafeZone}
                          hasNumber={false}
                        />

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col justify-between p-6 lg:p-8 z-10">
                          {/* Top-left: Title */}
                          <div className="relative">

                            <h3
                              className="font-bold leading-tight"
                              style={{
                                fontFamily: slide.font || 'inherit',
                                color: slide.color && slide.color !== '#' ? slide.color : '#fff',
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
                            {/* Collapsed title */}
                            {!isActive && (
                              <h3
                                className="font-bold leading-tight absolute"
                                style={{
                                  fontFamily: slide.font || 'inherit',
                                  color: slide.color && slide.color !== '#' ? slide.color : '#fff',
                                  fontSize: '0.95rem',
                                  opacity: isActive ? 0 : 0.85,
                                  transform: isActive ? 'translateY(8px)' : 'translateY(0)',
                                  transition: 'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
                                  top: '0',
                                }}
                              >
                                {title}
                              </h3>
                            )}
                          </div>

                          {/* Bottom: Subtitles + Description */}
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
                              {/* Description */}
                              {slide.description && (
                                <p
                                  className="text-[14px] text-white/80 leading-[1.7] mb-4 tracking-wide"
                                  style={{
                                    opacity: isActive ? 1 : 0,
                                    transform: isActive ? 'translateY(0)' : 'translateY(10px)',
                                    transition: isActive
                                      ? 'opacity 0.5s ease 0.25s, transform 0.5s ease 0.25s'
                                      : 'opacity 0.2s ease, transform 0.2s ease',
                                  }}
                                >
                                  {slide.description}
                                </p>
                              )}

                              {subtitles.length > 0 && (
                                <ul className="space-y-2">
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
                                      <span>{sub.label}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {/* URL indicator */}
                              {slide.url && (
                                <div
                                  className="mt-4 flex items-center gap-2 text-xs text-[#0048BA]/90"
                                  style={{
                                    opacity: isActive ? 1 : 0,
                                    transform: isActive ? 'translateY(0)' : 'translateY(8px)',
                                    transition: isActive
                                      ? 'opacity 0.4s ease 0.45s, transform 0.4s ease 0.45s'
                                      : 'opacity 0.2s ease, transform 0.2s ease',
                                  }}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  <span>Дэлгэрэнгүй</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
              )}

              {/* Mobile Preview */}
              {previewDevice === 'mobile' && (
              <div className="max-w-[320px] mx-auto space-y-4">
                {sortedSlides
                  .map((slide, index) => {
                    const title = getTitle(slide, previewLang)
                    const subtitles = getSubtitlesList(slide, previewLang)
                    const mobileImageUrl = getMobileExpandedImageUrl(slide)
                    const isActive = hoveredIndex === index

                    return (
                      <div
                        key={slide.id}
                        className="relative overflow-hidden rounded-2xl cursor-pointer"
                        style={{ height: isActive ? '420px' : '80px', transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        onClick={() => setHoveredIndex(isActive ? null : index)}
                      >
                        {/* Background */}
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{
                            backgroundImage: mobileImageUrl
                              ? `url('${mobileImageUrl}')`
                              : 'linear-gradient(135deg, #0048BA, #1e3a5f)',
                            filter: isActive ? 'none' : 'brightness(0.6) grayscale(0.3)',
                            transition: 'filter 0.5s ease',
                          }}
                        />
                        {/* Gradient overlay */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: isActive
                              ? 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 35%, transparent 50%, rgba(0,0,0,0.8) 100%)'
                              : 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.5) 100%)',
                          }}
                        />
                        {/* Safe Zone */}
                        <CTATextSafeZone
                          isActive={isActive}
                          show={showSafeZone}
                          hasNumber={false}
                        />
                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
                          <div>
                            <h3
                              className="font-bold text-white"
                              style={{
                                fontFamily: slide.font || 'inherit',
                                color: slide.color && slide.color !== '#' ? slide.color : '#fff',
                                fontSize: isActive ? '1.25rem' : '0.85rem',
                                transition: 'font-size 0.4s ease',
                              }}
                            >
                              {title}
                            </h3>
                          </div>
                          {isActive && (
                            <div>
                              {slide.description && (
                                <p className="text-xs text-white/80 mb-2 leading-relaxed">{slide.description}</p>
                              )}
                              {subtitles.length > 0 && (
                                <ul className="space-y-1">
                                  {subtitles.map((sub) => (
                                    <li key={sub.id} className="flex items-start gap-2 text-xs text-white/85">
                                      <span className="mt-0.5 w-4 h-4 rounded-full bg-[#0048BA]/20 flex items-center justify-center shrink-0">
                                        <svg className="w-2.5 h-2.5 text-[#0048BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </span>
                                      <span>{sub.label}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {slide.url && (
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-[#0048BA]/90">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  <span>Дэлгэрэнгүй</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
              )}
            </div>
          </div>
        )}

        {/* Slides Grid */}
        {slides.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedSlides
              .map((slide) => (
                <div key={slide.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-slate-50 px-4 py-2 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-white rounded-full text-sm font-bold">
                        {slide.number}
                      </span>
                      <span className="text-sm text-slate-500">Эрэмбэ: {slide.index}</span>
                    </div>
                  </div>

                  <div className="relative h-48">
                    {imageLoading[slide.id] && getExpandedImageUrl(slide) && (
                      <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    
                    {getExpandedImageUrl(slide) ? (
                      <img
                        src={getExpandedImageUrl(slide)}
                        alt={getTitle(slide, 'mn') || 'Slide image'}
                        className="h-full w-full object-cover"
                        onLoad={() => setImageLoading(prev => ({ ...prev, [slide.id]: false }))}
                        onError={() => setImageLoading(prev => ({ ...prev, [slide.id]: false }))}
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-200 flex items-center justify-center text-sm text-slate-500">
                        Зураг олдсонгүй
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(slide)}
                        className="p-2 bg-white rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                        aria-label="Слайд засах"
                      >
                        <PencilIcon className="h-4 w-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(slide.id)}
                        className="p-2 bg-white rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                        aria-label="Слайд устгах"
                      >
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">
                        {slide.font}
                      </span>
                      <div
                        className="w-6 h-6 rounded-full border-2 border-slate-200"
                        style={{ backgroundColor: slide.color }}
                        title={`Өнгө: ${slide.color}`}
                      />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                      {getTitle(slide, 'mn')}
                    </h3>
                    <p className="text-sm text-slate-600 mb-1 line-clamp-2">
                      {getSubtitle(slide, 'mn')}
                    </p>
                    {slide.description && (
                      <p className="text-xs text-slate-500 mb-1 line-clamp-2">
                        📝 {slide.description}
                      </p>
                    )}
                    {slide.url && (
                      <p className="text-xs text-blue-500 mb-1 line-clamp-1">
                        🔗 {slide.url}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 italic line-clamp-1">
                      {getTitle(slide, 'en')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Empty State */}
        {slides.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Слайд байхгүй</h3>
            <p className="text-sm text-slate-500 mb-4">Эхний слайдаа нэмнэ үү</p>
            <Button onClick={handleOpenCreate}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Слайд нэмэх
            </Button>
          </div>
        )}

        {/* Safe Zone Guide Legend */}
        {showSafeZone && (
          <div className="mt-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-violet-500" />
              CTA Текст Safe Zone Guide
            </h3>

            {/* Дэлгэгдсэн / Хураагдсан тайлбар */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Дэлгэгдсэн (Expanded) */}
              <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
                <h4 className="text-xs font-bold text-violet-800 mb-2 flex items-center gap-1.5">
                  <ComputerDesktopIcon className="w-4 h-4" />
                  Дэлгэгдсэн үе (Expanded)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-violet-500/15 border-2 border-dashed border-violet-400 shrink-0" />
                    <span className="text-slate-700">📝 Гарчиг + Дугаар бүс — Дээд ~22%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-500/20 border-2 border-emerald-400 shrink-0" />
                    <span className="text-slate-700">✓ Зургийн аюулгүй бүс — Дунд хэсэг</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-sky-500/15 border-2 border-dashed border-sky-400 shrink-0" />
                    <span className="text-slate-700">📋 Тайлбар + Subtitle — Доод ~45%</span>
                  </div>
                </div>
              </div>
              {/* Хураагдсан (Collapsed) */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                  <DeviceTabletIcon className="w-4 h-4" />
                  Хураагдсан үе (Collapsed)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-amber-500/15 border-2 border-dashed border-amber-400 shrink-0" />
                    <span className="text-slate-700">📝 Гарчиг бүс — Дээд ~25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-500/20 border-2 border-emerald-400 shrink-0" />
                    <span className="text-slate-700">✓ Зургийн аюулгүй бүс — Үлдсэн хэсэг</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner зургийн зөвлөмж хэмжээ — слайдерт багтах зургийн харьцаа */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <ComputerDesktopIcon className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-700">Desktop — Дэлгэгдсэн</span>
                </div>
                <div className="text-xs text-indigo-600 space-y-0.5">
                  <p><strong>Зөвлөмж:</strong> 1920 × 800px</p>
                  <p><strong>Слайд харьцаа:</strong> ~2.4 : 1 (өргөн)</p>
                  <p><strong>Файл:</strong> JPG/WebP, ≤300KB</p>
                </div>
                <div className="mt-1.5 w-full rounded overflow-hidden border border-indigo-200" style={{ aspectRatio: '1920/800' }}>
                  <div className="w-full h-full bg-indigo-200/40 flex items-center justify-center text-[9px] font-bold text-indigo-500">1920×800</div>
                </div>
              </div>
              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <ComputerDesktopIcon className="w-4 h-4 text-cyan-600" />
                  <span className="text-xs font-bold text-cyan-700">Desktop — Хураагдсан</span>
                </div>
                <div className="text-xs text-cyan-600 space-y-0.5">
                  <p><strong>Зөвлөмж:</strong> 400 × 800px</p>
                  <p><strong>Слайд харьцаа:</strong> 1 : 2 (босоо)</p>
                  <p><strong>Файл:</strong> JPG/WebP, ≤200KB</p>
                </div>
                <div className="mt-1.5 rounded overflow-hidden border border-cyan-200 mx-auto" style={{ aspectRatio: '400/800', width: '50%' }}>
                  <div className="w-full h-full bg-cyan-200/40 flex items-center justify-center text-[9px] font-bold text-cyan-500">400×800</div>
                </div>
              </div>
              <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <DevicePhoneMobileIcon className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-bold text-violet-700">Mobile — Дэлгэгдсэн</span>
                </div>
                <div className="text-xs text-violet-600 space-y-0.5">
                  <p><strong>Зөвлөмж:</strong> 750 × 1000px</p>
                  <p><strong>Слайд харьцаа:</strong> 3 : 4 (босоо)</p>
                  <p><strong>Файл:</strong> JPG/WebP, ≤200KB</p>
                </div>
                <div className="mt-1.5 rounded overflow-hidden border border-violet-200 mx-auto" style={{ aspectRatio: '750/1000', width: '60%' }}>
                  <div className="w-full h-full bg-violet-200/40 flex items-center justify-center text-[9px] font-bold text-violet-500">750×1000</div>
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed">
              <p><strong>Зөвлөгөө:</strong> Слайд hover хийхэд дэлгэгдсэн үеийн бүс харагдана. Чухал зургийн контентыг текст бүсээс гадна байрлуулна уу.</p>
              <p className="mt-1">Дэлгэгдсэн/хумигдсан зураг 2-уулаа оруулбал хураагдсан үед тусдаа зураг харагдана.</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Уншиж байна...</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingSlide ? 'Слайд засах' : 'Шинэ слайд нэмэх'}
      >
        <div className="space-y-4">
          {/* Image Upload - Desktop Expanded (main image) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              🖥️ Дэлгэгдсэн зураг (Desktop) {editingSlide && '(шинэ зураг сонговол солигдоно)'}
              {!editingSlide && <span className="text-red-500">*</span>}
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-teal-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      setError('Зургийн хэмжээ 5MB-аас бага байх ёстой')
                      return
                    }
                    handleImageSelect(file)
                  }
                }}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100 file:cursor-pointer cursor-pointer"
                aria-label="Дэлгэгдсэн зураг сонгох"
              />
              <p className="text-xs text-slate-500 mt-2">
                PNG, JPG, GIF форматтай, 5MB хүртэл
              </p>
            </div>
            {previewUrl && (
              <div className="mt-3 relative h-48 rounded-lg overflow-hidden border">
                <img
                  src={previewUrl} 
                  alt="Preview" 
                  className="h-full w-full object-cover" 
                />
              </div>
            )}
          </div>

          {/* Collapsed Image Upload - Desktop */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              🖥️ Эвхэгдсэн зураг (Desktop) {editingSlide && '(шинэ зураг сонговол солигдоно)'}
            </label>
            <p className="text-xs text-slate-500 mb-2">Эвхэгдсэн (хураагдсан) үед харуулах зураг</p>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError('Зургийн хэмжээ 5MB-аас бага байх ёстой')
                      return
                    }
                    if (collapsedPreviewUrl && collapsedPreviewUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(collapsedPreviewUrl)
                    }
                    setSelectedCollapsedFile(file)
                    setCollapsedPreviewUrl(URL.createObjectURL(file))
                  }
                }}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                aria-label="Эвхэгдсэн зураг сонгох"
              />
              <p className="text-xs text-slate-500 mt-2">
                PNG, JPG, GIF форматтай, 5MB хүртэл
              </p>
            </div>
            {collapsedPreviewUrl && (
              <div className="mt-3 relative h-48 rounded-lg overflow-hidden border">
                <img
                  src={collapsedPreviewUrl} 
                  alt="Collapsed Preview" 
                  className="h-full w-full object-cover" 
                />
              </div>
            )}
          </div>

          {/* Mobile Expanded Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              📱 Дэлгэгдсэн зураг (Гар утас)  {editingSlide && '(шинэ зураг сонговол солигдоно)'}
            </label>
            <p className="text-xs text-slate-500 mb-2">Гар утас дээр дэлгэгдсэн үед харуулах зураг. Эвхэгдсэн үед зураг байхгүй — шилэн тунгалаг байна.</p>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError('Зургийн хэмжээ 5MB-аас бага байх ёстой')
                      return
                    }
                    if (mobileExpandedPreviewUrl && mobileExpandedPreviewUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(mobileExpandedPreviewUrl)
                    }
                    setSelectedMobileExpandedFile(file)
                    setMobileExpandedPreviewUrl(URL.createObjectURL(file))
                  }
                }}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 file:font-medium hover:file:bg-purple-100 file:cursor-pointer cursor-pointer"
                aria-label="Гар утасны зураг сонгох"
              />
              <p className="text-xs text-slate-500 mt-2">
                PNG, JPG, GIF форматтай, 5MB хүртэл
              </p>
            </div>
            {mobileExpandedPreviewUrl && (
              <div className="mt-3 relative h-48 rounded-lg overflow-hidden border">
                <img
                  src={mobileExpandedPreviewUrl} 
                  alt="Mobile Expanded Preview" 
                  className="h-full w-full object-cover" 
                />
              </div>
            )}
          </div>

          {/* Number Input */}
          <Input
            label="Дугаар"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            placeholder="01"
            required
          />

          {/* Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Гарчиг (Монгол)"
              value={formData.title_mn}
              onChange={(e) => setFormData({ ...formData, title_mn: e.target.value })}
              placeholder="Монгол гарчиг"
            />
            <Input
              label="Гарчиг (English)"
              value={formData.title_en}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              placeholder="English title"
            />
          </div>

          {/* Swap button for Subtitles <-> Description */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, descriptionPosition: formData.descriptionPosition === 'top' ? 'bottom' : 'top' })}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
            >
              <ArrowsUpDownIcon className="h-4 w-4" />
              Байр солих: {formData.descriptionPosition === 'top' ? 'Талбар дээр → Дэд гарчиг доор' : 'Дэд гарчиг дээр → Талбар доор'}
            </button>
          </div>

          {/* Subtitles - Dynamic */}
          {(() => {
            const subtitlesBlock = (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Дэд гарчигууд
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, subtitlePairs: [...formData.subtitlePairs, { mn: '', en: '' }] })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Нэмэх
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.subtitlePairs.map((pair, idx) => (
                    <div key={idx} className="relative border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">#{idx + 1}</span>
                        {formData.subtitlePairs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPairs = formData.subtitlePairs.filter((_, i) => i !== idx)
                              setFormData({ ...formData, subtitlePairs: newPairs })
                            }}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Устгах"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={pair.mn}
                          onChange={(e) => {
                            const newPairs = [...formData.subtitlePairs]
                            newPairs[idx] = { ...newPairs[idx], mn: e.target.value }
                            setFormData({ ...formData, subtitlePairs: newPairs })
                          }}
                          placeholder="Монгол дэд гарчиг"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          value={pair.en}
                          onChange={(e) => {
                            const newPairs = [...formData.subtitlePairs]
                            newPairs[idx] = { ...newPairs[idx], en: e.target.value }
                            setFormData({ ...formData, subtitlePairs: newPairs })
                          }}
                          placeholder="English subtitle"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )

            const descriptionBlock = (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Талбар (Тайлбар)
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                    {[
                      { value: 'left', icon: (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M3 6h18M3 12h12M3 18h16" strokeLinecap="round" />
                        </svg>
                      ), title: 'Зүүн' },
                      { value: 'center', icon: (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M3 6h18M6 12h12M4 18h16" strokeLinecap="round" />
                        </svg>
                      ), title: 'Голлуулах' },
                      { value: 'right', icon: (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M3 6h18M9 12h12M5 18h16" strokeLinecap="round" />
                        </svg>
                      ), title: 'Баруун' },
                      { value: 'justify', icon: (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                        </svg>
                      ), title: 'Тэгшлэх' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, descriptionAlign: opt.value })}
                        className={`p-1.5 rounded-md transition-all ${
                          formData.descriptionAlign === opt.value
                            ? 'bg-white shadow-sm text-teal-700'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={opt.title}
                      >
                        {opt.icon}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Нэмэлт тайлбар текст..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                  rows={3}
                  style={{ textAlign: formData.descriptionAlign as any }}
                />
              </div>
            )

            return formData.descriptionPosition === 'top'
              ? <>{descriptionBlock}{subtitlesBlock}</>
              : <>{subtitlesBlock}{descriptionBlock}</>
          })()}

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              URL (Холбоос)
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/page"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Слайд дээр дарахад энэ хуудас руу үсрэнэ</p>
          </div>

          {/* Fonts per field */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Фонт тохиргоо</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Гарчиг фонт</label>
                <select
                  value={formData.font}
                  onChange={(e) => setFormData({ ...formData, font: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  aria-label="Гарчиг фонт"
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.family, fontWeight: f.weight }}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {formData.font && (
                  <p className="text-xs text-slate-500 mt-1" style={getFontStyle(formData.font)}>Жишээ текст</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Тайлбар фонт</label>
                <select
                  value={formData.descriptionFont}
                  onChange={(e) => setFormData({ ...formData, descriptionFont: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  aria-label="Тайлбар фонт"
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.family, fontWeight: f.weight }}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {formData.descriptionFont && (
                  <p className="text-xs text-slate-500 mt-1" style={getFontStyle(formData.descriptionFont)}>Жишээ текст</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Дэд гарчиг фонт</label>
                <select
                  value={formData.subtitleFont}
                  onChange={(e) => setFormData({ ...formData, subtitleFont: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  aria-label="Дэд гарчиг фонт"
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.family, fontWeight: f.weight }}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {formData.subtitleFont && (
                  <p className="text-xs text-slate-500 mt-1" style={getFontStyle(formData.subtitleFont)}>Жишээ текст</p>
                )}
              </div>
            </div>
          </div>

          {/* Color, Index */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Текстийн өнгө
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer"
                  aria-label="Өнгө сонгох"
                />
                <input
                  type="text"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="#ffffff"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
            
            <Input
              label="Эрэмбэ"
              type="number"
              min="1"
              value={formData.index.toString()}
              onChange={(e) => setFormData({ ...formData, index: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          {/* Modal Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              disabled={saving}
            >
              Болих
            </button>
            <Button variant="dark" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Хадгалж байна...
                </>
              ) : (
                'Хадгалах'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
