'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { PageHeader } from '@/components/FormElements'
import { axiosInstance } from '@/lib/axios'
import {
  PlusIcon, TrashIcon, PencilIcon,
  ArrowUpIcon, ArrowDownIcon,
  CheckIcon, XMarkIcon,
} from '@heroicons/react/24/outline'

/* ───────── Types ───────── */
interface Partner {
  id?: number
  name: string
  logo: string | null
  logo_url: string | null
  url: string
  index: number
  active: boolean
}

interface PartnerSectionConfig {
  id?: number
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

const DEFAULT_SECTION_CONFIG: PartnerSectionConfig = {
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

const FONT_OPTIONS = [
  { label: 'Үндсэн', value: '' },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Geist', value: 'var(--font-geist-sans), sans-serif' },
]

const FONT_SIZE_OPTIONS = [
  { label: 'Жижиг', value: '0.75rem' },
  { label: 'Энгийн', value: '0.875rem' },
  { label: 'Дунд', value: '1rem' },
  { label: 'Том', value: '1.25rem' },
  { label: 'XL', value: '1.5rem' },
]

/* ───────── Crop constants ───────── */
const CROP_SIZE = 200 // crop output square size
const CANVAS_SIZE = 400 // crop canvas display size

/* ───────── Image Crop Modal ───────── */
function CropModal({
  file,
  onCrop,
  onClose,
  lastLogo,
}: {
  file: File
  onCrop: (blob: Blob) => void
  onClose: () => void
  lastLogo: string | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      // Fit image to canvas
      const fitScale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height)
      setScale(fitScale)
      setOffset({
        x: (CANVAS_SIZE - img.width * fitScale) / 2,
        y: (CANVAS_SIZE - img.height * fitScale) / 2,
      })
      setImgLoaded(true)
    }
    img.src = URL.createObjectURL(file)
    return () => URL.revokeObjectURL(img.src)
  }, [file])

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imgRef.current
    if (!canvas || !ctx || !img) return

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw checkerboard background
    const tileSize = 16
    for (let y = 0; y < CANVAS_SIZE; y += tileSize) {
      for (let x = 0; x < CANVAS_SIZE; x += tileSize) {
        ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? '#f0f0f0' : '#ffffff'
        ctx.fillRect(x, y, tileSize, tileSize)
      }
    }

    // Draw image
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.clip()
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale)
    ctx.restore()

    // Draw crop guide lines
    ctx.strokeStyle = 'rgba(0, 72, 186, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])
    // Center cross
    ctx.beginPath()
    ctx.moveTo(CANVAS_SIZE / 2, 0)
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE)
    ctx.moveTo(0, CANVAS_SIZE / 2)
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2)
    ctx.stroke()
    ctx.setLineDash([])
  }, [offset, scale])

  useEffect(() => {
    if (imgLoaded) draw()
  }, [imgLoaded, draw])

  // Mouse/touch handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy })
  }

  const handlePointerUp = () => setDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setScale((s) => Math.max(0.1, Math.min(5, s + delta)))
  }

  // Crop and output
  const handleCrop = () => {
    const img = imgRef.current
    if (!img) return
    const outCanvas = document.createElement('canvas')
    outCanvas.width = CROP_SIZE
    outCanvas.height = CROP_SIZE
    const ctx = outCanvas.getContext('2d')!
    // Map canvas coords to output
    const ratio = CROP_SIZE / CANVAS_SIZE
    ctx.drawImage(
      img,
      offset.x * ratio,
      offset.y * ratio,
      img.width * scale * ratio,
      img.height * scale * ratio,
    )
    outCanvas.toBlob((blob) => {
      if (blob) onCrop(blob)
    }, 'image/png')
  }

  // Center button
  const handleCenter = () => {
    const img = imgRef.current
    if (!img) return
    setOffset({
      x: (CANVAS_SIZE - img.width * scale) / 2,
      y: (CANVAS_SIZE - img.height * scale) / 2,
    })
  }

  // Fit button
  const handleFit = () => {
    const img = imgRef.current
    if (!img) return
    const fitScale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height)
    setScale(fitScale)
    setOffset({
      x: (CANVAS_SIZE - img.width * fitScale) / 2,
      y: (CANVAS_SIZE - img.height * fitScale) / 2,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[900px] w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900">Лого тайрах</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Crop area */}
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-3">
                Зургийг чирж голлуулна. Scroll-ээр томруулж/жижигрүүлнэ.
              </p>
              <div className="relative inline-block border-2 border-dashed border-[#0048BA]/30 rounded-xl overflow-hidden bg-white"
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onWheel={handleWheel}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mt-4">
                <label className="text-xs text-gray-500 w-16">Хэмжээ:</label>
                <input
                  type="range"
                  min={10}
                  max={500}
                  value={Math.round(scale * 100)}
                  onChange={(e) => setScale(Number(e.target.value) / 100)}
                  className="flex-1 accent-[#0048BA]"
                />
                <span className="text-xs text-gray-500 w-12 text-right">{Math.round(scale * 100)}%</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleCenter} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  Голлуулах
                </button>
                <button onClick={handleFit} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  Тааруулах
                </button>
              </div>
            </div>

            {/* Preview + comparison */}
            <div className="flex flex-col gap-4 w-[200px] flex-shrink-0">
              {/* Preview */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Урьдчилсан харагдац</p>
                <div className="w-[120px] h-[120px] border border-gray-200 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                  <canvas
                    ref={(el) => {
                      if (!el || !imgRef.current || !imgLoaded) return
                      const ctx = el.getContext('2d')
                      if (!ctx) return
                      const previewSize = 120
                      el.width = previewSize
                      el.height = previewSize
                      ctx.clearRect(0, 0, previewSize, previewSize)
                      const ratio = previewSize / CANVAS_SIZE
                      ctx.drawImage(
                        imgRef.current,
                        offset.x * ratio,
                        offset.y * ratio,
                        imgRef.current.width * scale * ratio,
                        imgRef.current.height * scale * ratio,
                      )
                    }}
                    width={120}
                    height={120}
                  />
                </div>
              </div>

              {/* Last logo comparison */}
              {lastLogo && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Сүүлийн лого</p>
                  <div className="w-[120px] h-[120px] border border-gray-200 rounded-xl bg-white flex items-center justify-center overflow-hidden p-2">
                    <img
                      src={lastLogo}
                      alt="Last logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Адилхан хэмжээтэй байхад анхаарна уу</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            Цуцлах
          </button>
          <button
            onClick={handleCrop}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#0048BA] rounded-xl hover:bg-[#003d9e] transition flex items-center gap-2"
          >
            <CheckIcon className="w-4 h-4" />
            Тайрах & Хадгалах
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────── Main Page ───────── */
export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [sectionConfig, setSectionConfig] = useState<PartnerSectionConfig>(DEFAULT_SECTION_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Crop state
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)  // null = new partner
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState<number | null>(null)
  const [inlineEditName, setInlineEditName] = useState('')
  const [inlineEditUrl, setInlineEditUrl] = useState('')

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get('/partners/')
      const raw = res.data
      const items = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      setPartners(items)
    } catch (err) {
      console.error('Partners fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSectionConfig = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/partner-section-config/')
      setSectionConfig({ ...DEFAULT_SECTION_CONFIG, ...res.data })
    } catch (err) {
      console.error('Partner section config fetch error:', err)
    }
  }, [])

  useEffect(() => {
    fetchPartners()
    fetchSectionConfig()
  }, [fetchPartners, fetchSectionConfig])

  const handleConfigSave = async () => {
    setConfigSaving(true)
    try {
      const payload = {
        ...sectionConfig,
        title_mn: sectionConfig.title_mn.trim() || DEFAULT_SECTION_CONFIG.title_mn,
        title_en: sectionConfig.title_en.trim() || DEFAULT_SECTION_CONFIG.title_en,
        title_color: sectionConfig.title_color.trim() || DEFAULT_SECTION_CONFIG.title_color,
        title_font_size: sectionConfig.title_font_size.trim() || DEFAULT_SECTION_CONFIG.title_font_size,
        divider_width: sectionConfig.divider_width.trim() || DEFAULT_SECTION_CONFIG.divider_width,
        divider_height: sectionConfig.divider_height.trim() || DEFAULT_SECTION_CONFIG.divider_height,
        divider_color: sectionConfig.divider_color.trim() || DEFAULT_SECTION_CONFIG.divider_color,
        divider_margin_top: sectionConfig.divider_margin_top.trim() || DEFAULT_SECTION_CONFIG.divider_margin_top,
        divider_margin_bottom: sectionConfig.divider_margin_bottom.trim() || DEFAULT_SECTION_CONFIG.divider_margin_bottom,
      }
      const res = await axiosInstance.patch('/partner-section-config/update/', payload)
      setSectionConfig({ ...DEFAULT_SECTION_CONFIG, ...res.data })
      setMsg({ type: 'success', text: 'Гарчгийн тохиргоо хадгалагдлаа!' })
    } catch (err) {
      console.error(err)
      setMsg({ type: 'error', text: 'Гарчгийн тохиргоо хадгалахад алдаа гарлаа' })
    } finally {
      setConfigSaving(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  // Get the last added logo URL for comparison
  const getLastLogoUrl = (): string | null => {
    const withLogos = partners.filter((p) => p.logo_url)
    if (withLogos.length === 0) return null
    return withLogos[withLogos.length - 1].logo_url
  }

  // File select → open crop modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCropFile(file)
    }
    e.target.value = ''
  }

  // Add new logo button
  const handleAddNew = () => {
    setEditingId(null)
    setEditName('')
    setEditUrl('')
    fileInputRef.current?.click()
  }

  // Replace existing logo
  const handleReplace = (partner: Partner) => {
    setEditingId(partner.id ?? null)
    setEditName(partner.name)
    setEditUrl(partner.url)
    fileInputRef.current?.click()
  }

  // Crop done → upload
  const handleCropDone = async (blob: Blob) => {
    setCropFile(null)
    setSaving(true)
    try {
      const formData = new FormData()
      
      // Зургийн нэрийг цаг хугацаагаар дахин давтагдахгүйгээр үүсгэх
      const uniqueFileName = `logo_${Date.now()}.png`
      formData.append('logo_file', blob, uniqueFileName) 
      
      formData.append('name', editName)
      formData.append('url', editUrl)
      formData.append('active', 'true')
      formData.append('index', String(partners.length))

      if (editingId) {
        // Update existing
        await axiosInstance.put(`/partners/${editingId}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        // Create new
        await axiosInstance.post('/partners/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      setMsg({ type: 'success', text: 'Амжилттай хадгалагдлаа!' })
      fetchPartners()
    } catch (err: any) {
      console.error(err)
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Алдаа гарлаа' })
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  // Delete partner
  const handleDelete = async (id: number) => {
    if (!confirm('Энэ логог устгах уу?')) return
    try {
      await axiosInstance.delete(`/partners/${id}/`)
      setMsg({ type: 'success', text: 'Устгагдлаа' })
      fetchPartners()
    } catch (err) {
      console.error(err)
      setMsg({ type: 'error', text: 'Устгахад алдаа гарлаа' })
    }
    setTimeout(() => setMsg(null), 3000)
  }

  // Toggle active
  const handleToggleActive = async (p: Partner) => {
    try {
      await axiosInstance.patch(`/partners/${p.id}/`, { active: !p.active })
      fetchPartners()
    } catch (err) {
      console.error(err)
    }
  }

  // Move up/down
  const handleMove = async (idx: number, direction: 'up' | 'down') => {
    const newPartners = [...partners]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= newPartners.length) return

    // Swap indexes
    const tmpIndex = newPartners[idx].index
    newPartners[idx].index = newPartners[swapIdx].index
    newPartners[swapIdx].index = tmpIndex

    try {
      await Promise.all([
        axiosInstance.patch(`/partners/${newPartners[idx].id}/`, { index: newPartners[idx].index }),
        axiosInstance.patch(`/partners/${newPartners[swapIdx].id}/`, { index: newPartners[swapIdx].index }),
      ])
      fetchPartners()
    } catch (err) {
      console.error(err)
    }
  }

  // Inline edit save
  const handleInlineEditSave = async (p: Partner) => {
    try {
      await axiosInstance.patch(`/partners/${p.id}/`, {
        name: inlineEditName,
        url: inlineEditUrl,
      })
      setInlineEditId(null)
      fetchPartners()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AdminLayout title="Хамтрагчид">
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Хамтрагч байгууллагууд" description="Хамтрагч байгууллагуудын лого удирдах" />

        {/* Messages */}
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Section title settings */}
        <div className="mb-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-1">
            <h3 className="text-base font-semibold text-gray-900">Нүүр хуудасны гарчгийн тохиргоо</h3>
            <p className="text-sm text-gray-500">“Хамтрагч байгууллагууд” гарчгийн текст, өнгө, хэмжээ, фонтыг эндээс удирдана.</p>
          </div>

          <div className="p-5 space-y-5">
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6">
              <p
                className="text-center font-semibold uppercase tracking-[0.2em]"
                style={{
                  color: sectionConfig.title_color,
                  fontSize: sectionConfig.title_font_size,
                  fontFamily: sectionConfig.title_font_family || undefined,
                }}
              >
                {sectionConfig.title_mn || DEFAULT_SECTION_CONFIG.title_mn}
              </p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Гарчиг (Монгол)</label>
                <input
                  type="text"
                  value={sectionConfig.title_mn}
                  onChange={(e) => setSectionConfig((c) => ({ ...c, title_mn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Гарчиг (Англи)</label>
                <input
                  type="text"
                  value={sectionConfig.title_en}
                  onChange={(e) => setSectionConfig((c) => ({ ...c, title_en: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Өнгө</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={sectionConfig.title_color.startsWith('#') ? sectionConfig.title_color : DEFAULT_SECTION_CONFIG.title_color}
                    onChange={(e) => setSectionConfig((c) => ({ ...c, title_color: e.target.value }))}
                    className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={sectionConfig.title_color}
                    onChange={(e) => setSectionConfig((c) => ({ ...c, title_color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Хэмжээ</label>
                <div className="flex flex-wrap gap-2">
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSectionConfig((c) => ({ ...c, title_font_size: opt.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${sectionConfig.title_font_size === opt.value ? 'bg-[#0048BA] text-white border-[#0048BA]' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={sectionConfig.title_font_size}
                    onChange={(e) => setSectionConfig((c) => ({ ...c, title_font_size: e.target.value }))}
                    className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.875rem"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Үсгийн фонт</label>
                <select
                  value={sectionConfig.title_font_family}
                  onChange={(e) => setSectionConfig((c) => ({ ...c, title_font_family: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Зураасны өнгө</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={sectionConfig.divider_color.startsWith('#') ? sectionConfig.divider_color : DEFAULT_SECTION_CONFIG.divider_color}
                    onChange={(e) => setSectionConfig((c) => ({ ...c, divider_color: e.target.value }))}
                    className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={sectionConfig.divider_color}
                    onChange={(e) => setSectionConfig((c) => ({ ...c, divider_color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Зураасны урт</label>
                <input
                  type="text"
                  value={sectionConfig.divider_width}
                  onChange={(e) => setSectionConfig((c) => ({ ...c, divider_width: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="64px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Зураасны бүдүүн</label>
                <input
                  type="text"
                  value={sectionConfig.divider_height}
                  onChange={(e) => setSectionConfig((c) => ({ ...c, divider_height: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Гарчиг, зураасны зай</label>
                <input
                  type="text"
                  value={sectionConfig.divider_margin_top}
                  onChange={(e) => setSectionConfig((c) => ({ ...c, divider_margin_top: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Зураас, доод хэсгийн зай</label>
                <input
                  type="text"
                  value={sectionConfig.divider_margin_bottom}
                  onChange={(e) => setSectionConfig((c) => ({ ...c, divider_margin_bottom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="24px"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfigSave}
                disabled={configSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0048BA] rounded-xl hover:bg-[#003d9e] transition disabled:opacity-50"
              >
                {configSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                Тохиргоо хадгалах
              </button>
            </div>
          </div>
        </div>

        {/* Add button */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{partners.length} лого бүртгэгдсэн</p>
          <button
            onClick={handleAddNew}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0048BA] rounded-xl hover:bg-[#003d9e] transition disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4" />
            Шинэ лого нэмэх
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0048BA]" />
          </div>
        )}

        {/* Partners grid */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {partners.map((p, idx) => (
              <div
                key={p.id}
                className={`group relative bg-white border rounded-2xl overflow-hidden transition-all hover:shadow-lg ${
                  !p.active ? 'opacity-50 border-gray-200' : 'border-gray-200 hover:border-[#0048BA]/30'
                }`}
              >
                {/* Logo display */}
                <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-4">
                  {p.logo_url ? (
                    <img
                      src={p.logo_url}
                      alt={p.name || 'Logo'}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-300 text-4xl">📷</div>
                  )}

                  {/* Hover overlay actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleReplace(p)}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
                      title="Лого солих"
                    >
                      <PencilIcon className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id!)}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 transition"
                      title="Устгах"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>

                  {/* Index badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/80 rounded-md text-[10px] font-bold text-gray-400">
                    #{idx + 1}
                  </div>
                </div>

                {/* Info section */}
                <div className="p-3 border-t">
                  {inlineEditId === p.id ? (
                    <div className="space-y-2">
                      <input
                        value={inlineEditName}
                        onChange={(e) => setInlineEditName(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded-lg focus:ring-1 focus:ring-[#0048BA] focus:outline-none"
                        placeholder="Нэр"
                      />
                      <input
                        value={inlineEditUrl}
                        onChange={(e) => setInlineEditUrl(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded-lg focus:ring-1 focus:ring-[#0048BA] focus:outline-none"
                        placeholder="URL"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleInlineEditSave(p)}
                          className="flex-1 px-2 py-1 text-xs font-medium text-white bg-[#0048BA] rounded-lg hover:bg-[#003d9e] transition"
                        >
                          Хадгалах
                        </button>
                        <button
                          onClick={() => setInlineEditId(null)}
                          className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p
                        className="text-xs font-medium text-gray-800 truncate cursor-pointer hover:text-[#0048BA] transition"
                        onClick={() => {
                          setInlineEditId(p.id!)
                          setInlineEditName(p.name)
                          setInlineEditUrl(p.url)
                        }}
                        title="Дарж засах"
                      >
                        {p.name || <span className="text-gray-400 italic">Нэр оруулаагүй</span>}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition"
                        >
                          <ArrowUpIcon className="w-3 h-3 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === partners.length - 1}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition"
                        >
                          <ArrowDownIcon className="w-3 h-3 text-gray-500" />
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition ${
                            p.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Add new card */}
            <button
              onClick={handleAddNew}
              disabled={saving}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#0048BA]/40 hover:text-[#0048BA] hover:bg-[#E6F0FF]/30 transition-all disabled:opacity-50"
            >
              <PlusIcon className="w-8 h-8" />
              <span className="text-xs font-medium">Лого нэмэх</span>
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && partners.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Хамтрагч байгууллага бүртгэгдээгүй</h3>
            <p className="text-sm text-gray-500 mb-6">&quot;Шинэ лого нэмэх&quot; товчийг дарж эхний логог нэмнэ үү</p>
          </div>
        )}

        {/* Crop Modal */}
        {cropFile && (
          <CropModal
            file={cropFile}
            onCrop={handleCropDone}
            onClose={() => setCropFile(null)}
            lastLogo={getLastLogoUrl()}
          />
        )}

        {/* Saving overlay */}
        {saving && (
          <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center">
            <div className="bg-white rounded-xl px-6 py-4 shadow-xl flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0048BA]" />
              <span className="text-sm font-medium text-gray-700">Хадгалж байна...</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
