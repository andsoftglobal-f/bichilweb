'use client'

import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { PageHeader } from '@/components/FormElements'
import { axiosInstance } from '@/lib/axios'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  LinkIcon,
  PhotoIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'

const API_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'

/* ───────── Types ───────── */
interface Advertisement {
  id?: number
  title: string
  description: string
  image: string | null
  image_url: string | null
  url: string
  button_text?: string
  button_font_family?: string
  button_text_color?: string
  button_hover_text_color?: string
  button_text_size?: string
  index: number
  active: boolean
}

interface AdConfig {
  id?: number
  interval_seconds: number
}

interface FormData {
  title: string
  description: string
  url: string
  button_text: string
  button_font_family: string
  button_text_color: string
  button_hover_text_color: string
  button_text_size: string
  index: number
  active: boolean
}

const INITIAL_FORM: FormData = {
  title: '',
  description: '',
  url: '',
  button_text: 'Энд дарна уу',
  button_font_family: '',
  button_text_color: '#ffffff',
  button_hover_text_color: '#ef3f0a',
  button_text_size: '18px',
  index: 0,
  active: true,
}

const AD_FONT_OPTIONS = [
  { label: 'Үндсэн', value: '' },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Geist', value: 'var(--font-geist-sans), sans-serif' },
]

/* ───────── Helper: resolve image URL ───────── */
function resolveUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export default function AdsPage() {
  /* ─── State ─── */
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<number | null>(null) // ad id or null
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Config
  const [config, setConfig] = useState<AdConfig>({ interval_seconds: 60 })
  const [configDraft, setConfigDraft] = useState(60)
  const [savingConfig, setSavingConfig] = useState(false)
  const [previewButtonHovered, setPreviewButtonHovered] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ─── Fetch ─── */
  const fetchAds = async () => {
    try {
      const res = await axiosInstance.get('/advertisements/')
      const data = Array.isArray(res.data) ? res.data : res.data.results || []
      setAds(data)
    } catch {
      setErrorMsg('Зарын жагсаалт ачааллахад алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  const fetchConfig = async () => {
    try {
      const res = await axiosInstance.get('/advertisements/config/')
      setConfig(res.data)
      setConfigDraft(res.data.interval_seconds)
    } catch {
      // config not yet created, default will be used
    }
  }

  useEffect(() => {
    fetchAds()
    fetchConfig()
  }, [])

  /* ─── Flash messages ─── */
  const flash = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }
  const flashError = (msg: string) => {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(''), 4000)
  }

  /* ─── File handling ─── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  /* ─── Form reset ─── */
  const resetForm = () => {
    setFormData(INITIAL_FORM)
    setImageFile(null)
    setImagePreview(null)
    setEditing(null)
    setShowForm(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ─── Edit ─── */
  const startEdit = (ad: Advertisement) => {
    setEditing(ad.id || null)
    setFormData({
      title: ad.title || '',
      description: ad.description || '',
      url: ad.url || '',
      button_text: ad.button_text || 'Энд дарна уу',
      button_font_family: ad.button_font_family || '',
      button_text_color: ad.button_text_color || '#ffffff',
      button_hover_text_color: ad.button_hover_text_color || '#ef3f0a',
      button_text_size: ad.button_text_size || '18px',
      index: ad.index ?? 0,
      active: ad.active,
    })
    setImagePreview(resolveUrl(ad.image_url || ad.image))
    setImageFile(null)
    setShowForm(true)
  }

  /* ─── Save ─── */
  const handleSave = async () => {
    if (!formData.title.trim()) {
      flashError('Гарчиг оруулна уу')
      return
    }
    setSaving(true)
    try {
      const payload = new FormData()
      payload.append('title', formData.title)
      payload.append('description', formData.description)
      payload.append('url', formData.url)
      payload.append('button_text', formData.button_text)
      payload.append('button_font_family', formData.button_font_family)
      payload.append('button_text_color', formData.button_text_color)
      payload.append('button_hover_text_color', formData.button_hover_text_color)
      payload.append('button_text_size', formData.button_text_size)
      payload.append('index', String(formData.index))
      payload.append('active', String(formData.active))

      if (imageFile) {
        payload.append('image_file', imageFile)
      }

      if (editing) {
        await axiosInstance.put(`/advertisements/${editing}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        flash('Зар амжилттай шинэчлэгдлээ')
      } else {
        await axiosInstance.post('/advertisements/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        flash('Зар амжилттай нэмэгдлээ')
      }
      resetForm()
      fetchAds()
    } catch {
      flashError('Хадгалахад алдаа гарлаа')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Delete ─── */
  const handleDelete = async (id: number) => {
    if (!confirm('Энэ зарыг устгах уу?')) return
    try {
      await axiosInstance.delete(`/advertisements/${id}/`)
      flash('Зар устгагдлаа')
      fetchAds()
    } catch {
      flashError('Устгахад алдаа гарлаа')
    }
  }

  /* ─── Toggle active ─── */
  const toggleActive = async (ad: Advertisement) => {
    try {
      await axiosInstance.patch(`/advertisements/${ad.id}/`, { active: !ad.active })
      fetchAds()
    } catch {
      flashError('Төлөв өөрчлөхөд алдаа гарлаа')
    }
  }

  /* ─── Save config ─── */
  const saveConfig = async () => {
    if (configDraft < 5) {
      flashError('Хамгийн багадаа 5 секунд байх ёстой')
      return
    }
    setSavingConfig(true)
    try {
      const res = await axiosInstance.put('/advertisements/config/', {
        interval_seconds: configDraft,
      })
      setConfig(res.data)
      flash('Хугацааны тохиргоо хадгалагдлаа')
    } catch {
      flashError('Тохиргоо хадгалахад алдаа гарлаа')
    } finally {
      setSavingConfig(false)
    }
  }

  /* ─── Render ─── */
  return (
    <AdminLayout title="Зар удирдлага">
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Зар удирдлага" />

        {/* Flash Messages */}
        {successMsg && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-2 text-emerald-700 text-sm">
            <CheckIcon className="w-5 h-5" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2 text-red-700 text-sm">
            <XMarkIcon className="w-5 h-5" />
            {errorMsg}
          </div>
        )}

        {/* ─── Config: Interval ─── */}
        <div className="mb-6 rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Зар харуулах хугацааны тохиргоо</h3>
              <p className="text-xs text-slate-500">Хэрэглэгч сайт дээр зочлоход хэдэн секунд тутамд зар гарч ирэхийг тохируулна</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              <input
                type="number"
                min={5}
                value={configDraft}
                onChange={(e) => setConfigDraft(Number(e.target.value))}
                className="w-20 bg-transparent text-center font-semibold text-slate-800 outline-none text-sm"
              />
              <span className="text-xs text-slate-500">секунд</span>
            </div>
            <span className="text-xs text-slate-400">
              = {configDraft >= 60 ? `${Math.floor(configDraft / 60)} минут ${configDraft % 60 > 0 ? `${configDraft % 60} сек` : ''}` : `${configDraft} секунд`}
            </span>
            <button
              onClick={saveConfig}
              disabled={savingConfig || configDraft === config.interval_seconds}
              className="ml-auto px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium
                hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {savingConfig ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>
        </div>

        {/* ─── Add button ─── */}
        {!showForm && (
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium
              hover:bg-teal-700 transition-colors shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Шинэ зар нэмэх
          </button>
        )}

        {/* ─── Form ─── */}
        {showForm && (
          <div className="mb-6 rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">
              {editing ? 'Зар засварлах' : 'Шинэ зар нэмэх'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Гарчиг *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Зарын гарчиг..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  Дарахад шилжих холбоос
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Тайлбар</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Зарын тайлбар текст..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-700">Popup товчны тохиргоо</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Товчны текст</label>
                  <input
                    type="text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Энд дарна уу"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Үсгийн фонт</label>
                  <select
                    value={formData.button_font_family}
                    onChange={(e) => setFormData({ ...formData, button_font_family: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  >
                    {AD_FONT_OPTIONS.map((font) => (
                      <option key={font.label} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Текст өнгө</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.button_text_color}
                      onChange={(e) => setFormData({ ...formData, button_text_color: e.target.value })}
                      className="h-[38px] w-11 rounded border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      value={formData.button_text_color}
                      onChange={(e) => setFormData({ ...formData, button_text_color: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hover текст өнгө</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.button_hover_text_color}
                      onChange={(e) => setFormData({ ...formData, button_hover_text_color: e.target.value })}
                      className="h-[38px] w-11 rounded border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      value={formData.button_hover_text_color}
                      onChange={(e) => setFormData({ ...formData, button_hover_text_color: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="#ef3f0a"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Текст хэмжээ</label>
                  <input
                    type="text"
                    value={formData.button_text_size}
                    onChange={(e) => setFormData({ ...formData, button_text_size: e.target.value })}
                    placeholder="18px"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <PhotoIcon className="w-4 h-4 inline mr-1" />
                  Зураг
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg
                      file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700
                      hover:file:bg-slate-200 file:cursor-pointer cursor-pointer"
                  />
                </div>
                {imagePreview && (
                  <div className="mt-2 relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              {/* Index & Active */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Дараалал</label>
                  <input
                    type="number"
                    value={formData.index}
                    onChange={(e) => setFormData({ ...formData, index: Number(e.target.value) })}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">Идэвхтэй</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium
                  hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Хадгалж байна...' : editing ? 'Шинэчлэх' : 'Нэмэх'}
              </button>
              <button
                onClick={resetForm}
                className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium
                  hover:bg-slate-200 transition-colors"
              >
                Болих
              </button>
            </div>
          </div>
        )}

        {/* ─── Ads list ─── */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Ачааллаж байна...</div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <PhotoIcon className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">Одоогоор зар байхгүй байна</p>
            <p className="text-slate-400 text-xs mt-1">Дээрх &ldquo;Шинэ зар нэмэх&rdquo; товч дээр дарж зар нэмнэ үү</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => {
              const imgSrc = resolveUrl(ad.image_url || ad.image)
              return (
                <div
                  key={ad.id}
                  className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all
                    ${ad.active ? 'border-slate-200' : 'border-slate-200 opacity-60'}
                  `}
                >
                  <div className="flex items-stretch">
                    {/* Thumbnail */}
                    {imgSrc && (
                      <div className="relative w-36 min-h-[100px] bg-slate-100 shrink-0">
                        <Image
                          src={imgSrc}
                          alt={ad.title || 'Ad'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-800 text-sm">{ad.title || 'Гарчиггүй'}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                ad.active
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {ad.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                            </span>
                            <span className="text-[10px] text-slate-400">#{ad.index}</span>
                          </div>
                          {ad.description && (
                            <p className="text-xs text-slate-500 whitespace-pre-line mb-1">{ad.description}</p>
                          )}
                          {ad.url && (
                            <div className="flex items-center gap-1 text-xs text-indigo-500">
                              <LinkIcon className="w-3 h-3" />
                              <span className="truncate max-w-[300px]">{ad.url}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleActive(ad)}
                            className={`p-2 rounded-lg transition-colors text-xs ${
                              ad.active
                                ? 'hover:bg-amber-50 text-amber-600'
                                : 'hover:bg-emerald-50 text-emerald-600'
                            }`}
                            title={ad.active ? 'Идэвхгүй болгох' : 'Идэвхтэй болгох'}
                          >
                            {ad.active ? (
                              <XMarkIcon className="w-4 h-4" />
                            ) : (
                              <CheckIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => startEdit(ad)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            title="Засварлах"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => ad.id && handleDelete(ad.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Устгах"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── Preview section ─── */}
        {ads.filter((a) => a.active).length > 0 && (
          <div className="mt-8 mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Зарын урьдчилсан харагдац (Popup)</h3>
            <div className="mx-auto max-w-[780px] rounded-[28px] bg-[#02060c]/85 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
              <div
                className="relative mx-auto overflow-hidden bg-[#ff5a1f]"
                style={{
                  borderRadius: '28px',
                  boxShadow: '0 28px 70px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.14)',
                }}
              >
                <div className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#0b5ed7] text-white shadow-[0_10px_25px_rgba(11,94,215,0.35)]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </div>
                {(() => {
                  const activeAd = ads.find((a) => a.active)
                  if (!activeAd) return null
                  const imgSrc = resolveUrl(activeAd.image_url || activeAd.image)
                  return (
                    <>
                      {/* Image area */}
                      {imgSrc ? (
                        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
                          <img
                            src={imgSrc}
                            alt={activeAd.title || 'Ad'}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          {(activeAd.title || activeAd.description) && (
                            <div className="absolute left-5 top-5 z-10 max-w-[64%] rounded-2xl bg-black/28 px-5 py-4 text-white shadow-[0_12px_35px_rgba(0,0,0,0.18)] backdrop-blur-[3px]">
                              {activeAd.title && (
                                <h4 className="text-2xl font-black leading-tight text-white">{activeAd.title}</h4>
                              )}
                              {activeAd.description && (
                                <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-white/90">{activeAd.description}</p>
                              )}
                            </div>
                          )}
                          <div
                            className="absolute bottom-5 right-5 z-20 inline-flex items-center rounded-full border-2 border-white/85 bg-[#f05a21]/55 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_28px_rgba(0,0,0,0.28)] backdrop-blur-[2px] transition hover:bg-white sm:bottom-7 sm:right-7 sm:px-7 sm:py-3 sm:text-lg"
                            onMouseEnter={() => setPreviewButtonHovered(true)}
                            onMouseLeave={() => setPreviewButtonHovered(false)}
                          >
                            <span
                              style={{
                                color: previewButtonHovered
                                  ? activeAd.button_hover_text_color || activeAd.button_text_color || '#ef3f0a'
                                  : activeAd.button_text_color || '#ffffff',
                                fontSize: activeAd.button_text_size || '18px',
                                fontFamily: activeAd.button_font_family || undefined,
                              }}
                            >
                              {activeAd.button_text || 'Энд дарна уу'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative min-h-[360px] bg-[linear-gradient(180deg,#ff9a5d_0%,#ff4a12_68%,#ef3305_100%)] px-8 py-12 text-center text-white">
                          <h4 className="flex min-h-[280px] items-center justify-center text-5xl font-black leading-none tracking-tight">{activeAd.title}</h4>
                        </div>
                      )}

                      {/* Content area */}
                      <div className="hidden" style={{ backgroundColor: '#0a0a0f' }}>
                        {activeAd.description && (
                          <p className="text-[13px] text-white/60 leading-relaxed mb-4">{activeAd.description}</p>
                        )}
                        {activeAd.url && (
                          <div
                            className="w-full overflow-hidden rounded-xl py-3 text-center text-sm font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
                          >
                            <span className="flex items-center justify-center gap-2">
                              Дэлгэрэнгүй
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </span>
                          </div>
                        )}
                        {/* Progress bar */}
                        <div className="mt-3 h-[2px] rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full w-[35%]" style={{ background: 'linear-gradient(90deg, #0ea5e9, #6366f1)' }} />
                        </div>
                      </div>


                    </>
                  )
                })()}
              </div>
            </div>
            <p className="text-center text-xs text-slate-400 mt-3">
              Хэрэглэгчид {config.interval_seconds >= 60
                ? `${Math.floor(config.interval_seconds / 60)} минут`
                : `${config.interval_seconds} секунд`} тутамд зар popup-аар харагдана
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
