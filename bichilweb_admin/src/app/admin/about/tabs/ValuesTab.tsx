'use client'
import { useState, useRef, useEffect } from 'react'
import ImageUpload from '@/components/ImageUpload'
import Modal from '@/components/Modal'
import { axiosInstance } from '@/lib/axios'
import { FONT_OPTIONS, getFontStyle } from '@/lib/fontOptions'

// ============ TYPES ============

interface TitleTranslation {
  id?: number
  language: number
  language_code?: string
  language_name?: string
  title: string
  fontcolor: string
  fontsize: number
  fontweight: string
  fontfamily: string
  letterspace: string
  textalign: string
}

interface DescTranslation {
  id?: number
  language: number
  language_code?: string
  language_name?: string
  desc: string
  fontcolor: string
  fontsize: number
  fontweight: string
  fontfamily: string
  letterspace: string
  textalign: string
}

interface CoreValueAPI {
  id?: number
  file?: string | null
  file_ratio?: string
  card_size?: string
  index: number
  visible: boolean
  title_translations: TitleTranslation[]
  desc_translations: DescTranslation[]
}

interface Value {
  id: string
  title_mn: string
  title_en: string
  desc_mn: string
  desc_en: string
  image_url?: string
  image_aspect_ratio?: string
  card_size?: string
  // Title styling
  title_color: string
  title_size: number
  title_weight: string
  title_family: string
  title_letter_spacing: number
  title_textalign: string
  // Description styling
  desc_color: string
  desc_size: number
  desc_weight: string
  desc_family: string
  desc_letter_spacing: number
  desc_textalign: string
  // Backend fields
  backend_id?: number
  index?: number
  visible?: boolean
  // Sub-items (multiple title+desc blocks with icon)
  sub_items?: SubItem[]
}

interface SubItem {
  icon: string
  title_mn: string
  title_en: string
  desc_mn: string
  desc_en: string
  // Sub-item title styling
  title_color?: string
  title_size?: number
  title_weight?: string
  title_textalign?: string
  // Sub-item desc styling
  desc_color?: string
  desc_size?: number
  desc_weight?: string
  desc_textalign?: string
}

const ICON_OPTIONS = [
  '🏆', '💡', '🤝', '🎯', '⭐', '💪', '🌱', '🔒', '💎', '🌍',
  '❤️', '📈', '🏗️', '🔑', '🛡️', '🔥', '📊', '🎓', '👥', '🏛️',
  '💰', '📱', '🌟', '🎨', '📋', '✨', '🧭', '🏅'
]

// ValuesTab is self-contained — fetches + saves to /core-value/ API

const apiToFrontend = (apiData: CoreValueAPI): Value | null => {
  // Skip if no title translations
  if (!apiData.title_translations || apiData.title_translations.length === 0) {
    console.warn(`CoreValue ${apiData.id} has no title translations, skipping...`)
    return null
  }

  const mnTitleTranslation = apiData.title_translations.find(t => t.language === 1)
  const enTitleTranslation = apiData.title_translations.find(t => t.language === 2)
  const fallbackTitleTranslation = apiData.title_translations[0]
  const titleTranslation = mnTitleTranslation || enTitleTranslation || fallbackTitleTranslation

  const mnDescTranslation = apiData.desc_translations?.find(t => t.language === 1)
  const enDescTranslation = apiData.desc_translations?.find(t => t.language === 2)
  const fallbackDescTranslation = apiData.desc_translations?.[0]
  const descTranslation = mnDescTranslation || enDescTranslation || fallbackDescTranslation

  return {
    id: apiData.id?.toString() || Date.now().toString(),
    backend_id: apiData.id,
    index: apiData.index,
    visible: apiData.visible,
    title_mn: mnTitleTranslation?.title || titleTranslation?.title || 'Нэргүй',
    title_en: enTitleTranslation?.title || titleTranslation?.title || 'Untitled',
    desc_mn: mnDescTranslation?.desc || descTranslation?.desc || '',
    desc_en: enDescTranslation?.desc || descTranslation?.desc || '',
    image_url: apiData.file || '',
    image_aspect_ratio: apiData.file_ratio || '1 / 1',
    card_size: apiData.card_size || 'small',
    title_color: titleTranslation?.fontcolor || '#0048BA',
    title_size: titleTranslation?.fontsize || 18,
    title_weight: titleTranslation?.fontweight || 'semibold',
    title_family: titleTranslation?.fontfamily || '',
    title_letter_spacing: parseFloat(titleTranslation?.letterspace || '0'),
    title_textalign: titleTranslation?.textalign || 'left',
    desc_color: descTranslation?.fontcolor || '#6b7280',
    desc_size: descTranslation?.fontsize || 14,
    desc_weight: descTranslation?.fontweight || 'normal',
    desc_family: descTranslation?.fontfamily || '',
    desc_letter_spacing: parseFloat(descTranslation?.letterspace || '0'),
    desc_textalign: descTranslation?.textalign || 'left',
    sub_items: (() => {
      try {
        const mnDesc = mnDescTranslation?.desc || ''
        const enDesc = enDescTranslation?.desc || ''
        const mnItems = JSON.parse(mnDesc)
        const enItems = JSON.parse(enDesc)
        if (Array.isArray(mnItems) && mnItems.length > 0 && mnItems[0].title !== undefined) {
          return mnItems.map((item: any, i: number) => ({
            icon: item.icon || '',
            title_mn: item.title || '',
            title_en: enItems[i]?.title || '',
            desc_mn: item.desc || '',
            desc_en: enItems[i]?.desc || '',
            title_color: item.title_color,
            title_size: item.title_size,
            title_weight: item.title_weight,
            title_textalign: item.title_textalign,
            desc_color: item.desc_color,
            desc_size: item.desc_size,
            desc_weight: item.desc_weight,
            desc_textalign: item.desc_textalign,
          }))
        }
      } catch {}
      return undefined
    })()
  }
}

const frontendToApi = (value: Value): Omit<CoreValueAPI, 'id'> => {
  const apiData: Omit<CoreValueAPI, 'id'> = {
    file: value.image_url || null,
    file_ratio: value.image_aspect_ratio || '16 / 9',
    card_size: value.card_size || 'small',
    index: value.index || 0,
    visible: value.visible !== false,
    title_translations: [
      {
        language: 2,
        title: value.title_en,
        fontcolor: value.title_color,
        fontsize: value.title_size,
        fontweight: value.title_weight,
        fontfamily: value.title_family,
        letterspace: value.title_letter_spacing.toString(),
        textalign: value.title_textalign || 'left'
      },
      {
        language: 1,
        title: value.title_mn,
        fontcolor: value.title_color,
        fontsize: value.title_size,
        fontweight: value.title_weight,
        fontfamily: value.title_family,
        letterspace: value.title_letter_spacing.toString(),
        textalign: value.title_textalign || 'left'
      }
    ],
    desc_translations: []
  }

  // Add desc_translations - sub_items as JSON or plain text
  if (value.sub_items && value.sub_items.length > 0) {
    const mnJson = JSON.stringify(value.sub_items.map(s => ({ icon: s.icon, title: s.title_mn, desc: s.desc_mn, title_color: s.title_color, title_size: s.title_size, title_weight: s.title_weight, title_textalign: s.title_textalign, desc_color: s.desc_color, desc_size: s.desc_size, desc_weight: s.desc_weight, desc_textalign: s.desc_textalign })))
    const enJson = JSON.stringify(value.sub_items.map(s => ({ icon: s.icon, title: s.title_en, desc: s.desc_en, title_color: s.title_color, title_size: s.title_size, title_weight: s.title_weight, title_textalign: s.title_textalign, desc_color: s.desc_color, desc_size: s.desc_size, desc_weight: s.desc_weight, desc_textalign: s.desc_textalign })))
    apiData.desc_translations = [
      {
        language: 2,
        desc: enJson,
        fontcolor: value.desc_color,
        fontsize: value.desc_size,
        fontweight: value.desc_weight,
        fontfamily: value.desc_family,
        letterspace: value.desc_letter_spacing.toString(),
        textalign: value.desc_textalign || 'left'
      },
      {
        language: 1,
        desc: mnJson,
        fontcolor: value.desc_color,
        fontsize: value.desc_size,
        fontweight: value.desc_weight,
        fontfamily: value.desc_family,
        letterspace: value.desc_letter_spacing.toString(),
        textalign: value.desc_textalign || 'left'
      }
    ]
  } else if (value.desc_en || value.desc_mn) {
    apiData.desc_translations = [
      {
        language: 2,
        desc: value.desc_en,
        fontcolor: value.desc_color,
        fontsize: value.desc_size,
        fontweight: value.desc_weight,
        fontfamily: value.desc_family,
        letterspace: value.desc_letter_spacing.toString(),
        textalign: value.desc_textalign || 'left'
      },
      {
        language: 1,
        desc: value.desc_mn,
        fontcolor: value.desc_color,
        fontsize: value.desc_size,
        fontweight: value.desc_weight,
        fontfamily: value.desc_family,
        letterspace: value.desc_letter_spacing.toString(),
        textalign: value.desc_textalign || 'left'
      }
    ]
  }

  return apiData
}

export default function ValuesTab() {
  const [values, setValues] = useState<Value[]>([])
  const [previewLang, setPreviewLang] = useState<'mn' | 'en'>('mn')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingValueId, setEditingValueId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [safeZoneOpen, setSafeZoneOpen] = useState(false)
  const [showSafeZone, setShowSafeZone] = useState(true)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const valuesGridRef = useRef<HTMLDivElement | null>(null)
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set())

  const editingValue = values.find(v => v.id === editingValueId)

  // ============ API FUNCTIONS ============

  const extractArr = <T,>(raw: unknown): T[] =>
    Array.isArray(raw) ? raw : Array.isArray((raw as Record<string, unknown>)?.results) ? (raw as Record<string, unknown>).results as T[] : []

  const fetchCoreValues = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/core-value/')

      const allValues = extractArr<CoreValueAPI>(response.data)
        .map(apiToFrontend)
        .filter((v): v is Value => v !== null)
        .sort((a, b) => (a.index || 0) - (b.index || 0))

      setValues(allValues)
      setVisibleCards(new Set(allValues.map(v => v.id)))
    } catch (error) {
      console.error('❌ Error fetching values:', error)
      setValues([])
      setVisibleCards(new Set())
    } finally {
      setLoading(false)
    }
  }

  const createCoreValue = async (value: Value) => {
    try {
      setLoading(true)
      const apiData = frontendToApi(value)
      const response = await axiosInstance.post<CoreValueAPI>('/core-value/', apiData)
      
      const newValue = apiToFrontend(response.data)
      if (newValue) {
        setValues(prev => [...prev, newValue].sort((a, b) => {
          // Keep vision and mission at top
          if (a.id === 'vision') return -1
          if (b.id === 'vision') return 1
          if (a.id === 'mission') return -1
          if (b.id === 'mission') return 1
          return (a.index || 0) - (b.index || 0)
        }))
        setVisibleCards(prev => new Set([...prev, newValue.id]))
        
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        
        return newValue
      }
    } catch (error) {
      console.error('❌ Error creating value:', error)
      alert('Алдаа гарлаа! Үнэт зүйлс нэмэгдсэнгүй.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateCoreValue = async (value: Value) => {
    try {
      setLoading(true)
      const apiData = frontendToApi(value)

      const response = await axiosInstance.put<CoreValueAPI>(
        `/core-value/${value.backend_id}/`,
        apiData
      )

      const updatedValue = apiToFrontend(response.data)
      if (updatedValue) {
        setValues(prev => prev.map(v => v.backend_id === value.backend_id ? updatedValue : v))

        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)

        return updatedValue
      }
    } catch (error) {
      console.error('❌ Error updating value:', error)
      alert('Алдаа гарлаа! Үнэт зүйлс шинэчлэгдсэнгүй.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteCoreValue = async (value: Value) => {
    try {
      setLoading(true)
      await axiosInstance.delete(`/core-value/${value.backend_id}/`)

      setValues(prev => prev.filter(v => v.id !== value.id))

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('❌ Error deleting value:', error)
      alert('Алдаа гарлаа! Үнэт зүйлс устгагдсангүй.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // ============ LIFECYCLE ============

  useEffect(() => {
    fetchCoreValues()
  }, [])

  useEffect(() => {
    if (!valuesGridRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-value-id')
            if (id) {
              setVisibleCards(prev => new Set([...prev, id]))
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    const cards = valuesGridRef.current.querySelectorAll('[data-value-id]')
    cards.forEach(card => observer.observe(card))

    return () => observer.disconnect()
  }, [values])

  // ============ HANDLERS ============

  const handleEditValue = (id: string) => {
    setEditingValueId(id)
    setEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    // Remove unsaved new values (no backend_id) when closing without saving
    if (editingValueId) {
      const val = values.find(v => v.id === editingValueId)
      if (val && !val.backend_id) {
        setValues(prev => prev.filter(v => v.id !== editingValueId))
      }
    }
    setEditModalOpen(false)
    setEditingValueId(null)
  }

  const handleAddValue = () => {
    const coreValuesOnly = values.filter(v => !['vision', 'mission'].includes(v.id))
    const newValue: Value = {
      id: Date.now().toString(),
      index: coreValuesOnly.length,
      visible: true,
      card_size: 'small',
      title_mn: '',
      title_en: '',
      desc_mn: '',
      desc_en: '',
      image_url: '',
      image_aspect_ratio: '1 / 1',
      title_color: '#0048BA',
      title_size: 18,
      title_weight: 'semibold',
      title_family: '',
      title_letter_spacing: 0,
      title_textalign: 'left',
      desc_color: '#6b7280',
      desc_size: 14,
      desc_weight: 'normal',
      desc_family: '',
      desc_letter_spacing: 0,
      desc_textalign: 'left'
    }
    
    setValues(prev => [...prev, newValue])
    setEditingValueId(newValue.id)
    setEditModalOpen(true)
  }

  const handleDeleteValue = async (id: string) => {
    const value = values.find(v => v.id === id)
    if (!value) return
    
    if (value.backend_id) {
      await deleteCoreValue(value)
    } else {
      setValues(values.filter(v => v.id !== id))
    }
  }

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (pendingDeleteId) {
      try {
        await handleDeleteValue(pendingDeleteId)
        handleCloseEditModal()
      } catch (e) {
        console.error('Delete failed:', e)
      } finally {
        setDeleteConfirmOpen(false)
        setPendingDeleteId(null)
      }
    }
  }

  const handleSaveValues = async () => {
    if (!editingValue) return

    if (editingValue.backend_id) {
      await updateCoreValue(editingValue)
    } else {
      await createCoreValue(editingValue)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 z-50">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <p className="text-sm font-semibold text-green-900">Амжилттай!</p>
              <p className="text-sm text-green-800">Үнэт зүйлсийг хадгалалаа</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-sm text-slate-600">Уншиж байна...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">Үнэт зүйлс</h2>
        <button
          onClick={handleAddValue}
          disabled={loading}
          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Нэмэх
        </button>
      </div>

      {/* ══════════ LIVE PREVIEW WITH SAFE ZONE ══════════ */}
      <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50">
        {/* Header — matches CTA style */}
        <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-600 uppercase">Live Preview</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Safe Zone Toggle */}
            <button
              type="button"
              onClick={() => setShowSafeZone(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${showSafeZone ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Safe Zone {showSafeZone ? 'ON' : 'OFF'}
            </button>
            <div className="w-px h-5 bg-slate-200" />
            {/* Desktop / Mobile */}
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${previewDevice === 'desktop' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>
              Desktop
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${previewDevice === 'mobile' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
              Mobile
            </button>
            <div className="w-px h-5 bg-slate-200" />
            {/* Language Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setPreviewLang('mn')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${previewLang === 'mn' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                MN
              </button>
              <button
                onClick={() => setPreviewLang('en')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${previewLang === 'en' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Preview body */}
        <div className="p-4 sm:p-6">
          {/* Desktop Preview */}
          {previewDevice === 'desktop' && (
          <div className="bg-white rounded-xl p-6 sm:p-10" ref={valuesGridRef}>
          <div className="max-w-7xl mx-auto space-y-16">

            {/* ═══ HERO: grid-cols-2, gap-5, min-h-240, rounded-3xl ═══ */}
            {values.filter(v => ['vision', 'mission'].includes(v.id)).length > 0 && (
              <div>
                {showSafeZone && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-rose-100 text-rose-600 text-[9px] font-bold px-2 py-0.5 rounded">HERO SECTION</span>
                    <span className="text-[9px] text-slate-400 font-mono">grid-cols-2 · gap-5 · min-h-240px · rounded-3xl</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-5">
                  {values.filter(v => ['mission', 'vision'].includes(v.id)).sort((a, b) => a.id === 'mission' ? -1 : 1).map((value) => {
                    const label = value.id === 'mission' ? (previewLang === 'mn' ? 'Эрхэм зорилго' : 'Mission') : (previewLang === 'mn' ? 'Алсын хараа' : 'Vision')
                    const szBorder = value.id === 'mission' ? 'ring-purple-400' : 'ring-blue-400'
                    const szTag = value.id === 'mission' ? 'bg-purple-500' : 'bg-blue-500'
                    return (
                      <div
                        key={value.id}
                        data-value-id={value.id}
                        className={`group relative rounded-3xl overflow-hidden min-h-[240px] flex flex-col cursor-pointer transition-shadow hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] ${showSafeZone ? `ring-2 ring-dashed ${szBorder}` : ''}`}
                        style={{ background: '#f3f4f6' }}
                        onClick={() => handleEditValue(value.id)}
                      >
                        {/* Full-bleed image */}
                        {value.image_url && <img src={value.image_url} alt={label} className="absolute inset-0 w-full h-full object-cover" />}
                        {value.image_url && <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.70) 40%, transparent 100%)' }} />}
                        {!value.image_url && (
                          <>
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #f5f7fa 0%, #ebeef3 35%, #f0f2f6 55%, #e9ecf1 80%, #edf0f4 100%)' }} />
                            <div className="absolute inset-0 opacity-60" style={{ background: 'linear-gradient(120deg, transparent 10%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0.2) 55%, transparent 75%)' }} />
                          </>
                        )}

                        {/* Safe zone overlays */}
                        {showSafeZone && (
                          <div className="absolute inset-0 z-10 pointer-events-none">
                            {/* Text zone — left 60% (gradient + text covers this area) */}
                            <div className="absolute left-0 top-0 bottom-0 w-[60%] border-r-2 border-dashed border-red-400/70" style={{ background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(239,68,68,0.08) 4px, rgba(239,68,68,0.08) 8px)' }}>
                              <div className="absolute inset-[36px] border border-dashed border-orange-400/40 rounded" />
                              <span className="absolute top-1 left-1 text-[7px] font-mono text-orange-400 bg-white/70 px-1 rounded">← 36px (p-9)</span>
                              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-red-500/80 bg-white/80 px-2 py-1 rounded shadow-sm whitespace-nowrap">⚠️ ТЕКСТ БҮС — 60%</span>
                            </div>
                            {/* Image safe zone — right 40% (image clearly visible here) */}
                            <div className="absolute right-0 top-0 bottom-0 w-[40%] border-2 border-emerald-400/50 rounded-r-3xl" style={{ background: 'rgba(16,185,129,0.06)' }}>
                              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600/80 bg-white/80 px-2 py-1 rounded shadow-sm whitespace-nowrap">✅ ГОЛ ДҮРС ЭНД</span>
                              <span className="absolute bottom-2 right-2 text-[7px] font-mono text-emerald-500 bg-white/70 px-1 rounded">~40% харагдана</span>
                            </div>
                            {/* Card label */}
                            <span className={`absolute top-2 left-3 ${szTag} text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow z-20`}>
                              {value.id === 'mission' ? 'ЭРХЭМ ЗОРИЛГО' : 'АЛСЫН ХАРАА'}
                            </span>
                            {/* Dimension label */}
                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-mono text-slate-500 bg-white/80 px-1.5 py-0.5 rounded z-20">~630×240px · 2.5:1 · object-cover</span>
                          </div>
                        )}

                        {/* Content — exactly like frontend: p-9, justify-center, max-w-[60%] */}
                        <div className="relative z-10 p-9 flex flex-col justify-center h-full max-w-[60%]">
                          <h2 className="text-[26px] font-extrabold text-gray-900 mb-1 leading-tight tracking-tight" style={{
                            color: value.title_color,
                            fontWeight: value.title_weight,
                            ...getFontStyle(value.title_family),
                          }}>
                            {label}
                          </h2>
                          <p className="text-[15px] text-gray-500 leading-relaxed" style={{
                            color: value.desc_color,
                            ...getFontStyle(value.desc_family),
                          }}>
                            {previewLang === 'mn' ? value.desc_mn : value.desc_en}
                          </p>
                        </div>

                        {/* Hover */}
                        <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow">✏️ Засах</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ═══ BENTO GRID: grid-cols-[5fr_3fr_3fr], gap-5, minmax(180px, auto), rounded-3xl ═══ */}
            {values.filter(v => !['vision', 'mission'].includes(v.id)).length > 0 && (
              <div>
                {showSafeZone && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-rose-100 text-rose-600 text-[9px] font-bold px-2 py-0.5 rounded">BENTO GRID</span>
                    <span className="text-[9px] text-slate-400 font-mono">grid-cols-[5fr_3fr_3fr] · gap-5 · minmax(180px, auto) · rounded-3xl</span>
                  </div>
                )}

                {/* Section heading — matches frontend */}
                <div className="text-center mb-16">
                  <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-3">
                    {previewLang === 'mn' ? 'Бидний итгэл үнэмшил' : 'What we believe'}
                  </span>
                  <h2 className="text-[44px] font-extrabold text-gray-900 tracking-tight">
                    {previewLang === 'mn' ? 'Үнэт зүйл' : 'Core Values'}
                  </h2>
                </div>

                <div className="grid grid-cols-[5fr_3fr_3fr] gap-5" style={{ gridAutoRows: 'minmax(180px, auto)' }}>
                  {values.filter(v => !['vision', 'mission'].includes(v.id)).map((value, i) => {
                    const sz = value.card_size || 'small'
                    const hasImg = !!value.image_url
                    const title = previewLang === 'mn' ? value.title_mn : value.title_en
                    const desc = previewLang === 'mn' ? value.desc_mn : value.desc_en
                    const glassBg = 'linear-gradient(145deg, #f5f7fa 0%, #ebeef3 35%, #f0f2f6 55%, #e9ecf1 80%, #edf0f4 100%)'
                    const shimmerBg = 'linear-gradient(120deg, transparent 10%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0.2) 55%, transparent 75%)'

                    const szBorder = sz === 'large' ? 'ring-emerald-400' : sz === 'vertical' ? 'ring-violet-400' : 'ring-amber-400'
                    const szTagBg = sz === 'large' ? 'bg-emerald-500' : sz === 'vertical' ? 'bg-violet-500' : 'bg-amber-500'
                    const szTagLabel = sz === 'large' ? 'ТОМ · row-span-2' : sz === 'vertical' ? 'БОСОО · row-span-2' : 'ЖИЖИГ'

                    /* ── LARGE (col-span-1, row-span-2) ── */
                    if (sz === 'large') {
                      return (
                        <div
                          key={value.id}
                          data-value-id={value.id}
                          className={`group relative rounded-3xl overflow-hidden flex flex-col col-span-1 row-span-2 cursor-pointer ${showSafeZone ? `ring-2 ring-dashed ${szBorder}` : ''}`}
                          style={{ background: glassBg }}
                          onClick={() => handleEditValue(value.id)}
                        >
                          {hasImg && <img src={value.image_url} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                          {hasImg && <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3) 50%, transparent)' }} />}
                          {!hasImg && <div className="absolute inset-0" style={{ background: shimmerBg }} />}

                          {showSafeZone && (
                            <div className="absolute inset-0 z-10 pointer-events-none">
                              {/* Image safe zone — top 60% */}
                              <div className="absolute left-0 right-0 top-0 h-[60%] border-2 border-emerald-400/50 rounded-t-3xl" style={{ background: 'rgba(16,185,129,0.06)' }}>
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600/80 bg-white/80 px-2 py-1 rounded shadow-sm whitespace-nowrap">✅ ГОЛ ДҮРС ЭНД</span>
                              </div>
                              {/* Text zone — bottom 40% (gradient + text) */}
                              <div className="absolute left-0 right-0 bottom-0 h-[40%] border-t-2 border-dashed border-red-400/70" style={{ background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(239,68,68,0.08) 4px, rgba(239,68,68,0.08) 8px)' }}>
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold bg-black/50 px-2 py-1 rounded shadow-sm text-white whitespace-nowrap">⚠️ ТЕКСТ БҮС — p-11 (44px)</span>
                              </div>
                              {/* Card label */}
                              <span className={`absolute top-2 left-2 ${szTagBg} text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow z-20`}>{szTagLabel}</span>
                              {/* Dimension */}
                              <span className="absolute top-2 right-2 text-[7px] font-mono text-slate-300 bg-black/50 px-1.5 py-0.5 rounded z-20">~564×380px · 3:2</span>
                            </div>
                          )}

                          <div className="relative z-10 p-11 mt-auto">
                            <h3 className={`text-[32px] font-extrabold mb-1 leading-tight tracking-tight ${hasImg ? 'text-white' : 'text-gray-900'}`} style={{
                              color: hasImg ? undefined : value.title_color, fontWeight: value.title_weight, ...getFontStyle(value.title_family),
                            }}>{title}</h3>
                            {desc && <p className={`text-[15px] leading-relaxed ${hasImg ? 'text-white/85' : 'text-gray-500'}`}>{desc}</p>}
                            {value.sub_items && value.sub_items.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {value.sub_items.map((item: any, si: number) => (
                                  <div key={si} className="flex items-start gap-2">
                                    {item.icon && <span className="text-base mt-0.5 shrink-0">{item.icon}</span>}
                                    <span className={`text-sm font-semibold ${hasImg ? 'text-white/90' : 'text-gray-800'}`}>{previewLang === 'mn' ? item.title_mn : item.title_en}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <div className="flex gap-2">
                              <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow">✏️ Засах</span>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(value.id) }} className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-red-600 transition-colors">🗑</button>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    /* ── VERTICAL (row-span-2) ── */
                    if (sz === 'vertical') {
                      return (
                        <div
                          key={value.id}
                          data-value-id={value.id}
                          className={`group relative rounded-3xl overflow-hidden flex flex-col row-span-2 cursor-pointer ${showSafeZone ? `ring-2 ring-dashed ${szBorder}` : ''}`}
                          style={{ background: glassBg }}
                          onClick={() => handleEditValue(value.id)}
                        >
                          {hasImg && <img src={value.image_url} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                          {hasImg && <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3) 50%, transparent)' }} />}
                          {!hasImg && <div className="absolute inset-0" style={{ background: shimmerBg }} />}

                          {showSafeZone && (
                            <div className="absolute inset-0 z-10 pointer-events-none">
                              {/* Image safe zone — top 65% */}
                              <div className="absolute left-0 right-0 top-0 h-[65%] border-2 border-emerald-400/50 rounded-t-3xl" style={{ background: 'rgba(16,185,129,0.06)' }}>
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600/80 bg-white/80 px-2 py-1 rounded shadow-sm whitespace-nowrap">✅ ГОЛ ДҮРС ЭНД</span>
                              </div>
                              {/* Text zone — bottom 35% */}
                              <div className="absolute left-0 right-0 bottom-0 h-[35%] border-t-2 border-dashed border-red-400/70" style={{ background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(239,68,68,0.08) 4px, rgba(239,68,68,0.08) 8px)' }}>
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold bg-black/50 px-2 py-1 rounded shadow-sm text-white whitespace-nowrap">⚠️ ТЕКСТ БҮС — p-7 (28px)</span>
                              </div>
                              {/* Card label */}
                              <span className={`absolute top-2 left-2 ${szTagBg} text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow z-20`}>{szTagLabel}</span>
                              {/* Dimension */}
                              <span className="absolute top-2 right-2 text-[7px] font-mono text-slate-300 bg-black/50 px-1.5 py-0.5 rounded z-20">~338×380px · 9:10</span>
                            </div>
                          )}

                          <div className="relative z-10 p-7 mt-auto">
                            <h3 className={`text-xl font-bold mb-1 leading-tight ${hasImg ? 'text-white' : 'text-gray-900'}`} style={{
                              color: hasImg ? undefined : value.title_color, fontWeight: value.title_weight, ...getFontStyle(value.title_family),
                            }}>{title}</h3>
                            {desc && <p className={`text-[15px] leading-relaxed ${hasImg ? 'text-white/85' : 'text-gray-500'}`}>{desc}</p>}
                            {value.sub_items && value.sub_items.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {value.sub_items.map((item: any, si: number) => (
                                  <div key={si} className="flex items-start gap-1.5">
                                    {item.icon && <span className="text-sm mt-0.5 shrink-0">{item.icon}</span>}
                                    <span className={`text-sm font-semibold ${hasImg ? 'text-white/90' : 'text-gray-800'}`}>{previewLang === 'mn' ? item.title_mn : item.title_en}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <div className="flex gap-2">
                              <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow">✏️ Засах</span>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(value.id) }} className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-red-600 transition-colors">🗑</button>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    /* ── SMALL: with image ── */
                    if (hasImg) {
                      return (
                        <div
                          key={value.id}
                          data-value-id={value.id}
                          className={`group relative rounded-3xl overflow-hidden flex flex-col justify-end cursor-pointer ${showSafeZone ? `ring-2 ring-dashed ${szBorder}` : ''}`}
                          onClick={() => handleEditValue(value.id)}
                        >
                          <img src={value.image_url} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.25) 50%, transparent)' }} />

                          {showSafeZone && (
                            <div className="absolute inset-0 z-10 pointer-events-none">
                              {/* Image safe zone — top 65% */}
                              <div className="absolute left-0 right-0 top-0 h-[65%] border-2 border-emerald-400/50 rounded-t-3xl" style={{ background: 'rgba(16,185,129,0.06)' }}>
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600/80 bg-white/80 px-2 py-1 rounded shadow-sm whitespace-nowrap">✅ ГОЛ ДҮРС ЭНД</span>
                              </div>
                              {/* Text zone — bottom 35% */}
                              <div className="absolute left-0 right-0 bottom-0 h-[35%] border-t-2 border-dashed border-red-400/70" style={{ background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(239,68,68,0.08) 4px, rgba(239,68,68,0.08) 8px)' }}>
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold bg-black/50 px-2 py-1 rounded shadow-sm text-white whitespace-nowrap">⚠️ ТЕКСТ БҮС — px-6 py-5</span>
                              </div>
                              {/* Card label */}
                              <span className={`absolute top-2 left-2 ${szTagBg} text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow z-20`}>{szTagLabel}</span>
                              {/* Dimension */}
                              <span className="absolute top-2 right-2 text-[7px] font-mono text-slate-300 bg-black/50 px-1.5 py-0.5 rounded z-20">~338×180px · 2:1</span>
                            </div>
                          )}

                          <div className="relative z-10 px-6 py-5">
                            <h3 className="text-lg font-bold text-white leading-snug" style={{ fontWeight: value.title_weight, ...getFontStyle(value.title_family) }}>{title}</h3>
                            {desc && <p className="text-white/80 text-sm leading-relaxed mt-1 line-clamp-3">{desc}</p>}
                            {value.sub_items && value.sub_items.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {value.sub_items.slice(0, 3).map((item: any, si: number) => (
                                  <div key={si} className="flex items-center gap-1.5">
                                    {item.icon && <span className="text-sm">{item.icon}</span>}
                                    <span className="text-sm font-semibold text-white/90">{previewLang === 'mn' ? item.title_mn : item.title_en}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <div className="flex gap-2">
                              <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow">✏️ Засах</span>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(value.id) }} className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-red-600 transition-colors">🗑</button>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    /* ── SMALL: text only (glassmorphism) ── */
                    return (
                      <div
                        key={value.id}
                        data-value-id={value.id}
                        className={`group relative rounded-3xl overflow-hidden flex flex-col p-8 cursor-pointer ${showSafeZone ? `ring-2 ring-dashed ${szBorder}` : ''}`}
                        style={{ background: glassBg }}
                        onClick={() => handleEditValue(value.id)}
                      >
                        <div className="absolute inset-0 pointer-events-none" style={{ background: shimmerBg }} />

                        {showSafeZone && (
                          <div className="absolute inset-0 z-10 pointer-events-none">
                            <span className={`absolute top-2 left-2 ${szTagBg} text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow`}>{szTagLabel} · TEXT</span>
                          </div>
                        )}

                        <h3 className="text-2xl font-extrabold text-gray-900 mb-1 relative z-10 tracking-tight" style={{
                          color: value.title_color, fontWeight: value.title_weight, ...getFontStyle(value.title_family),
                        }}>{title}</h3>
                        {desc && <p className="text-[15px] text-gray-500 leading-relaxed relative z-10">{desc}</p>}
                        {value.sub_items && value.sub_items.length > 0 && (
                          <div className="mt-2 space-y-1 relative z-10">
                            {value.sub_items.map((item: any, si: number) => (
                              <div key={si} className="flex items-start gap-2">
                                {item.icon && <span className="text-base mt-0.5 shrink-0">{item.icon}</span>}
                                <div>
                                  <span className="text-sm font-semibold text-gray-800">{previewLang === 'mn' ? item.title_mn : item.title_en}</span>
                                  {(previewLang === 'mn' ? item.desc_mn : item.desc_en) && (
                                    <p className="text-sm text-gray-500">{previewLang === 'mn' ? item.desc_mn : item.desc_en}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <div className="flex gap-2">
                            <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow">✏️ Засах</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(value.id) }} className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-red-600 transition-colors">🗑</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {values.filter(v => !['vision', 'mission'].includes(v.id)).length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                <div className="text-5xl mb-3">📝</div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">Үндсэн үнэт зүйлс байхгүй</h4>
                <p className="text-xs text-slate-500 mb-4">Эхний үнэт зүйлсээ нэмнэ үү</p>
                <button onClick={handleAddValue} disabled={loading} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  + Нэмэх
                </button>
              </div>
            )}

          </div>
        </div>
          )}

          {/* Mobile Preview */}
          {previewDevice === 'mobile' && (
            <div className="max-w-[375px] mx-auto bg-white rounded-[2rem] shadow-xl border-4 border-slate-800 overflow-hidden">
              {/* Phone notch */}
              <div className="h-6 bg-slate-800 flex items-center justify-center">
                <div className="w-16 h-3 bg-slate-700 rounded-full" />
              </div>
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {/* Hero cards stacked */}
                {values.filter(v => ['vision', 'mission'].includes(v.id)).length > 0 && (
                  <div className="space-y-3">
                    {values.filter(v => ['mission', 'vision'].includes(v.id)).sort((a, b) => a.id === 'mission' ? -1 : 1).map((value) => {
                      const label = value.id === 'mission' ? (previewLang === 'mn' ? 'Эрхэм зорилго' : 'Mission') : (previewLang === 'mn' ? 'Алсын хараа' : 'Vision')
                      const szBorder = value.id === 'mission' ? 'ring-purple-400' : 'ring-blue-400'
                      return (
                        <div
                          key={value.id}
                          className={`relative rounded-2xl overflow-hidden min-h-[200px] flex flex-col cursor-pointer ${showSafeZone ? `ring-2 ring-dashed ${szBorder}` : ''}`}
                          style={{ background: '#f3f4f6' }}
                          onClick={() => handleEditValue(value.id)}
                        >
                          {value.image_url && <img src={value.image_url} alt={label} className="absolute inset-0 w-full h-full object-cover" />}
                          {value.image_url && <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.80) 50%, rgba(255,255,255,0.30) 100%)' }} />}
                          {!value.image_url && (
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #f5f7fa 0%, #ebeef3 35%, #f0f2f6 55%, #e9ecf1 80%, #edf0f4 100%)' }} />
                          )}
                          {showSafeZone && (
                            <div className="absolute inset-0 z-10 pointer-events-none">
                              <div className="absolute top-2 left-2 bg-purple-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                                {value.id === 'mission' ? 'ЭРХЭМ ЗОРИЛГО' : 'АЛСЫН ХАРАА'} · mobile
                              </div>
                            </div>
                          )}
                          <div className="relative z-10 p-5 flex flex-col justify-end h-full">
                            <h3 className="text-lg font-extrabold text-gray-900 mb-1 leading-tight" style={{ color: value.title_color, fontWeight: value.title_weight, ...getFontStyle(value.title_family) }}>
                              {label}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3" style={{ color: value.desc_color, ...getFontStyle(value.desc_family) }}>
                              {previewLang === 'mn' ? value.desc_mn : value.desc_en}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {/* Bento cards stacked 2-col */}
                {values.filter(v => !['vision', 'mission'].includes(v.id)).length > 0 && (
                  <div>
                    <div className="text-center mb-4">
                      <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-blue-600">{previewLang === 'mn' ? 'Бидний итгэл үнэмшил' : 'What we believe'}</span>
                      <h3 className="text-lg font-extrabold text-gray-900">{previewLang === 'mn' ? 'Үнэт зүйл' : 'Core Values'}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2" style={{ gridAutoRows: 'minmax(120px, auto)' }}>
                      {values.filter(v => !['vision', 'mission'].includes(v.id)).map((value) => {
                        const sz = value.card_size || 'small'
                        const hasImg = !!value.image_url
                        const title = previewLang === 'mn' ? value.title_mn : value.title_en
                        const spanCls = sz === 'large' ? 'col-span-2' : sz === 'vertical' ? 'row-span-2' : ''
                        const szBorder = sz === 'large' ? 'ring-emerald-400' : sz === 'vertical' ? 'ring-violet-400' : 'ring-amber-400'

                        return (
                          <div
                            key={value.id}
                            className={`relative rounded-2xl overflow-hidden flex flex-col justify-end cursor-pointer ${spanCls} ${showSafeZone ? `ring-2 ring-dashed ${szBorder}` : ''}`}
                            style={{ background: hasImg ? '#27272a' : 'linear-gradient(145deg, #f5f7fa 0%, #e9ecf1 100%)' }}
                            onClick={() => handleEditValue(value.id)}
                          >
                            {hasImg && <img src={value.image_url} alt={title} className="absolute inset-0 w-full h-full object-cover" />}
                            {hasImg && <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2) 50%, transparent)' }} />}
                            <div className="relative z-10 p-3 mt-auto">
                              <h4 className={`text-xs font-bold leading-snug ${hasImg ? 'text-white' : 'text-gray-900'}`} style={{ color: hasImg ? undefined : value.title_color, fontWeight: value.title_weight, ...getFontStyle(value.title_family) }}>{title}</h4>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* Phone bottom bar */}
              <div className="h-4 bg-slate-800 flex items-center justify-center">
                <div className="w-24 h-1 bg-slate-600 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ SAFE ZONE GUIDE ══════════ */}
      {showSafeZone && (
        <div className="mt-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Үнэт зүйл Safe Zone Guide
          </h3>

          {/* ═══ VISUAL SAFE ZONE DIAGRAMS ═══ */}
          <div className="mb-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Картын бүсчлэл — Зураг хаана байрлуулах вэ?</h4>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">

              {/* Hero card diagram */}
              <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-200">
                <h5 className="text-[11px] font-bold text-violet-700 mb-2">🏛️ Hero карт</h5>
                <div className="relative rounded-lg overflow-hidden border border-violet-300" style={{ aspectRatio: '630/240' }}>
                  {/* Left text zone */}
                  <div className="absolute left-0 top-0 bottom-0 w-[60%] flex items-center justify-center" style={{ background: 'repeating-linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.06) 3px, rgba(239,68,68,0.12) 3px, rgba(239,68,68,0.12) 6px)' }}>
                    <div className="text-center">
                      <div className="text-[8px] font-bold text-red-500">⚠️ ТЕКСТ БҮС</div>
                      <div className="text-[7px] text-red-400 mt-0.5">Гарчиг + Тайлбар</div>
                      <div className="text-[7px] font-mono text-red-300">60% · p-9 (36px)</div>
                    </div>
                  </div>
                  {/* Right image safe zone */}
                  <div className="absolute right-0 top-0 bottom-0 w-[40%] flex items-center justify-center border-l-2 border-dashed border-emerald-500" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <div className="text-center">
                      <div className="text-[9px] font-bold text-emerald-600">✅ АЮУЛГҮЙ</div>
                      <div className="text-[7px] text-emerald-500 mt-0.5">Гол дүрс энд</div>
                      <div className="text-[7px] font-mono text-emerald-400">40%</div>
                    </div>
                  </div>
                  {/* Dimension arrow */}
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-violet-900/80 flex items-center justify-center">
                    <span className="text-[7px] font-mono text-white">← 630px → × 240px ↕ · Харьцаа: 2.5:1</span>
                  </div>
                </div>
                <p className="text-[9px] text-violet-600 mt-1.5 leading-tight">Gradient зүүнээс баруунруу цагаан→тунгалаг. Зургийн гол дүрсийг <strong>баруун талд</strong> байрлуулна.</p>
              </div>

              {/* Large card diagram */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <h5 className="text-[11px] font-bold text-emerald-700 mb-2">📦 Том карт</h5>
                <div className="relative rounded-lg overflow-hidden border border-emerald-300" style={{ aspectRatio: '564/380' }}>
                  {/* Top image safe zone */}
                  <div className="absolute left-0 right-0 top-0 h-[60%] flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <div className="text-center">
                      <div className="text-[9px] font-bold text-emerald-600">✅ АЮУЛГҮЙ БҮС</div>
                      <div className="text-[7px] text-emerald-500 mt-0.5">Гол дүрсийг дээд хэсэгт</div>
                      <div className="text-[7px] font-mono text-emerald-400">Дээд 60%</div>
                    </div>
                  </div>
                  {/* Bottom text zone */}
                  <div className="absolute left-0 right-0 bottom-0 h-[40%] flex items-center justify-center border-t-2 border-dashed border-red-400" style={{ background: 'repeating-linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.06) 3px, rgba(239,68,68,0.12) 3px, rgba(239,68,68,0.12) 6px)' }}>
                    <div className="text-center">
                      <div className="text-[8px] font-bold text-red-500">⚠️ ТЕКСТ</div>
                      <div className="text-[7px] font-mono text-red-300">p-11 (44px)</div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-emerald-900/80 flex items-center justify-center">
                    <span className="text-[7px] font-mono text-white">564 × 380px · 3:2 · row-span-2</span>
                  </div>
                </div>
                <p className="text-[9px] text-emerald-600 mt-1.5 leading-tight">Gradient доороос дээш хар→тунгалаг. Гол дүрсийг <strong>дээд/голд</strong> байрлуулна.</p>
              </div>

              {/* Vertical card diagram */}
              <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-200">
                <h5 className="text-[11px] font-bold text-violet-700 mb-2">📐 Босоо карт</h5>
                <div className="relative rounded-lg overflow-hidden border border-violet-300 mx-auto" style={{ aspectRatio: '338/380', width: '75%' }}>
                  <div className="absolute left-0 right-0 top-0 h-[65%] flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <div className="text-center">
                      <div className="text-[9px] font-bold text-emerald-600">✅ АЮУЛГҮЙ</div>
                      <div className="text-[7px] text-emerald-500 mt-0.5">Дээд 65%</div>
                    </div>
                  </div>
                  <div className="absolute left-0 right-0 bottom-0 h-[35%] flex items-center justify-center border-t-2 border-dashed border-red-400" style={{ background: 'repeating-linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.06) 3px, rgba(239,68,68,0.12) 3px, rgba(239,68,68,0.12) 6px)' }}>
                    <div className="text-center">
                      <div className="text-[8px] font-bold text-red-500">⚠️ ТЕКСТ</div>
                      <div className="text-[7px] font-mono text-red-300">p-7 (28px)</div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-violet-900/80 flex items-center justify-center">
                    <span className="text-[7px] font-mono text-white">338 × 380px · 9:10</span>
                  </div>
                </div>
                <p className="text-[9px] text-violet-600 mt-1.5 leading-tight">Gradient доороос дээш. Гол дүрсийг <strong>дээд/голд</strong> байрлуулна.</p>
              </div>

              {/* Small card diagram */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                <h5 className="text-[11px] font-bold text-amber-700 mb-2">🔲 Жижиг карт</h5>
                <div className="relative rounded-lg overflow-hidden border border-amber-300" style={{ aspectRatio: '338/180' }}>
                  <div className="absolute left-0 right-0 top-0 h-[65%] flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <div className="text-center">
                      <div className="text-[9px] font-bold text-emerald-600">✅ АЮУЛГҮЙ</div>
                      <div className="text-[7px] text-emerald-500 mt-0.5">Дээд 65%</div>
                    </div>
                  </div>
                  <div className="absolute left-0 right-0 bottom-0 h-[35%] flex items-center justify-center border-t-2 border-dashed border-red-400" style={{ background: 'repeating-linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.06) 3px, rgba(239,68,68,0.12) 3px, rgba(239,68,68,0.12) 6px)' }}>
                    <div className="text-center">
                      <div className="text-[8px] font-bold text-red-500">⚠️ ТЕКСТ</div>
                      <div className="text-[7px] font-mono text-red-300">px-6 py-5</div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-900/80 flex items-center justify-center">
                    <span className="text-[7px] font-mono text-white">338 × 180px · 2:1</span>
                  </div>
                </div>
                <p className="text-[9px] text-amber-600 mt-1.5 leading-tight">Gradient доороос дээш. Гол дүрсийг <strong>дээд/голд</strong> байрлуулна.</p>
              </div>
            </div>
          </div>

          {/* ═══ RECOMMENDED IMAGE SIZES ═══ */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Зөвлөмжит зургийн хэмжээ — Яг таарах хэмжээ</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Hero image */}
              <div className="p-3 bg-violet-50 rounded-xl border border-violet-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">H</span>
                  <span className="text-[11px] font-bold text-violet-700">Hero карт</span>
                </div>
                <div className="rounded-lg overflow-hidden border-2 border-violet-300 mb-2" style={{ aspectRatio: '1260/500' }}>
                  <div className="w-full h-full flex">
                    <div className="w-[60%] flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <span className="text-[8px] text-red-400 font-bold">ТЕКСТ</span>
                    </div>
                    <div className="w-[40%] flex flex-col items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <span className="text-[10px]">📸</span>
                      <span className="text-[7px] text-emerald-600 font-bold">ГОЛ ДҮРС</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between"><span className="text-slate-500">Хэмжээ:</span><strong className="text-violet-700">1260 × 500px</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Харьцаа:</span><strong className="text-violet-700">2.5 : 1</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Файл:</span><strong className="text-violet-700">JPG/WebP ≤300KB</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Гол дүрс:</span><strong className="text-emerald-600">Баруун 40%</strong></div>
                </div>
              </div>

              {/* Large image */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">Т</span>
                  <span className="text-[11px] font-bold text-emerald-700">Том карт</span>
                </div>
                <div className="rounded-lg overflow-hidden border-2 border-emerald-300 mb-2 mx-auto" style={{ aspectRatio: '900/600', width: '85%' }}>
                  <div className="w-full h-full flex flex-col">
                    <div className="h-[60%] flex flex-col items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <span className="text-[10px]">📸</span>
                      <span className="text-[7px] text-emerald-600 font-bold">ГОЛ ДҮРС</span>
                    </div>
                    <div className="h-[40%] flex items-center justify-center border-t-2 border-dashed border-red-300" style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <span className="text-[8px] text-red-400 font-bold">ТЕКСТ</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between"><span className="text-slate-500">Хэмжээ:</span><strong className="text-emerald-700">900 × 600px</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Харьцаа:</span><strong className="text-emerald-700">3 : 2</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Файл:</span><strong className="text-emerald-700">JPG/WebP ≤200KB</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Гол дүрс:</span><strong className="text-emerald-600">Дээд 60%</strong></div>
                </div>
              </div>

              {/* Vertical image */}
              <div className="p-3 bg-violet-50 rounded-xl border border-violet-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">Б</span>
                  <span className="text-[11px] font-bold text-violet-700">Босоо карт</span>
                </div>
                <div className="rounded-lg overflow-hidden border-2 border-violet-300 mb-2 mx-auto" style={{ aspectRatio: '680/760', width: '60%' }}>
                  <div className="w-full h-full flex flex-col">
                    <div className="h-[65%] flex flex-col items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <span className="text-[10px]">📸</span>
                      <span className="text-[7px] text-emerald-600 font-bold">ГОЛ ДҮРС</span>
                    </div>
                    <div className="h-[35%] flex items-center justify-center border-t-2 border-dashed border-red-300" style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <span className="text-[8px] text-red-400 font-bold">ТЕКСТ</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between"><span className="text-slate-500">Хэмжээ:</span><strong className="text-violet-700">680 × 760px</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Харьцаа:</span><strong className="text-violet-700">9 : 10</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Файл:</span><strong className="text-violet-700">JPG/WebP ≤200KB</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Гол дүрс:</span><strong className="text-emerald-600">Дээд 65%</strong></div>
                </div>
              </div>

              {/* Small image */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">Ж</span>
                  <span className="text-[11px] font-bold text-amber-700">Жижиг карт</span>
                </div>
                <div className="rounded-lg overflow-hidden border-2 border-amber-300 mb-2" style={{ aspectRatio: '680/360' }}>
                  <div className="w-full h-full flex flex-col">
                    <div className="h-[65%] flex flex-col items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <span className="text-[10px]">📸</span>
                      <span className="text-[7px] text-emerald-600 font-bold">ГОЛ ДҮРС</span>
                    </div>
                    <div className="h-[35%] flex items-center justify-center border-t-2 border-dashed border-red-300" style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <span className="text-[8px] text-red-400 font-bold">ТЕКСТ</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between"><span className="text-slate-500">Хэмжээ:</span><strong className="text-amber-700">680 × 360px</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Харьцаа:</span><strong className="text-amber-700">2 : 1</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Файл:</span><strong className="text-amber-700">JPG/WebP ≤150KB</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Гол дүрс:</span><strong className="text-emerald-600">Дээд 65%</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ LEGEND + TIPS ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h5 className="text-[11px] font-bold text-slate-700 mb-2">🎨 Тэмдэглэгээ</h5>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-8 h-4 rounded border-2 border-emerald-400 shrink-0" style={{ background: 'rgba(16,185,129,0.15)' }} />
                  <span className="text-slate-700"><strong className="text-emerald-600">Ногоон</strong> = Аюулгүй бүс — зургийн гол дүрс энд харагдана</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-8 h-4 rounded shrink-0" style={{ background: 'repeating-linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.06) 2px, rgba(239,68,68,0.15) 2px, rgba(239,68,68,0.15) 4px)' }} />
                  <span className="text-slate-700"><strong className="text-red-500">Улаан судал</strong> = Текст + градиент бүс — зураг харагдахгүй</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-8 h-4 rounded border-2 border-dashed border-red-400/60 shrink-0" />
                  <span className="text-slate-700"><strong className="text-orange-500">Зураасан хүрээ</strong> = Текст/градиент хил</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="text-[11px] font-bold text-blue-700 mb-2">💡 Зөвлөгөө</h5>
              <ul className="space-y-1 text-[10px] text-blue-700 list-disc pl-3">
                <li>Зураг <code className="bg-blue-100 px-0.5 rounded text-[9px]">object-cover</code> хэлбэрээр харагддаг — картын хэмжээнд тааруулж зүсэх болно</li>
                <li>Зургийн харьцаа картын харьцаатай <strong>ижил</strong> бол зураг яг таарна, зүсэгдэхгүй</li>
                <li>Hero картын гол дүрсийг <strong>баруун тал</strong>д, бусад картын гол дүрсийг <strong>дээд/голд</strong> байрлуулна</li>
                <li>Текстгүй карт → glassmorphism дизайн (зураг шаардлагагүй)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal 
        isOpen={editModalOpen} 
        onClose={handleCloseEditModal} 
        title={editingValue?.id === 'vision' ? 'Алсын харааг засах' : editingValue?.id === 'mission' ? 'Эрхэм зорилгийг засах' : editingValue?.backend_id ? 'Үнэт зүйлсийг засах' : 'Шинэ үнэт зүйлс нэмэх'}
        size="xl"
      >
        {editingValue && (
          <div className="space-y-5 pb-4">
            {/* Image Upload - All values */}
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-gray-900">Зураг</h4>
                  {editingValue.image_url && (
                    <button
                      type="button"
                      onClick={() => setValues(values.map(v => v.id === editingValue.id ? {...v, image_url: ''} : v))}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Зураг устгах
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <ImageUpload 
                    value={editingValue.image_url || ''}
                    onChange={(url: string) => setValues(values.map(v => v.id === editingValue.id ? {...v, image_url: url} : v))}
                    label="Үнэт зүйлийн зураг"
                  />
                  
                  {/* Image Aspect Ratio Selector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Зургийн хэмжээ/харьцаа</label>
                    <select
                      value={editingValue.image_aspect_ratio || '1 / 1'}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, image_aspect_ratio: e.target.value} : v))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="1 / 1">1:1 (Дөрвөлжин)</option>
                      <option value="16 / 9">16:9 (Видео)</option>
                      <option value="3 / 2">3:2</option>
                      <option value="4 / 3">4:3</option>
                    </select>
                  </div>
                </div>
              </div>

            {/* Card Size Selector - Only for core values (not vision/mission) */}
            {editingValue.id !== 'vision' && editingValue.id !== 'mission' && (
              <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50/20">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Картын хэмжээ</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'large', label: 'Том дөрвөлжин', icon: (
                      <div className="w-full aspect-[4/5] border-2 rounded-lg flex items-center justify-center transition-colors" style={{ borderColor: editingValue.card_size === 'large' ? '#0d9488' : '#cbd5e1' }}>
                        <div className="w-10 h-14 bg-current rounded opacity-40" />
                      </div>
                    )},
                    { value: 'small', label: 'Жижиг дөрвөлжин', icon: (
                      <div className="w-full aspect-[4/5] border-2 rounded-lg flex items-center justify-center transition-colors" style={{ borderColor: editingValue.card_size === 'small' ? '#0d9488' : '#cbd5e1' }}>
                        <div className="w-8 h-8 bg-current rounded opacity-40" />
                      </div>
                    )},
                    { value: 'vertical', label: 'Босоо дөрвөлжин', icon: (
                      <div className="w-full aspect-[4/5] border-2 rounded-lg flex items-center justify-center transition-colors" style={{ borderColor: editingValue.card_size === 'vertical' ? '#0d9488' : '#cbd5e1' }}>
                        <div className="w-6 h-14 bg-current rounded opacity-40" />
                      </div>
                    )},
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValues(values.map(v => v.id === editingValue.id ? {...v, card_size: opt.value} : v))}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        editingValue.card_size === opt.value
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {opt.icon}
                      <p className="text-xs font-semibold mt-2">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title/Label (for Vision/Mission) OR regular Title (for core values) */}
            <div className="space-y-4">
              {(editingValue.id === 'vision' || editingValue.id === 'mission') ? (
                <>
                  {/* Label Mongolian */}
                  <div className="border border-teal-200 rounded-lg p-4 bg-teal-50/20">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Шошго (Монгол)</label>
                    <input
                      type="text"
                      value={editingValue.title_mn}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_mn: e.target.value} : v))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  {/* Label English */}
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/20">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Label (English)</label>
                    <input
                      type="text"
                      value={editingValue.title_en}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_en: e.target.value} : v))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  {/* Main Text Mongolian */}
                  <div className="border border-teal-200 rounded-lg p-4 bg-teal-50/20">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Үндсэн текст (Монгол)</label>
                    <textarea
                      value={editingValue.desc_mn}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, desc_mn: e.target.value} : v))}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Main Text English */}
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/20">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Main Text (English)</label>
                    <textarea
                      value={editingValue.desc_en}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, desc_en: e.target.value} : v))}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Title Mongolian */}
                  <div className="border border-teal-200 rounded-lg p-4 bg-teal-50/20">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Гарчиг (Монгол)</label>
                    <input
                      type="text"
                      value={editingValue.title_mn}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_mn: e.target.value} : v))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  {/* Title English */}
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/20">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title (English)</label>
                    <input
                      type="text"
                      value={editingValue.title_en}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_en: e.target.value} : v))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  {/* Sub-items Editor */}
                  <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-slate-900">Гарчиг, Тайлбар жагсаалт</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newItem: SubItem = { icon: '⭐', title_mn: '', title_en: '', desc_mn: '', desc_en: '' }
                          setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: [...(v.sub_items || []), newItem]} : v))
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Нэмэх
                      </button>
                    </div>

                    {(!editingValue.sub_items || editingValue.sub_items.length === 0) && (
                      <p className="text-sm text-slate-400 text-center py-4">Гарчиг, тайлбар нэмээгүй байна. &quot;Нэмэх&quot; товч дарж нэмнэ үү.</p>
                    )}

                    <div className="space-y-4">
                      {(editingValue.sub_items || []).map((item, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-500">#{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(editingValue.sub_items || [])]
                                updated.splice(idx, 1)
                                setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                              }}
                              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                              Устгах
                            </button>
                          </div>

                          {/* Icon Picker */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Icon</label>
                            <div className="flex flex-wrap gap-1.5">
                              {ICON_OPTIONS.map(icon => (
                                <button
                                  key={icon}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(editingValue.sub_items || [])]
                                    updated[idx] = {...updated[idx], icon}
                                    setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                  }}
                                  className={`w-8 h-8 flex items-center justify-center rounded-md text-lg transition-all ${item.icon === icon ? 'bg-teal-100 ring-2 ring-teal-500 scale-110' : 'bg-slate-50 hover:bg-slate-100'}`}
                                >
                                  {icon}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Title MN/EN */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Гарчиг (MN)</label>
                              <input
                                type="text"
                                value={item.title_mn}
                                onChange={(e) => {
                                  const updated = [...(editingValue.sub_items || [])]
                                  updated[idx] = {...updated[idx], title_mn: e.target.value}
                                  setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                placeholder="Гарчиг"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Title (EN)</label>
                              <input
                                type="text"
                                value={item.title_en}
                                onChange={(e) => {
                                  const updated = [...(editingValue.sub_items || [])]
                                  updated[idx] = {...updated[idx], title_en: e.target.value}
                                  setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                placeholder="Title"
                              />
                            </div>
                          </div>

                          {/* Desc MN/EN */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Тайлбар (MN)</label>
                              <textarea
                                value={item.desc_mn}
                                onChange={(e) => {
                                  const updated = [...(editingValue.sub_items || [])]
                                  updated[idx] = {...updated[idx], desc_mn: e.target.value}
                                  setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                }}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                                placeholder="Тайлбар"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Description (EN)</label>
                              <textarea
                                value={item.desc_en}
                                onChange={(e) => {
                                  const updated = [...(editingValue.sub_items || [])]
                                  updated[idx] = {...updated[idx], desc_en: e.target.value}
                                  setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                }}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                                placeholder="Description"
                              />
                            </div>
                          </div>

                          {/* Sub-item Title Styling */}
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Гарчиг стиль</p>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Өнгө</label>
                                <div className="flex items-center gap-1">
                                  <input type="color" value={item.title_color || '#111827'}
                                    onChange={(e) => {
                                      const updated = [...(editingValue.sub_items || [])]; updated[idx] = {...updated[idx], title_color: e.target.value}
                                      setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                    }} className="w-7 h-7 rounded cursor-pointer border border-slate-300" />
                                  <input type="text" value={item.title_color || '#111827'}
                                    onChange={(e) => {
                                      const updated = [...(editingValue.sub_items || [])]; updated[idx] = {...updated[idx], title_color: e.target.value}
                                      setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                    }} className="flex-1 px-1.5 py-1 border border-slate-300 rounded text-[10px] font-mono" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Хэмжээ</label>
                                <input type="number" min="10" max="48" value={item.title_size || 14}
                                  onChange={(e) => {
                                    const updated = [...(editingValue.sub_items || [])]; updated[idx] = {...updated[idx], title_size: parseInt(e.target.value)}
                                    setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                  }} className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Жин</label>
                                <select value={item.title_weight || 'semibold'}
                                  onChange={(e) => {
                                    const updated = [...(editingValue.sub_items || [])]; updated[idx] = {...updated[idx], title_weight: e.target.value}
                                    setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                  }} className="w-full px-2 py-1 border border-slate-300 rounded text-xs">
                                  <option value="normal">Normal</option><option value="semibold">Semibold</option><option value="bold">Bold</option><option value="extrabold">Extrabold</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Тэгшлэл</label>
                                <select value={item.title_textalign || 'left'}
                                  onChange={(e) => {
                                    const updated = [...(editingValue.sub_items || [])]; updated[idx] = {...updated[idx], title_textalign: e.target.value}
                                    setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                  }} className="w-full px-2 py-1 border border-slate-300 rounded text-xs">
                                  <option value="left">← Зүүн</option><option value="center">↔ Төв</option><option value="right">→ Баруун</option><option value="justify">⇔ Тэгш</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Sub-item Desc Styling */}
                          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Тайлбар стиль</p>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Өнгө</label>
                                <div className="flex items-center gap-1">
                                  <input type="color" value={item.desc_color || '#6b7280'}
                                    onChange={(e) => {
                                      const updated = [...(editingValue.sub_items || [])]; updated[idx] = {...updated[idx], desc_color: e.target.value}
                                      setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                    }} className="w-7 h-7 rounded cursor-pointer border border-slate-300" />
                                  <input type="text" value={item.desc_color || '#6b7280'}
                                    onChange={(e) => {
                                      const updated = [...(editingValue.sub_items || [])]; updated[idx] = {...updated[idx], desc_color: e.target.value}
                                      setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                    }} className="flex-1 px-1.5 py-1 border border-slate-300 rounded text-[10px] font-mono" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Хэмжээ</label>
                                <input type="number" min="10" max="48" value={item.desc_size || 14}
                                  onChange={(e) => {
                                    const updated = [...(editingValue.sub_items || [])]; updated[idx] = {...updated[idx], desc_size: parseInt(e.target.value)}
                                    setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                  }} className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Жин</label>
                                <select value={item.desc_weight || 'normal'}
                                  onChange={(e) => {
                                    const updated = [...(editingValue.sub_items || [])]; updated[idx] = {...updated[idx], desc_weight: e.target.value}
                                    setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                  }} className="w-full px-2 py-1 border border-slate-300 rounded text-xs">
                                  <option value="normal">Normal</option><option value="semibold">Semibold</option><option value="bold">Bold</option><option value="extrabold">Extrabold</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Тэгшлэл</label>
                                <select value={item.desc_textalign || 'left'}
                                  onChange={(e) => {
                                    const updated = [...(editingValue.sub_items || [])]; updated[idx] = {...updated[idx], desc_textalign: e.target.value}
                                    setValues(values.map(v => v.id === editingValue.id ? {...v, sub_items: updated} : v))
                                  }} className="w-full px-2 py-1 border border-slate-300 rounded text-xs">
                                  <option value="left">← Зүүн</option><option value="center">↔ Төв</option><option value="right">→ Баруун</option><option value="justify">⇔ Тэгш</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Title/Main Text Styling Section */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span className="text-lg">Aa</span> {(editingValue.id === 'vision' || editingValue.id === 'mission') ? 'Үндсэн текст' : 'Гарчиг'}
                  </h4>
                  <div style={{
                    color: editingValue.title_color,
                    fontSize: `${editingValue.title_size}px`,
                    fontWeight: editingValue.title_weight,
                    ...getFontStyle(editingValue.title_family),
                    letterSpacing: `${editingValue.title_letter_spacing}px`
                  }} className="px-3 py-1">
                    Aa
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3">
                  {/* Color */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Өнгө</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingValue.title_color}
                        onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_color: e.target.value} : v))}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        value={editingValue.title_color}
                        onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_color: e.target.value} : v))}
                        className="flex-1 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Хэмжээ (px)</label>
                    <input
                      type="number"
                      min="8"
                      max="72"
                      value={editingValue.title_size}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_size: parseInt(e.target.value)} : v))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Жин</label>
                    <select
                      value={editingValue.title_weight}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_weight: e.target.value} : v))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="semibold">Semibold</option>
                      <option value="bold">Bold</option>
                      <option value="extrabold">Extrabold</option>
                    </select>
                  </div>

                  {/* Family */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Фонт</label>
                    <select
                      value={editingValue.title_family}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_family: e.target.value} : v))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.family, fontWeight: f.weight }}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Letter Spacing */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Зай (px)</label>
                    <input
                      type="number"
                      min="-5"
                      max="10"
                      step="0.5"
                      value={editingValue.title_letter_spacing}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_letter_spacing: parseFloat(e.target.value)} : v))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Text Align */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Тэгшлэл</label>
                    <select
                      value={editingValue.title_textalign}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, title_textalign: e.target.value} : v))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    >
                      <option value="left">← Зүүн</option>
                      <option value="center">↔ Төв</option>
                      <option value="right">→ Баруун</option>
                      <option value="justify">⇔ Тэгш</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description Styling Section */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span className="text-lg">📝</span> Тайлбар стиль
                  </h4>
                  <div style={{
                    color: editingValue.desc_color,
                    fontSize: `${editingValue.desc_size}px`,
                    fontWeight: editingValue.desc_weight,
                    ...getFontStyle(editingValue.desc_family),
                  }} className="px-3 py-1">
                    Аа
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {/* Color */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Өнгө</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingValue.desc_color}
                        onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, desc_color: e.target.value} : v))}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        value={editingValue.desc_color}
                        onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, desc_color: e.target.value} : v))}
                        className="flex-1 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Хэмжээ (px)</label>
                    <input
                      type="number"
                      min="8"
                      max="72"
                      value={editingValue.desc_size}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, desc_size: parseInt(e.target.value)} : v))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Жин</label>
                    <select
                      value={editingValue.desc_weight}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, desc_weight: e.target.value} : v))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="semibold">Semibold</option>
                      <option value="bold">Bold</option>
                      <option value="extrabold">Extrabold</option>
                    </select>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Фонт</label>
                    <select
                      value={editingValue.desc_family}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, desc_family: e.target.value} : v))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.family, fontWeight: f.weight }}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Text Align */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Тэгшлэл</label>
                    <select
                      value={editingValue.desc_textalign}
                      onChange={(e) => setValues(values.map(v => v.id === editingValue.id ? {...v, desc_textalign: e.target.value} : v))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    >
                      <option value="left">← Зүүн</option>
                      <option value="center">↔ Төв</option>
                      <option value="right">→ Баруун</option>
                      <option value="justify">⇔ Тэгш</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleDeleteClick(editingValue.id)}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                Устгах
              </button>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Болих
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSaveValues()
                  handleCloseEditModal()
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteConfirmOpen} 
        onClose={() => {
          setDeleteConfirmOpen(false)
          setPendingDeleteId(null)
        }} 
        title="Устгах баталгаа"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Анхаарал!</p>
                <p className="text-sm text-red-800">
                  Та &quot;{values.find(v => v.id === pendingDeleteId)?.title_mn}&quot; үнэт зүйлсийг устгах гэж байна.
                </p>
                <p className="text-sm text-red-800 mt-2">
                  <strong>Энэ үйлдэл буцаах боломжгүй!</strong> Та үнэхээр устгахыг хүсэж байна уу?
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setPendingDeleteId(null)
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Цуцлах
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Устгаж байна...' : 'Устгах'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}