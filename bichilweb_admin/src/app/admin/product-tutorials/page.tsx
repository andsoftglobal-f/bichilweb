'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { PageHeader } from '@/components/FormElements'
import { axiosInstance } from '@/lib/axios'
import {
  PlusIcon, TrashIcon, PencilIcon,
  ArrowUpIcon, ArrowDownIcon,
  CheckIcon, XMarkIcon, PlayIcon,
  PhotoIcon, Cog6ToothIcon, FilmIcon,
  Bars3BottomLeftIcon, Bars3Icon, Bars3BottomRightIcon,
} from '@heroicons/react/24/outline'

interface Tutorial {
  id?: number
  title_mn: string
  title_en: string
  video_url: string
  thumbnail_url: string | null
  index: number
  active: boolean
}

interface TutorialConfig {
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

const DEFAULT_CONFIG: TutorialConfig = {
  title_mn: 'Бүтээгдэхүүний заавар',
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

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
  return null
}

function EditModal({ item, onSave, onClose }: {
  item: Partial<Tutorial>
  onSave: (data: Partial<Tutorial>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Tutorial>>({ ...item })
  const [saving, setSaving] = useState(false)
  const thumbPreview = form.thumbnail_url || getYouTubeThumbnail(form.video_url || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.video_url?.trim()) return
    setSaving(true)
    try { await onSave(form); onClose() } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-base font-semibold text-gray-900">{item.id ? 'Видео засах' : 'Шинэ видео нэмэх'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Видео линк <span className="text-red-500">*</span></label>
            <input type="url" value={form.video_url || ''} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..." required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {thumbPreview && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <img src={thumbPreview} alt="" className="w-20 h-14 object-cover rounded-lg" />
              <p className="text-xs text-slate-500">YouTube-аас автоматаар дүрс авах болно</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail зургийн линк <span className="text-slate-400 text-xs font-normal">(заавал биш)</span></label>
            <input type="url" value={form.thumbnail_url || ''} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value || null }))}
              placeholder="https://example.com/thumb.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Гарчиг (Монгол)</label>
            <input type="text" value={form.title_mn || ''} onChange={e => setForm(f => ({ ...f, title_mn: e.target.value }))}
              placeholder="Бүтээгдэхүүний заавар"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Гарчиг (Англи)</label>
            <input type="text" value={form.title_en || ''} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))}
              placeholder="Product Tutorial"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.active ?? true} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm text-gray-700">Идэвхтэй (хэрэглэгчдэд харагдах)</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition">Цуцлах</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#0048BA] rounded-xl hover:bg-[#003d9e] transition flex items-center gap-2 disabled:opacity-60">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckIcon className="w-4 h-4" />}
              Хадгалах
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfigTab({ showMsg }: { showMsg: (type: 'success' | 'error', text: string) => void }) {
  const [config, setConfig] = useState<TutorialConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    axiosInstance.get('/product-tutorial-config/')
      .then(res => { setConfig({ ...DEFAULT_CONFIG, ...res.data }); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await axiosInstance.patch('/product-tutorial-config/update/', config)
      showMsg('success', 'Тохиргоо хадгалагдлаа!')
    } catch {
      showMsg('error', 'Хадгалахад алдаа гарлаа')
    } finally {
      setSaving(false)
    }
  }

  const fontSizeOptions = [
    { label: 'XS', value: '1rem' },
    { label: 'S', value: '1.25rem' },
    { label: 'M', value: '1.5rem' },
    { label: 'L', value: '1.875rem' },
    { label: 'XL', value: '2.25rem' },
    { label: '2XL', value: '3rem' },
  ]
  const dividerMargin = config.title_align === 'left'
    ? '0 auto 0 0'
    : config.title_align === 'right'
      ? '0 0 0 auto'
      : '0 auto'

  if (!loaded) return <div className="flex items-center justify-center h-40 text-slate-400">Ачааллаж байна...</div>

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Урьдчилсан харагдац</p>
        </div>
        <div className="py-8 px-6" style={{ backgroundColor: config.bg_color }}>
          <h2 style={{ color: config.title_color, fontSize: config.title_font_size, fontFamily: config.title_font_family || undefined, textAlign: config.title_align, fontWeight: 700, lineHeight: 1.2 }}>
            {config.title_mn || 'Бүтээгдэхүүний заавар'}
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
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Гарчгийн текст (Монгол)</label>
          <input type="text" value={config.title_mn} onChange={e => setConfig(c => ({ ...c, title_mn: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Гарчгийн текст (Англи)</label>
          <input type="text" value={config.title_en} onChange={e => setConfig(c => ({ ...c, title_en: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Фонт хэмжээ</label>
          <div className="flex flex-wrap gap-2">
            {fontSizeOptions.map(opt => (
              <button key={opt.value} onClick={() => setConfig(c => ({ ...c, title_font_size: opt.value }))}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${config.title_font_size === opt.value ? 'bg-[#0048BA] text-white border-[#0048BA]' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}>
                {opt.label}
              </button>
            ))}
            <input type="text" value={config.title_font_size} onChange={e => setConfig(c => ({ ...c, title_font_size: e.target.value }))}
              className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1.875rem" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Үсгийн фонт</label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Үндсэн', value: '' },
              { label: 'Montserrat', value: "'Montserrat', sans-serif" },
              { label: 'Open Sans', value: "'Open Sans', sans-serif" },
              { label: 'Poppins', value: "'Poppins', sans-serif" },
              { label: 'Geist', value: "var(--font-geist-sans), sans-serif" },
            ].map(opt => (
              <button key={opt.value} onClick={() => setConfig(c => ({ ...c, title_font_family: opt.value }))}
                style={{ fontFamily: opt.value || undefined }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${config.title_font_family === opt.value ? 'bg-[#0048BA] text-white border-[#0048BA]' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <input type="text" value={config.title_font_family} onChange={e => setConfig(c => ({ ...c, title_font_family: e.target.value }))}
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Дурын фонт: 'Noto Sans', sans-serif" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Гарчгийн өнгө</label>
          <div className="flex items-center gap-3">
            <input type="color" value={config.title_color} onChange={e => setConfig(c => ({ ...c, title_color: e.target.value }))}
              className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
            <input type="text" value={config.title_color} onChange={e => setConfig(c => ({ ...c, title_color: e.target.value }))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-1.5 flex-wrap">
              {['#0f172a', '#0048BA', '#ffffff', '#1e293b', '#64748b', '#ef4444'].map(c => (
                <button key={c} onClick={() => setConfig(cfg => ({ ...cfg, title_color: c }))}
                  className={`w-7 h-7 rounded-lg border-2 transition ${config.title_color === c ? 'border-blue-500 scale-110' : 'border-transparent hover:border-slate-300'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Зураасны өнгө</label>
            <div className="flex items-center gap-3">
              <input type="color" value={config.divider_color.startsWith('#') ? config.divider_color : DEFAULT_CONFIG.divider_color} onChange={e => setConfig(c => ({ ...c, divider_color: e.target.value }))}
                className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
              <input type="text" value={config.divider_color} onChange={e => setConfig(c => ({ ...c, divider_color: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Зураасны урт</label>
            <input type="text" value={config.divider_width} onChange={e => setConfig(c => ({ ...c, divider_width: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="64px" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Зураасны бүдүүн</label>
            <input type="text" value={config.divider_height} onChange={e => setConfig(c => ({ ...c, divider_height: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="4px" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Гарчиг, зураасны зай</label>
            <input type="text" value={config.divider_margin_top} onChange={e => setConfig(c => ({ ...c, divider_margin_top: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="12px" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Зураас, доод хэсгийн зай</label>
            <input type="text" value={config.divider_margin_bottom} onChange={e => setConfig(c => ({ ...c, divider_margin_bottom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="32px" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Арын дэвсгэр өнгө</label>
          <div className="flex items-center gap-3">
            <input type="color" value={config.bg_color} onChange={e => setConfig(c => ({ ...c, bg_color: e.target.value }))}
              className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
            <input type="text" value={config.bg_color} onChange={e => setConfig(c => ({ ...c, bg_color: e.target.value }))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-1.5 flex-wrap">
              {['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#0048BA', '#0f172a'].map(c => (
                <button key={c} onClick={() => setConfig(cfg => ({ ...cfg, bg_color: c }))}
                  className={`w-7 h-7 rounded-lg border-2 transition ${config.bg_color === c ? 'border-blue-500 scale-110' : 'border-slate-300 hover:border-blue-300'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Гарчгийн байршил</label>
          <div className="flex gap-2">
            {([
              { value: 'left', icon: <Bars3BottomLeftIcon className="w-5 h-5" />, label: 'Зүүн' },
              { value: 'center', icon: <Bars3Icon className="w-5 h-5" />, label: 'Голдоо' },
              { value: 'right', icon: <Bars3BottomRightIcon className="w-5 h-5" />, label: 'Баруун' },
            ] as const).map(opt => (
              <button key={opt.value} onClick={() => setConfig(c => ({ ...c, title_align: opt.value }))}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition ${config.title_align === opt.value ? 'bg-[#0048BA] text-white border-[#0048BA]' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}>
                {opt.icon}{opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0048BA] text-white text-sm font-medium rounded-xl hover:bg-[#003d9e] transition disabled:opacity-60">
          {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckIcon className="w-4 h-4" />}
          Хадгалах
        </button>
      </div>
    </div>
  )
}

export default function ProductTutorialsPage() {
  const [items, setItems] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editItem, setEditItem] = useState<Partial<Tutorial> | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'videos' | 'config'>('videos')

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get('/product-tutorials/?all=1')
      const raw = res.data
      const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      setItems(arr)
    } catch {
      showMsg('error', 'Өгөгдөл татахад алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSave = async (data: Partial<Tutorial>) => {
    if (data.id) {
      await axiosInstance.patch(`/product-tutorials/${data.id}/`, data)
    } else {
      await axiosInstance.post('/product-tutorials/', { ...data, index: items.length, active: data.active ?? true })
    }
    showMsg('success', 'Амжилттай хадгалагдлаа!')
    fetchItems()
  }

  const handleDelete = async (id: number) => {
    try {
      await axiosInstance.delete(`/product-tutorials/${id}/`)
      showMsg('success', 'Устгагдлаа')
      fetchItems()
    } catch { showMsg('error', 'Устгахад алдаа гарлаа') }
    setDeleteConfirm(null)
  }

  const handleToggleActive = async (item: Tutorial) => {
    try {
      await axiosInstance.patch(`/product-tutorials/${item.id}/`, { active: !item.active })
      fetchItems()
    } catch { showMsg('error', 'Алдаа гарлаа') }
  }

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const newItems = [...items]
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= newItems.length) return
    ;[newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]]
    await Promise.all(newItems.map((item, i) => axiosInstance.patch(`/product-tutorials/${item.id}/`, { index: i })))
    fetchItems()
  }

  return (
    <AdminLayout title="Бүтээгдэхүүний заавар">
      {msg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${msg.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {msg.text}
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <PageHeader title="Бүтээгдэхүүний заавар" description="Нүүр хуудсанд харагдах видео зааварчилгаа" />
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
          <button onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'videos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <FilmIcon className="w-4 h-4" />Видео жагсаалт
          </button>
          <button onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'config' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Cog6ToothIcon className="w-4 h-4" />Гарчгийн тохиргоо
          </button>
        </div>
        {activeTab === 'videos' && (
          <>
            <div className="flex justify-end mb-6">
              <button onClick={() => setEditItem({ title_mn: '', title_en: '', video_url: '', thumbnail_url: null, active: true })}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0048BA] text-white text-sm font-medium rounded-xl hover:bg-[#003d9e] transition">
                <PlusIcon className="w-4 h-4" />Видео нэмэх
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48 text-slate-400">Ачааллаж байна...</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <PlayIcon className="w-10 h-10 text-slate-300" />
                <p className="text-slate-500 text-sm">Видео бүртгэгдээгүй байна</p>
                <button onClick={() => setEditItem({ title_mn: '', title_en: '', video_url: '', thumbnail_url: null, active: true })}
                  className="px-4 py-2 bg-[#0048BA] text-white text-sm rounded-xl hover:bg-[#003d9e] transition">
                  Анхны видео нэмэх
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const thumb = item.thumbnail_url || getYouTubeThumbnail(item.video_url)
                  return (
                    <div key={item.id} className={`flex items-center gap-4 p-4 bg-white rounded-2xl border ${item.active ? 'border-slate-200' : 'border-slate-100 opacity-60'} shadow-sm`}>
                      <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="w-6 h-6 text-slate-300" /></div>}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"><PlayIcon className="w-3.5 h-3.5 text-white ml-0.5" /></div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.title_mn || '(гарчиггүй)'}</p>
                        {item.title_en && <p className="text-xs text-gray-400 truncate">{item.title_en}</p>}
                        <p className="text-xs text-blue-500 truncate mt-0.5">{item.video_url}</p>
                      </div>
                      <button onClick={() => handleToggleActive(item)}
                        className={`w-10 h-6 rounded-full transition-colors shrink-0 ${item.active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${item.active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition"><ArrowUpIcon className="w-3.5 h-3.5 text-slate-500" /></button>
                        <button onClick={() => handleMove(idx, 1)} disabled={idx === items.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition"><ArrowDownIcon className="w-3.5 h-3.5 text-slate-500" /></button>
                      </div>
                      <button onClick={() => setEditItem(item)} className="p-2 rounded-xl hover:bg-blue-50 text-blue-600 transition shrink-0"><PencilIcon className="w-4 h-4" /></button>
                      {deleteConfirm === item.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleDelete(item.id!)} className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Устгах</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">Болих</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(item.id!)} className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition shrink-0"><TrashIcon className="w-4 h-4" /></button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
        {activeTab === 'config' && <ConfigTab showMsg={showMsg} />}
      </div>
      {editItem && <EditModal item={editItem} onSave={handleSave} onClose={() => setEditItem(null)} />}
    </AdminLayout>
  )
}
