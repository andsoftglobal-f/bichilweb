'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { PageHeader } from '@/components/FormElements'
import { axiosInstance } from '@/lib/axios'
import {
  PlusIcon, TrashIcon, PencilIcon,
  ArrowUpIcon, ArrowDownIcon,
  CheckIcon, XMarkIcon,
  PhotoIcon, LinkIcon,
  Cog6ToothIcon,
  SwatchIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import { FontSelect, getFontStyle } from '@/lib/fontOptions'

/* ── types ── */
interface StatItem {
  id?: number
  label_mn: string
  label_en: string
  value: string
  prefix: string
  suffix: string
  suffix_color: string
  icon: string | null
  index: number
  active: boolean
}

interface StatsConfig {
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

const EMPTY_ITEM: StatItem = {
  label_mn: '', label_en: '', value: '',
  prefix: '', suffix: '+', suffix_color: '',
  icon: null, index: 0, active: true,
}

const DEFAULT_CONFIG: StatsConfig = {
  title_mn: '',
  title_en: '',
  description_mn: '',
  description_en: '',
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

/* ── Media input (image / gif / video upload or URL) ── */
function MediaInput({ value, onChange, label }: {
  value: string | null; onChange: (v: string | null) => void; label: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'url' | 'upload'>('upload')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex gap-1 mb-2">
        <button type="button" onClick={() => setMode('upload')}
          className={`text-xs px-2 py-0.5 rounded ${mode === 'upload' ? 'bg-[#0048BA] text-white' : 'bg-gray-100 text-gray-500'}`}>
          <PhotoIcon className="w-3 h-3 inline mr-1 -mt-0.5" />Зураг/Видео
        </button>
        <button type="button" onClick={() => setMode('url')}
          className={`text-xs px-2 py-0.5 rounded ${mode === 'url' ? 'bg-[#0048BA] text-white' : 'bg-gray-100 text-gray-500'}`}>
          <LinkIcon className="w-3 h-3 inline mr-1 -mt-0.5" />Линк
        </button>
      </div>
      {mode === 'url' ? (
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://... (.jpg, .gif, .mp4)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0048BA] focus:ring-1 focus:ring-[#0048BA] outline-none" />
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <PhotoIcon className="w-4 h-4" />Сонгох
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
          {value && <button onClick={() => onChange(null)} className="text-red-400 hover:text-red-600 p-1"><XMarkIcon className="w-4 h-4" /></button>}
        </div>
      )}
      {value && (
        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 max-w-[200px]">
          {/\.(mp4|webm|mov)/i.test(value) ? (
            <video src={value} className="w-full h-24 object-cover" muted autoPlay loop playsInline />
          ) : (
            <Image src={value} alt="" width={200} height={96} className="w-full h-24 object-cover" unoptimized />
          )}
        </div>
      )}
    </div>
  )
}

/* ── Icon input ── */
function IconInput({ value, onChange, size = 'normal' }: {
  value: string | null; onChange: (v: string | null) => void; size?: 'normal' | 'small'
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'url' | 'upload'>('upload')
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }
  const py = size === 'small' ? 'py-1' : 'py-2'
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <button type="button" onClick={() => setMode('upload')}
          className={`text-xs px-2 py-0.5 rounded ${mode === 'upload' ? 'bg-[#0048BA] text-white' : 'bg-gray-100 text-gray-500'}`}>
          <PhotoIcon className="w-3 h-3 inline mr-1 -mt-0.5" />Зураг
        </button>
        <button type="button" onClick={() => setMode('url')}
          className={`text-xs px-2 py-0.5 rounded ${mode === 'url' ? 'bg-[#0048BA] text-white' : 'bg-gray-100 text-gray-500'}`}>
          <LinkIcon className="w-3 h-3 inline mr-1 -mt-0.5" />Линк
        </button>
      </div>
      {mode === 'url' ? (
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://..."
          className={`w-full rounded-lg border border-gray-300 px-3 ${py} text-sm focus:border-[#0048BA] outline-none`} />
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()}
            className={`inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 ${py} text-xs text-gray-600 hover:bg-gray-50`}>
            <PhotoIcon className="w-3.5 h-3.5" />Сонгох
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {value && <button onClick={() => onChange(null)} className="text-red-400 hover:text-red-600 p-0.5"><XMarkIcon className="w-3.5 h-3.5" /></button>}
        </div>
      )}
      {value && (
        <div className="w-8 h-8 rounded bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
          <Image src={value} alt="" width={24} height={24} className="w-6 h-6 object-contain" unoptimized />
        </div>
      )}
    </div>
  )
}

/* ── Color input ── */
function ColorInput({ value, onChange, label }: {
  value: string; onChange: (v: string) => void; label: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-24 rounded border border-gray-300 px-2 py-1.5 text-xs font-mono focus:border-[#0048BA] outline-none" />
      </div>
    </div>
  )
}

/* ── Font size select ── */
function FontSizeInput({ value, onChange, label }: {
  value: string; onChange: (v: string) => void; label: string
}) {
  const sizes = ['0.75rem', '0.875rem', '1rem', '1.125rem', '1.25rem', '1.5rem', '1.75rem', '2rem', '2.25rem', '2.5rem', '2.6rem', '3rem', '3.5rem']
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-[#0048BA] outline-none">
        {sizes.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}

/* ══════════════════════════════════ MAIN ══════════════════════════════════ */
export default function StatsAdminPage() {
  const [items, setItems] = useState<StatItem[]>([])
  const [config, setConfig] = useState<StatsConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [editData, setEditData] = useState<StatItem>(EMPTY_ITEM)
  const [showForm, setShowForm] = useState(false)
  const [newItem, setNewItem] = useState<StatItem>(EMPTY_ITEM)
  const [saving, setSaving] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [showSafeZone, setShowSafeZone] = useState(false)
  const [previewLang, setPreviewLang] = useState<'mn' | 'en'>('mn')

  // Callback-ref based ResizeObserver: observes when element mounts, unobserves on unmount
  const desktopRoRef = useRef<ResizeObserver | null>(null)
  const mobileRoRef = useRef<ResizeObserver | null>(null)
  const [desktopDims, setDesktopDims] = useState({ w: 0, h: 0 })
  const [mobileDims, setMobileDims] = useState({ w: 0, h: 0 })

  const desktopImgRef = useCallback((node: HTMLDivElement | null) => {
    // Disconnect previous observer
    if (desktopRoRef.current) { desktopRoRef.current.disconnect(); desktopRoRef.current = null }
    if (!node) return
    // Immediately measure
    const rect = node.getBoundingClientRect()
    setDesktopDims({ w: Math.round(rect.width), h: Math.round(rect.height) })
    // Observe for future resizes
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDesktopDims({ w: Math.round(width), h: Math.round(height) })
      }
    })
    ro.observe(node)
    desktopRoRef.current = ro
  }, [])

  const mobileImgRef = useCallback((node: HTMLDivElement | null) => {
    if (mobileRoRef.current) { mobileRoRef.current.disconnect(); mobileRoRef.current = null }
    if (!node) return
    const rect = node.getBoundingClientRect()
    setMobileDims({ w: Math.round(rect.width), h: Math.round(rect.height) })
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setMobileDims({ w: Math.round(width), h: Math.round(height) })
      }
    })
    ro.observe(node)
    mobileRoRef.current = ro
  }, [])

  // Helper: compute ratio as "1.3:1" format
  const toRatio = (w: number, h: number) => {
    if (w === 0 || h === 0) return '–'
    const r = w / h
    return r >= 1 ? `${r.toFixed(1)}:1` : `1:${(1 / r).toFixed(1)}`
  }

  // Calculate Safe Zone px values based on actual container dimensions
  // Desktop: text zone = bottom ~35%, safe image = top ~65%
  const dTextZonePx = desktopDims.h > 0 ? Math.round(desktopDims.h * 0.35) : 0
  const dSafeZonePx = desktopDims.h > 0 ? desktopDims.h - dTextZonePx : 0
  // Mobile: text zone = bottom ~40%, safe image = top ~60%
  const mTextZonePx = mobileDims.h > 0 ? Math.round(mobileDims.h * 0.40) : 0
  const mSafeZonePx = mobileDims.h > 0 ? mobileDims.h - mTextZonePx : 0

  // Recommended image sizes (2x for retina)
  const recDesktop = desktopDims.w > 0
    ? { w: desktopDims.w * 2, h: desktopDims.h * 2 }
    : { w: 1040, h: 800 }
  const recMobile = mobileDims.w > 0
    ? { w: mobileDims.w * 2, h: mobileDims.h * 2 }
    : { w: 672, h: 520 }

  /* ── fetch ── */
  const fetchAll = async () => {
    try {
      const [itemsRes, cfgRes] = await Promise.all([
        axiosInstance.get('/stat-items/'),
        axiosInstance.get('/stats-config/'),
      ])
      const raw = itemsRes.data
      const arr: StatItem[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      setItems(arr.sort((a, b) => (a.index ?? 0) - (b.index ?? 0)))
      if (cfgRes.data) setConfig({ ...DEFAULT_CONFIG, ...cfgRes.data })
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchAll() }, [])

  /* ── config save ── */
  const saveConfig = async () => {
    setConfigSaving(true)
    try {
      await axiosInstance.put('/stats-config/update/', config)
      alert('Тохиргоо хадгалагдлаа!')
    } catch (err: any) {
      alert(`Алдаа: ${JSON.stringify(err?.response?.data) || err.message}`)
    } finally {
      setConfigSaving(false)
    }
  }

  /* ── item CRUD ── */
  const handleCreate = async () => {
    setSaving(true)
    try {
      await axiosInstance.post('/stat-items/', { ...newItem, index: items.length })
      setNewItem(EMPTY_ITEM)
      setShowForm(false)
      await fetchAll()
    } catch (err: any) {
      alert(`Алдаа: ${JSON.stringify(err?.response?.data) || err.message}`)
    } finally { setSaving(false) }
  }

  const handleUpdate = async (id: number) => {
    setSaving(true)
    try {
      await axiosInstance.put(`/stat-items/${id}/`, editData)
      setEditing(null)
      await fetchAll()
    } catch (err: any) {
      alert(`Алдаа: ${JSON.stringify(err?.response?.data) || err.message}`)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Устгах уу?')) return
    try { await axiosInstance.delete(`/stat-items/${id}/`); await fetchAll() }
    catch (err) { console.error(err) }
  }

  const handleToggleActive = async (item: StatItem) => {
    try { await axiosInstance.patch(`/stat-items/${item.id}/`, { active: !item.active }); await fetchAll() }
    catch (err) { console.error(err) }
  }

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= items.length) return
    try {
      const a = items[idx], b = items[swapIdx]
      await Promise.all([
        axiosInstance.patch(`/stat-items/${a.id}/`, { index: b.index }),
        axiosInstance.patch(`/stat-items/${b.id}/`, { index: a.index }),
      ])
      await fetchAll()
    } catch (err) { console.error(err) }
  }

  const startEdit = (item: StatItem) => { setEditing(item.id!); setEditData({ ...item }) }

  return (
    <AdminLayout title="Үзүүлэлтүүд">
      <PageHeader
        title="Үзүүлэлтүүд"
        description="Сайт дээр харагдах статистик тоон үзүүлэлтүүд"
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Cog6ToothIcon className="w-4 h-4" />Тохиргоо
            </button>
            <button onClick={() => { setShowForm(true); setNewItem(EMPTY_ITEM) }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0048BA] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#003d9e] transition-colors">
              <PlusIcon className="w-4 h-4" />Нэмэх
            </button>
          </div>
        }
      />

      {/* ══════════ Live Preview ══════════ */}
      {items.filter(i => i.active).length > 0 && (
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
              {/* Language tabs */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  onClick={() => setPreviewLang('mn')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    previewLang === 'mn' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >MN</button>
                <button
                  onClick={() => setPreviewLang('en')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    previewLang === 'en' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >EN</button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Desktop Preview */}
            {previewDevice === 'desktop' && (
              <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex flex-row items-stretch">
                  {/* Left — media panel */}
                  {(config.image_active || config.text_active) && (
                    <div className="w-[40%] shrink-0 p-5">
                      <div ref={desktopImgRef} className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden">
                        {/* gradient bg */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0048BA] via-[#003d9e] to-[#002766]" />
                        {/* image */}
                        {config.image_active && config.section_image && (
                          <Image
                            src={config.section_image}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                        {/* decorations when no image */}
                        {(!config.image_active || !config.section_image) && (
                          <>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/4 -translate-x-1/4" />
                          </>
                        )}
                        {/* overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                        {/* ── Safe Zone overlay ── */}
                        {showSafeZone && (
                          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                            {/* Container dimension badge */}
                            <div className="absolute top-1.5 right-9 z-40 text-[8px] font-bold text-slate-700 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm border border-slate-200">
                              📐 {desktopDims.w}×{desktopDims.h}px
                            </div>
                            {/* Title + Description zone (bottom) */}
                            <div
                              className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-violet-400"
                              style={{ height: '35%', backgroundColor: 'rgba(139,92,246,0.12)' }}
                            >
                              <div className="absolute top-1.5 left-2 text-[10px] font-bold text-violet-700 bg-violet-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
                                📝 ГАРЧИГ + ТАЙЛБАР ({dTextZonePx}px)
                              </div>
                            </div>
                            {/* Safe image zone label */}
                            <div
                              className="absolute left-2 text-[10px] font-bold text-emerald-700 bg-emerald-50/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm"
                              style={{ top: '8px' }}
                            >
                              ✓ ЗУРГИЙН АЮУЛГҮЙ БҮС ({dSafeZonePx}px)
                            </div>
                            {/* Right-side px ruler */}
                            <div className="absolute top-0 right-1.5 h-full flex flex-col items-center" style={{ width: '30px' }}>
                              <div className="flex flex-col items-center" style={{ height: '65%' }}>
                                <div className="w-px bg-emerald-400 flex-1" />
                                <div className="text-[8px] font-bold text-emerald-700 bg-emerald-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
                                  {dSafeZonePx}px
                                </div>
                                <div className="w-px bg-emerald-400 flex-1" />
                              </div>
                              <div className="flex flex-col items-center" style={{ height: '35%' }}>
                                <div className="w-px bg-violet-400 flex-1" />
                                <div className="text-[8px] font-bold text-violet-700 bg-violet-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
                                  {dTextZonePx}px
                                </div>
                                <div className="w-px bg-violet-400 flex-1" />
                              </div>
                            </div>
                            {/* Center crosshair guides */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400/15" />
                            <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-400/15" />
                          </div>
                        )}

                        {/* text overlay */}
                        {config.text_active && (
                          <div className="absolute bottom-0 left-0 right-0 p-6">
                            <h2
                              className="font-bold leading-snug"
                              style={{ color: config.title_color, fontSize: config.title_font_size, ...getFontStyle(config.fontfamily) }}
                            >
                              {previewLang === 'mn' ? config.title_mn : config.title_en}
                            </h2>
                            <p
                              className="mt-2 max-w-[320px]"
                              style={{ color: config.description_color, fontSize: config.description_font_size, ...getFontStyle(config.fontfamily) }}
                            >
                              {previewLang === 'mn' ? config.description_mn : config.description_en}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Right — stats grid */}
                  <div className="flex-1 px-6 py-8 md:px-10 md:py-10 flex items-center">
                    <div className="w-full grid grid-cols-2 gap-x-10 gap-y-8">
                      {items.filter(i => i.active).map((stat, i) => (
                        <div key={stat.id} className="flex items-start gap-4">
                          {/* icon */}
                          <div className="w-10 h-10 rounded-xl bg-[#0048BA]/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {stat.icon ? (
                              <Image src={stat.icon} alt="" width={24} height={24} className="w-6 h-6 object-contain" unoptimized />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#0048BA]">
                                <rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold tracking-tight leading-none flex items-baseline" style={{ color: config.value_color, fontSize: config.value_font_size, ...getFontStyle(config.fontfamily) }}>
                              {stat.prefix && <span>{stat.prefix}</span>}
                              <span>{stat.value}</span>
                              {stat.suffix && <span style={{ color: stat.suffix_color || config.suffix_color }}>{stat.suffix}</span>}
                            </div>
                            <p className="font-medium mt-1.5 tracking-wide leading-snug" style={{ color: config.label_color, fontSize: config.label_font_size, ...getFontStyle(config.fontfamily) }}>
                              {previewLang === 'mn' ? stat.label_mn : stat.label_en}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Preview */}
            {previewDevice === 'mobile' && (
              <div className="max-w-[360px] mx-auto">
                <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex flex-col">
                    {/* Top — media panel */}
                    {(config.image_active || config.text_active) && (
                      <div className="p-3">
                        <div ref={mobileImgRef} className="relative w-full min-h-[200px] rounded-xl overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#0048BA] via-[#003d9e] to-[#002766]" />
                          {config.image_active && config.section_image && (
                            <Image
                              src={config.section_image}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          )}
                          {(!config.image_active || !config.section_image) && (
                            <>
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
                              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/4 -translate-x-1/4" />
                            </>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                          {/* Safe Zone overlay (mobile) */}
                          {showSafeZone && (
                            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                              {/* Container dimension badge */}
                              <div className="absolute top-1.5 right-7 z-40 text-[7px] font-bold text-slate-700 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm border border-slate-200">
                                📐 {mobileDims.w}×{mobileDims.h}px
                              </div>
                              <div
                                className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-violet-400"
                                style={{ height: '40%', backgroundColor: 'rgba(139,92,246,0.12)' }}
                              >
                                <div className="absolute top-1.5 left-2 text-[9px] font-bold text-violet-700 bg-violet-50/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm">
                                  📝 ГАРЧИГ + ТАЙЛБАР ({mTextZonePx}px)
                                </div>
                              </div>
                              <div
                                className="absolute left-2 text-[9px] font-bold text-emerald-700 bg-emerald-50/95 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm"
                                style={{ top: '6px' }}
                              >
                                ✓ АЮУЛГҮЙ БҮС ({mSafeZonePx}px)
                              </div>
                              {/* px ruler */}
                              <div className="absolute top-0 right-1 h-full flex flex-col items-center" style={{ width: '24px' }}>
                                <div className="flex flex-col items-center" style={{ height: '60%' }}>
                                  <div className="w-px bg-emerald-400 flex-1" />
                                  <div className="text-[7px] font-bold text-emerald-700 bg-emerald-50/95 px-0.5 py-px rounded shadow-sm whitespace-nowrap my-px">{mSafeZonePx}px</div>
                                  <div className="w-px bg-emerald-400 flex-1" />
                                </div>
                                <div className="flex flex-col items-center" style={{ height: '40%' }}>
                                  <div className="w-px bg-violet-400 flex-1" />
                                  <div className="text-[7px] font-bold text-violet-700 bg-violet-50/95 px-0.5 py-px rounded shadow-sm whitespace-nowrap my-px">{mTextZonePx}px</div>
                                  <div className="w-px bg-violet-400 flex-1" />
                                </div>
                              </div>
                              {/* Center guides */}
                              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400/15" />
                              <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-400/15" />
                            </div>
                          )}

                          {config.text_active && (
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h2
                                className="font-bold leading-snug"
                                style={{ color: config.title_color, fontSize: config.mobile_title_font_size || '1.25rem', ...getFontStyle(config.fontfamily) }}
                              >
                                {previewLang === 'mn' ? config.title_mn : config.title_en}
                              </h2>
                              <p
                                className="mt-1.5 text-sm"
                                style={{ color: config.description_color, fontSize: config.mobile_description_font_size || '0.75rem', ...getFontStyle(config.fontfamily) }}
                              >
                                {previewLang === 'mn' ? config.description_mn : config.description_en}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom — stats grid (2 cols on mobile) */}
                    <div className="px-4 py-5">
                      <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                        {items.filter(i => i.active).map((stat, i) => (
                          <div key={stat.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0048BA]/10 flex items-center justify-center shrink-0 overflow-hidden">
                              {stat.icon ? (
                                <Image src={stat.icon} alt="" width={20} height={20} className="w-5 h-5 object-contain" unoptimized />
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#0048BA]">
                                  <rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold tracking-tight leading-none flex items-baseline" style={{ color: config.value_color, fontSize: config.mobile_value_font_size || '1.75rem', ...getFontStyle(config.fontfamily) }}>
                                {stat.prefix && <span>{stat.prefix}</span>}
                                <span>{stat.value}</span>
                                {stat.suffix && <span style={{ color: stat.suffix_color || config.suffix_color }}>{stat.suffix}</span>}
                              </div>
                              <p className="font-medium mt-1 tracking-wide leading-snug" style={{ color: config.label_color, fontSize: config.mobile_label_font_size || '0.75rem', ...getFontStyle(config.fontfamily) }}>
                                {previewLang === 'mn' ? stat.label_mn : stat.label_en}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Safe Zone Legend */}
          {showSafeZone && (
            <div className="mx-4 sm:mx-6 mb-4 sm:mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-violet-500" />
                Үзүүлэлтүүд зургийн Safe Zone Guide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Zone legend */}
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h4 className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                    <ComputerDesktopIcon className="w-4 h-4" />
                    Бүсүүдийн хэмжээ (px)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-emerald-500/20 border-2 border-emerald-400 shrink-0" />
                      <span className="text-slate-700">✓ Аюулгүй бүс — Desktop: <b>{dSafeZonePx}px</b>, Mobile: <b>{mSafeZonePx}px</b></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-violet-500/15 border-2 border-dashed border-violet-400 shrink-0" />
                      <span className="text-slate-700">📝 Гарчиг + Тайлбар — Desktop: <b>{dTextZonePx}px</b>, Mobile: <b>{mTextZonePx}px</b></span>
                    </div>
                  </div>
                </div>
                {/* Recommended image dimensions */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-800 mb-2">📐 Зөвлөмж зургийн хэмжээ</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-12 h-9 rounded border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
                        <span className="text-[7px] font-bold text-blue-600">{recDesktop.w}×{recDesktop.h}</span>
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-blue-800">Desktop: {recDesktop.w} × {recDesktop.h}px</p>
                        <p className="text-blue-600/80">Харьцаа: {toRatio(recDesktop.w, recDesktop.h)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-8 h-10 rounded border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
                        <span className="text-[6px] font-bold text-blue-600">{recMobile.w}×{recMobile.h}</span>
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-blue-800">Mobile: {recMobile.w} × {recMobile.h}px</p>
                        <p className="text-blue-600/80">Харьцаа: {toRatio(recMobile.w, recMobile.h)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Tips */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Зөвлөгөө</h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• Энэ харьцаатай зураг оруулбал яг таарна</li>
                    <li>• Чухал контентыг дээд хэсэгт байрлуулна уу</li>
                    <li>• Доод хэсэгт текст дарж харагдана</li>
                    <li>• <code className="text-[10px] bg-slate-200 px-1 rounded">object-cover</code> тул харьцаа тааруулах чухал</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ Section Config ══════════ */}
      {showConfig && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Cog6ToothIcon className="w-4 h-4" />Хэсгийн тохиргоо
          </h3>

          {/* ── Текст + Идэвхтэй/Идэвхгүй ── */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-500">Гарчиг & Тайлбар</h4>
            <button type="button" onClick={() => setConfig({ ...config, text_active: !config.text_active })}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                config.text_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
              {config.text_active ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeSlashIcon className="w-3.5 h-3.5" />}
              {config.text_active ? 'Текст идэвхтэй' : 'Текст идэвхгүй'}
            </button>
          </div>
          {!config.text_active && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">Текст идэвхгүй үед зөвхөн зураг харагдана (зураг идэвхтэй бол)</p>
          )}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 ${!config.text_active ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Гарчиг (Монгол)</label>
              <input type="text" value={config.title_mn}
                onChange={e => setConfig({ ...config, title_mn: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0048BA] focus:ring-1 focus:ring-[#0048BA] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Гарчиг (Англи)</label>
              <input type="text" value={config.title_en}
                onChange={e => setConfig({ ...config, title_en: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0048BA] focus:ring-1 focus:ring-[#0048BA] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Тайлбар (Монгол)</label>
              <textarea rows={2} value={config.description_mn}
                onChange={e => setConfig({ ...config, description_mn: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0048BA] focus:ring-1 focus:ring-[#0048BA] outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Тайлбар (Англи)</label>
              <textarea rows={2} value={config.description_en}
                onChange={e => setConfig({ ...config, description_en: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0048BA] focus:ring-1 focus:ring-[#0048BA] outline-none resize-none" />
            </div>
          </div>

          {/* Гарчиг & Тайлбар өнгө, хэмжээ */}
          <div className={`border-t border-gray-100 pt-4 mb-5 ${!config.text_active ? 'opacity-40 pointer-events-none' : ''}`}>
            <h4 className="text-xs font-semibold text-gray-500 mb-3">Гарчиг & Тайлбар: өнгө, хэмжээ</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <ColorInput label="Гарчигийн өнгө" value={config.title_color} onChange={v => setConfig({ ...config, title_color: v })} />
              <FontSizeInput label="Гарчигийн хэмжээ" value={config.title_font_size} onChange={v => setConfig({ ...config, title_font_size: v })} />
              <ColorInput label="Тайлбарын өнгө" value={config.description_color} onChange={v => setConfig({ ...config, description_color: v })} />
              <FontSizeInput label="Тайлбарын хэмжээ" value={config.description_font_size} onChange={v => setConfig({ ...config, description_font_size: v })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div />
              <FontSizeInput label="📱 Гарчиг (мобайл)" value={config.mobile_title_font_size} onChange={v => setConfig({ ...config, mobile_title_font_size: v })} />
              <div />
              <FontSizeInput label="📱 Тайлбар (мобайл)" value={config.mobile_description_font_size} onChange={v => setConfig({ ...config, mobile_description_font_size: v })} />
            </div>
          </div>

          {/* ── Зураг + Идэвхтэй/Идэвхгүй ── */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-500">Хэсгийн зураг</h4>
              <button type="button" onClick={() => setConfig({ ...config, image_active: !config.image_active })}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  config.image_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                {config.image_active ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeSlashIcon className="w-3.5 h-3.5" />}
                {config.image_active ? 'Зураг идэвхтэй' : 'Зураг идэвхгүй'}
              </button>
            </div>
            {!config.image_active && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">Зураг идэвхгүй үед зөвхөн текст харагдана (текст идэвхтэй бол)</p>
            )}
            <div className={`mb-5 ${!config.image_active ? 'opacity-40 pointer-events-none' : ''}`}>
              <MediaInput value={config.section_image} onChange={v => setConfig({ ...config, section_image: v })} label="Зураг / GIF / Видео" />
            </div>
          </div>

          {/* Фонт */}
          <div className="border-t border-gray-100 pt-4 mb-5">
            <h4 className="text-xs font-semibold text-gray-500 mb-3">Фонт гарал</h4>
            <div className="max-w-xs">
              <FontSelect
                label="Бүх текстийн фонт"
                value={config.fontfamily}
                onChange={v => setConfig({ ...config, fontfamily: v })}
              />
            </div>
          </div>

          {/* Тоон утгуудын өнгө & хэмжээ */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
              <SwatchIcon className="w-3.5 h-3.5" />Тоон утгуудын өнгө & хэмжээ
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ColorInput label="Тооны өнгө" value={config.value_color} onChange={v => setConfig({ ...config, value_color: v })} />
              <FontSizeInput label="Тооны хэмжээ" value={config.value_font_size} onChange={v => setConfig({ ...config, value_font_size: v })} />
              <ColorInput label="Нэрний өнгө" value={config.label_color} onChange={v => setConfig({ ...config, label_color: v })} />
              <FontSizeInput label="Нэрний хэмжээ" value={config.label_font_size} onChange={v => setConfig({ ...config, label_font_size: v })} />
              <ColorInput label="+ тэмдгийн өнгө" value={config.suffix_color} onChange={v => setConfig({ ...config, suffix_color: v })} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-3">
              <div />
              <FontSizeInput label="📱 Тоо (мобайл)" value={config.mobile_value_font_size} onChange={v => setConfig({ ...config, mobile_value_font_size: v })} />
              <div />
              <FontSizeInput label="📱 Нэр (мобайл)" value={config.mobile_label_font_size} onChange={v => setConfig({ ...config, mobile_label_font_size: v })} />
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={saveConfig} disabled={configSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0048BA] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#003d9e] disabled:opacity-50 transition-colors">
              <CheckIcon className="w-4 h-4" />{configSaving ? 'Хадгалж байна...' : 'Тохиргоо хадгалах'}
            </button>
            <button onClick={() => setShowConfig(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <XMarkIcon className="w-4 h-4" />Хаах
            </button>
          </div>
        </div>
      )}

      {/* ══════════ Create Form ══════════ */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Шинэ үзүүлэлт нэмэх</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Нэр (Монгол)</label>
              <input type="text" value={newItem.label_mn}
                onChange={e => setNewItem({ ...newItem, label_mn: e.target.value })}
                placeholder="Бидэнд итгэсэн үйлчлүүлэгчид"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0048BA] focus:ring-1 focus:ring-[#0048BA] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Нэр (Англи)</label>
              <input type="text" value={newItem.label_en}
                onChange={e => setNewItem({ ...newItem, label_en: e.target.value })}
                placeholder="Trusted Customers"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0048BA] focus:ring-1 focus:ring-[#0048BA] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Тоо</label>
              <input type="text" value={newItem.value}
                onChange={e => setNewItem({ ...newItem, value: e.target.value })}
                placeholder="50,000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0048BA] focus:ring-1 focus:ring-[#0048BA] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Айкон (заавал биш)</label>
              <IconInput value={newItem.icon} onChange={v => setNewItem({ ...newItem, icon: v })} />
            </div>
          </div>
          {/* optional suffix color */}
          <div className="mt-4 max-w-[200px]">
            <ColorInput label="+ тэмдгийн өнгө (заавал биш)" value={newItem.suffix_color || config.suffix_color}
              onChange={v => setNewItem({ ...newItem, suffix_color: v })} />
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={handleCreate} disabled={saving || !newItem.label_mn || !newItem.value}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0048BA] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#003d9e] disabled:opacity-50 transition-colors">
              <CheckIcon className="w-4 h-4" />Хадгалах
            </button>
            <button onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <XMarkIcon className="w-4 h-4" />Болих
            </button>
          </div>
        </div>
      )}

      {/* ══════════ Items Table ══════════ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0048BA] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">Үзүүлэлт байхгүй байна</p>
            <p className="text-xs mt-1">Дээрх &quot;Нэмэх&quot; товч дарж шинээр нэмнэ үү</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-10">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-14">Айкон</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Нэр (MN)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Нэр (EN)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Тоо</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-12">Өнгө</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-20">Төлөв</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-36">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {editing === item.id ? (
                    <>
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3"><IconInput value={editData.icon} onChange={v => setEditData({ ...editData, icon: v })} size="small" /></td>
                      <td className="px-4 py-3"><input type="text" value={editData.label_mn} onChange={e => setEditData({ ...editData, label_mn: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-[#0048BA] outline-none" /></td>
                      <td className="px-4 py-3"><input type="text" value={editData.label_en} onChange={e => setEditData({ ...editData, label_en: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-[#0048BA] outline-none" /></td>
                      <td className="px-4 py-3"><input type="text" value={editData.value} onChange={e => setEditData({ ...editData, value: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-[#0048BA] outline-none" /></td>
                      <td className="px-4 py-3">
                        <input type="color" value={editData.suffix_color || config.suffix_color}
                          onChange={e => setEditData({ ...editData, suffix_color: e.target.value })}
                          className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0" />
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEditData({ ...editData, active: !editData.active })}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${editData.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {editData.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleUpdate(item.id!)} disabled={saving} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50" title="Хадгалах"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" title="Болих"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        {item.icon ? (
                          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                            <Image src={item.icon} alt="" width={24} height={24} className="w-6 h-6 object-contain" unoptimized />
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.label_mn}</td>
                      <td className="px-4 py-3 text-gray-600">{item.label_en}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-gray-800">
                        {item.value}<span style={{ color: item.suffix_color || config.suffix_color }} className="ml-0.5">{item.suffix}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: item.suffix_color || config.suffix_color }} />
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleActive(item)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30" title="Дээш"><ArrowUpIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleMove(idx, 1)} disabled={idx === items.length - 1} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30" title="Доош"><ArrowDownIcon className="w-4 h-4" /></button>
                          <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg text-[#0048BA] hover:bg-blue-50" title="Засах"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(item.id!)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Устгах"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
