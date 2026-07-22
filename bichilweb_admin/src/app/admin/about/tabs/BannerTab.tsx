'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon, ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/Modal'
import ImageUpload from '@/components/ImageUpload'
import { Input } from '@/components/FormElements'
import { axiosInstance } from '@/lib/axios'
import { FontSelect } from '@/lib/fontOptions'

/* ── Types ─────────────────────────────────────────────────────────── */

interface BannerTranslation {
  id?: number
  language: number
  language_code?: string
  title: string
  subtitle: string
  fontfamily?: string
}

interface BannerAPI {
  id: number
  page: number
  image: string
  mobile_image: string
  sort_order: number
  active: boolean
  translations: BannerTranslation[]
}

interface BannerFormData {
  image: string
  mobile_image: string
  title_mn: string
  title_en: string
  subtitle_mn: string
  subtitle_en: string
  sort_order: number
  fontfamily: string
}

const emptyForm: BannerFormData = {
  image: '',
  mobile_image: '',
  title_mn: '',
  title_en: '',
  subtitle_mn: '',
  subtitle_en: '',
  sort_order: 0,
  fontfamily: '',
}

const getTr = (translations: BannerTranslation[], langId: number) =>
  translations.find(t => t.language === langId)

/* ── Component ─────────────────────────────────────────────────────── */

export default function BannerTab() {
  const [banners, setBanners] = useState<BannerAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<BannerFormData>({ ...emptyForm })
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [lang, setLang] = useState<'mn' | 'en'>('mn')
  const [pageId, setPageId] = useState<number | null>(null)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [showSafeZone, setShowSafeZone] = useState(false)

  // Frontend dimensions (from about/page.tsx):
  // Desktop: h-[calc(600px+6rem)] = 696px, -mt-24 (96px header overlap), pb-20 (80px bottom pad)
  // Mobile: h-[calc(520px+5rem)] = 600px, -mt-20 (80px header overlap)
  const DESKTOP_H = 696
  const MOBILE_H = 600
  const HEADER_DESKTOP = 96
  const HEADER_MOBILE = 80
  const BOTTOM_PAD = 80 // pb-20

  const toRatio = (w: number, h: number) => {
    if (w === 0 || h === 0) return '–'
    const r = w / h
    return r >= 1 ? `${r.toFixed(1)}:1` : `1:${(1 / r).toFixed(1)}`
  }

  const langId = lang === 'mn' ? 1 : 2

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true)
      // Эхлээд about page-ийн ID-г олно
      const extractArr = (raw: any) => Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      let pid = pageId
      if (!pid) {
        const pagesRes = await axiosInstance.get('/about-page/')
        const pages = extractArr(pagesRes.data)
        const introPage = pages.find((p: any) => p.key === 'intro')
        if (introPage) {
          pid = introPage.id
          setPageId(pid)
        } else {
          // About page үүсээгүй бол шинээр үүсгэнэ
          const createRes = await axiosInstance.post('/about-page/', { key: 'intro', active: true, sections: [], media: [] })
          pid = createRes.data.id
          setPageId(pid)
        }
      }
      const res = await axiosInstance.get(`/about-banner/?page=${pid}`)
      setBanners(extractArr(res.data))
    } catch {
      setErrorMsg('Баннер татахад алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ ...emptyForm, sort_order: banners.length })
    setModalOpen(true)
  }

  const openEditModal = (banner: BannerAPI) => {
    setEditingId(banner.id)
    const mn = getTr(banner.translations, 1)
    const en = getTr(banner.translations, 2)
    setFormData({
      image: banner.image || '',
      mobile_image: banner.mobile_image || '',
      title_mn: mn?.title || '',
      title_en: en?.title || '',
      subtitle_mn: mn?.subtitle || '',
      subtitle_en: en?.subtitle || '',
      sort_order: banner.sort_order,
      fontfamily: mn?.fontfamily || en?.fontfamily || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.image) {
      setErrorMsg('Зураг оруулна уу')
      return
    }
    setIsSaving(true)
    setErrorMsg('')
    try {
      const payload = {
        page: pageId,
        image: formData.image,
        mobile_image: formData.mobile_image,
        sort_order: formData.sort_order,
        active: true,
        translations: [
          { language: 1, title: formData.title_mn, subtitle: formData.subtitle_mn, fontfamily: formData.fontfamily },
          { language: 2, title: formData.title_en, subtitle: formData.subtitle_en, fontfamily: formData.fontfamily },
        ],
      }
      if (editingId) {
        await axiosInstance.put(`/about-banner/${editingId}/`, payload)
        setSuccessMsg('Баннер амжилттай шинэчлэгдлээ')
      } else {
        await axiosInstance.post('/about-banner/', payload)
        setSuccessMsg('Баннер амжилттай нэмэгдлээ')
      }
      setModalOpen(false)
      await fetchBanners()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Хадгалахад алдаа гарлаа')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Энэ баннерыг устгах уу?')) return
    try {
      await axiosInstance.delete(`/about-banner/${id}/`)
      setSuccessMsg('Баннер устгагдлаа')
      await fetchBanners()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Устгахад алдаа гарлаа')
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setFormData({ ...emptyForm })
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-2 underline">×</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Бидний тухай - Баннер зураг</h2>
            <p className="text-sm text-slate-500 mt-1">Бидний тухай хуудасны дээд хэсгийн баннер зургийг удирдах</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              {(['mn', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors text-sm ${
                    lang === l ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button onClick={openAddModal}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm">
              <PlusIcon className="w-5 h-5" />
              Баннер нэмэх
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Ачаалж байна...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="py-16 text-center text-gray-400 border-2 border-dashed border-slate-200 rounded-xl">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">Баннер зураг байхгүй</p>
            <p className="text-xs mt-1">Шинэ баннер нэмэхийн тулд дээрх товчийг дарна уу</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {banners.map((banner) => {
              const tr = getTr(banner.translations, langId)
              return (
                <div key={banner.id} className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-teal-300 transition-colors">
                  <div className="relative h-48 bg-gray-100">
                    {banner.image ? (
                      <Image src={banner.image} alt={tr?.title || 'Banner'} fill className="object-cover" 
                        onError={(e) => { (e.target as HTMLImageElement).src = '/img/placeholder.png' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Overlay with title */}
                    {(tr?.title || tr?.subtitle) && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                        <div className="text-white">
                          {tr?.title && <h3 className="font-bold text-lg">{tr.title}</h3>}
                          {tr?.subtitle && <p className="text-sm opacity-80">{tr.subtitle}</p>}
                        </div>
                      </div>
                    )}
                    {/* Action buttons */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(banner)}
                        className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors" title="Засварлах">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(banner.id)}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors" title="Устгах">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between bg-white">
                    <span className="text-sm text-slate-600">Дараалал: {banner.sort_order}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${banner.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {banner.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══════════ Live Preview ══════════ */}
      {banners.length > 0 && banners.some(b => b.image) && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50">
          {/* Preview header bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Урьдчилан харах (Frontend яг адилхан)
            </h3>
            <div className="flex items-center gap-2">
              {/* Safe Zone toggle */}
              <button
                onClick={() => setShowSafeZone(!showSafeZone)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showSafeZone
                    ? 'bg-violet-100 text-violet-700 border border-violet-300'
                    : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <ShieldCheckIcon className="h-4 w-4" />
                Safe Zone {showSafeZone ? 'ON' : 'OFF'}
              </button>
              <div className="w-px h-5 bg-slate-200" />
              {/* Language tabs */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  onClick={() => setLang('mn')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    lang === 'mn' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >MN</button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    lang === 'en' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >EN</button>
              </div>
              <div className="w-px h-5 bg-slate-200" />
              {/* Device tabs */}
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
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
            </div>
          </div>

          {/* Preview content */}
          <div className="p-4 sm:p-6">
            {(() => {
              const activeBanner = banners.find(b => b.image)
              if (!activeBanner) return null
              const tr = getTr(activeBanner.translations, langId)
              const bannerH = previewDevice === 'desktop' ? DESKTOP_H : MOBILE_H
              const headerH = previewDevice === 'desktop' ? HEADER_DESKTOP : HEADER_MOBILE
              const safeH = bannerH - headerH
              const imgSrc = previewDevice === 'mobile' && activeBanner.mobile_image
                ? activeBanner.mobile_image
                : activeBanner.image

              return previewDevice === 'desktop' ? (
                /* ── Desktop Preview ── */
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="relative w-full overflow-hidden" style={{ height: `${DESKTOP_H}px` }}>
                    <Image
                      src={imgSrc}
                      alt="Banner Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* Gradient overlay (matches frontend) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Faux header bar */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[1240px]">
                      <div className="bg-white/80 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center justify-between shadow-sm border border-white/40">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">G</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-800">Globus</span>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-16 h-2 rounded bg-slate-200" />
                          <div className="w-16 h-2 rounded bg-slate-200" />
                          <div className="w-16 h-2 rounded bg-slate-200" />
                          <div className="w-16 h-2 rounded bg-slate-200" />
                        </div>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded bg-slate-100" />
                          <div className="w-6 h-6 rounded bg-slate-100" />
                        </div>
                      </div>
                    </div>

                    {/* Title/subtitle overlay at bottom center (matches frontend) */}
                    <div className="absolute bottom-20 left-0 right-0 z-10 text-center text-white px-4">
                      {tr?.title && (
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight drop-shadow-lg">{tr.title}</h1>
                      )}
                      {tr?.subtitle && (
                        <p className="text-lg opacity-90 max-w-2xl mx-auto">{tr.subtitle}</p>
                      )}
                    </div>

                    {/* ── Safe Zone Overlay ── */}
                    {showSafeZone && (
                      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                        {/* Header danger zone */}
                        <div
                          className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-500"
                          style={{
                            height: `${headerH}px`,
                            background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(239,68,68,0.08) 6px, rgba(239,68,68,0.08) 12px)',
                            backgroundColor: 'rgba(239,68,68,0.12)',
                          }}
                        >
                          <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
                            <ShieldCheckIcon className="w-3 h-3" />
                            HEADER БҮС ({headerH}px)
                          </div>
                        </div>
                        {/* Safe zone label */}
                        <div
                          className="absolute left-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm"
                          style={{ top: `${headerH + 6}px` }}
                        >
                          ✓ АЮУЛГҮЙ БҮС ({safeH}px)
                        </div>
                        {/* Bottom text zone */}
                        <div
                          className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-violet-400"
                          style={{ height: `${BOTTOM_PAD}px`, backgroundColor: 'rgba(139,92,246,0.10)' }}
                        >
                          <div className="absolute top-1.5 left-2 text-[10px] font-bold text-violet-700 bg-violet-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
                            📝 ТЕКСТ БҮС ({BOTTOM_PAD}px)
                          </div>
                        </div>
                        {/* Dimension badge */}
                        <div className="absolute top-1.5 right-10 z-40 text-[9px] font-bold text-slate-700 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm border border-slate-200">
                          📐 1920 × {DESKTOP_H}px
                        </div>
                        {/* Right px ruler */}
                        <div className="absolute top-0 right-2 h-full flex flex-col items-center" style={{ width: '30px' }}>
                          <div className="flex flex-col items-center" style={{ height: `${headerH}px` }}>
                            <div className="w-px bg-red-400 flex-1" />
                            <div className="text-[8px] font-bold text-red-700 bg-red-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
                              {headerH}px
                            </div>
                            <div className="w-px bg-red-400 flex-1" />
                          </div>
                          <div className="flex flex-col items-center" style={{ height: `${safeH - BOTTOM_PAD}px` }}>
                            <div className="w-px bg-emerald-400 flex-1" />
                            <div className="text-[8px] font-bold text-emerald-700 bg-emerald-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
                              {safeH - BOTTOM_PAD}px
                            </div>
                            <div className="w-px bg-emerald-400 flex-1" />
                          </div>
                          <div className="flex flex-col items-center" style={{ height: `${BOTTOM_PAD}px` }}>
                            <div className="w-px bg-violet-400 flex-1" />
                            <div className="text-[8px] font-bold text-violet-700 bg-violet-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
                              {BOTTOM_PAD}px
                            </div>
                            <div className="w-px bg-violet-400 flex-1" />
                          </div>
                        </div>
                        {/* Center guides */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400/15" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Mobile Preview ── */
                <div className="max-w-[375px] mx-auto">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="relative w-full overflow-hidden" style={{ height: `${MOBILE_H}px` }}>
                      <Image
                        src={imgSrc}
                        alt="Banner Preview Mobile"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      {/* Mobile faux header */}
                      <div className="absolute top-3 left-3 right-3">
                        <div className="bg-white/80 backdrop-blur-md rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm border border-white/40">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
                              <span className="text-white text-[8px] font-bold">G</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-800">Globus</span>
                          </div>
                          <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
                            <div className="space-y-0.5">
                              <div className="w-3 h-px bg-slate-400" />
                              <div className="w-3 h-px bg-slate-400" />
                              <div className="w-3 h-px bg-slate-400" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Title/subtitle (centered bottom) */}
                      <div className="absolute bottom-16 left-0 right-0 z-10 text-center text-white px-4">
                        {tr?.title && (
                          <h1 className="text-2xl font-bold mb-2 tracking-tight drop-shadow-lg">{tr.title}</h1>
                        )}
                        {tr?.subtitle && (
                          <p className="text-sm opacity-90 max-w-xs mx-auto">{tr.subtitle}</p>
                        )}
                      </div>

                      {/* ── Safe Zone Overlay (mobile) ── */}
                      {showSafeZone && (
                        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                          <div
                            className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-500"
                            style={{
                              height: `${headerH}px`,
                              background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(239,68,68,0.08) 6px, rgba(239,68,68,0.08) 12px)',
                              backgroundColor: 'rgba(239,68,68,0.12)',
                            }}
                          >
                            <div className="absolute bottom-1 left-2 flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-50/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm">
                              <ShieldCheckIcon className="w-3 h-3" />
                              HEADER ({headerH}px)
                            </div>
                          </div>
                          <div
                            className="absolute left-2 flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50/95 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm"
                            style={{ top: `${headerH + 4}px` }}
                          >
                            ✓ АЮУЛГҮЙ ({safeH}px)
                          </div>
                          <div
                            className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-violet-400"
                            style={{ height: `${BOTTOM_PAD}px`, backgroundColor: 'rgba(139,92,246,0.10)' }}
                          >
                            <div className="absolute top-1 left-2 text-[9px] font-bold text-violet-700 bg-violet-50/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm">
                              📝 ТЕКСТ ({BOTTOM_PAD}px)
                            </div>
                          </div>
                          <div className="absolute top-1 right-7 z-40 text-[7px] font-bold text-slate-700 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm border border-slate-200">
                            📐 375 × {MOBILE_H}px
                          </div>
                          {/* px ruler */}
                          <div className="absolute top-0 right-1 h-full flex flex-col items-center" style={{ width: '24px' }}>
                            <div className="flex flex-col items-center" style={{ height: `${headerH}px` }}>
                              <div className="w-px bg-red-400 flex-1" />
                              <div className="text-[7px] font-bold text-red-700 bg-red-50/95 px-0.5 py-px rounded shadow-sm whitespace-nowrap my-px">{headerH}px</div>
                              <div className="w-px bg-red-400 flex-1" />
                            </div>
                            <div className="flex flex-col items-center" style={{ height: `${safeH - BOTTOM_PAD}px` }}>
                              <div className="w-px bg-emerald-400 flex-1" />
                              <div className="text-[7px] font-bold text-emerald-700 bg-emerald-50/95 px-0.5 py-px rounded shadow-sm whitespace-nowrap my-px">{safeH - BOTTOM_PAD}px</div>
                              <div className="w-px bg-emerald-400 flex-1" />
                            </div>
                            <div className="flex flex-col items-center" style={{ height: `${BOTTOM_PAD}px` }}>
                              <div className="w-px bg-violet-400 flex-1" />
                              <div className="text-[7px] font-bold text-violet-700 bg-violet-50/95 px-0.5 py-px rounded shadow-sm whitespace-nowrap my-px">{BOTTOM_PAD}px</div>
                              <div className="w-px bg-violet-400 flex-1" />
                            </div>
                          </div>
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400/15" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Safe Zone Legend */}
          {showSafeZone && (
            <div className="mx-4 sm:mx-6 mb-4 sm:mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-violet-500" />
                Бидний тухай баннер Safe Zone Guide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Zone legend */}
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="text-xs font-bold text-red-800 mb-2">Бүсүүдийн хэмжээ (px)</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded shrink-0" style={{
                        background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(239,68,68,0.15) 3px, rgba(239,68,68,0.15) 6px)',
                        backgroundColor: 'rgba(239,68,68,0.12)',
                        border: '2px dashed #ef4444'
                      }} />
                      <span className="text-slate-700">Header — Desktop: <b>{HEADER_DESKTOP}px</b>, Mobile: <b>{HEADER_MOBILE}px</b></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-emerald-500/20 border-2 border-emerald-400 shrink-0" />
                      <span className="text-slate-700">Аюулгүй — Desktop: <b>{DESKTOP_H - HEADER_DESKTOP - BOTTOM_PAD}px</b>, Mobile: <b>{MOBILE_H - HEADER_MOBILE - BOTTOM_PAD}px</b></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-violet-500/15 border-2 border-dashed border-violet-400 shrink-0" />
                      <span className="text-slate-700">Текст бүс (доод) — <b>{BOTTOM_PAD}px</b></span>
                    </div>
                  </div>
                </div>
                {/* Recommended sizes */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-800 mb-2">📐 Зөвлөмж зургийн хэмжээ</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-14 h-8 rounded border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
                        <span className="text-[7px] font-bold text-blue-600">1920×696</span>
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-blue-800">Desktop: 1920 × {DESKTOP_H}px</p>
                        <p className="text-blue-600/80">Харьцаа: {toRatio(1920, DESKTOP_H)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-8 h-10 rounded border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
                        <span className="text-[6px] font-bold text-blue-600">750×812</span>
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-blue-800">Mobile: 750 × 812px</p>
                        <p className="text-blue-600/80">Харьцаа: {toRatio(750, 812)}</p>
                        <p className="text-blue-500/70 text-[10px]">Нүүр хуудасны banner-тэй адил (50vh)</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Tips */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Зөвлөгөө</h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• Дээд {HEADER_DESKTOP}px-д чухал контент бүү байрлуул</li>
                    <li>• Header тунгалаг тул зураг харагдана</li>
                    <li>• Доод {BOTTOM_PAD}px-д гарчиг, дэд гарчиг гарна</li>
                    <li>• Энэ харьцаатай зураг оруулбал яг таарна</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Banner Edit/Add Modal */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingId ? 'Баннер засварлах' : 'Баннер нэмэх'}>
        <div className="space-y-6">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  Зураг (Дэлгэц) *
                </span>
              </label>
              <ImageUpload onChange={(url) => setFormData({ ...formData, image: url })} value={formData.image} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Гар утасны зураг (сонгон)
                </span>
                <span className="text-xs text-slate-400 ml-1">• Оруулаагүй бол дэлгэцийн зургийг ашиглана</span>
              </label>
              <ImageUpload onChange={(url) => setFormData({ ...formData, mobile_image: url })} value={formData.mobile_image} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Гарчиг (Монгол)</label>
                <Input value={formData.title_mn} onChange={(e) => setFormData({ ...formData, title_mn: e.target.value })} placeholder="Монгол гарчиг" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title (English)</label>
                <Input value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value })} placeholder="English title" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Дэд гарчиг (Монгол)</label>
                <Input value={formData.subtitle_mn} onChange={(e) => setFormData({ ...formData, subtitle_mn: e.target.value })} placeholder="Дэд гарчиг" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subtitle (English)</label>
                <Input value={formData.subtitle_en} onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })} placeholder="Subtitle" />
              </div>
            </div>

            <div className="w-32">
              <label className="block text-xs font-medium text-slate-600 mb-1">Дараалал</label>
              <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
            </div>

            {/* Banner Text Font */}
            <FontSelect
              value={formData.fontfamily}
              onChange={(v) => setFormData({ ...formData, fontfamily: v })}
              label="Баннер текст фонт"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <div className="flex-1" />
            <button onClick={handleCloseModal}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">Цуцлах</button>
            <button onClick={handleSave} disabled={isSaving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 font-medium">
              {isSaving ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
