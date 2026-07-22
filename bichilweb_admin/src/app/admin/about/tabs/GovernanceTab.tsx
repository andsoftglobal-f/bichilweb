'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import clsx from 'clsx'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/Modal'
import ImageUpload from '@/components/ImageUpload'
import { Input, Textarea } from '@/components/FormElements'
import { axiosInstance } from '@/lib/axios'
import { FontSelect, getFontStyle } from '@/lib/fontOptions'

/* ── Types ─────────────────────────────────────────────────────────── */

interface FieldStyle {
  fontcolor: string
  fontsize: number
  fontweight: string
  textalign: string
  textAlign?: string
  fontfamily: string
}

interface MemberStyles {
  name: FieldStyle
  role: FieldStyle
  description: FieldStyle
  location: FieldStyle
  district: FieldStyle
}

const defaultFieldStyle = (color = '#111827', size = 14, weight = 'normal'): FieldStyle => ({
  fontcolor: color, fontsize: size, fontweight: weight, textalign: 'left', fontfamily: ''
})

const defaultMemberStyles: MemberStyles = {
  name: defaultFieldStyle('#111827', 14, 'semibold'),
  role: defaultFieldStyle('#4b5563', 13, 'normal'),
  description: defaultFieldStyle('#4b5563', 14, 'normal'),
  location: defaultFieldStyle('#6b7280', 13, 'normal'),
  district: defaultFieldStyle('#6b7280', 13, 'normal'),
}

const weightMap: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
}

const toInlineStyle = (s?: FieldStyle): React.CSSProperties | undefined => {
  if (!s) return undefined
  const out: React.CSSProperties = {}
  if (s.fontcolor) out.color = s.fontcolor
  if (s.fontsize) out.fontSize = `${s.fontsize}px`
  if (s.fontweight) out.fontWeight = weightMap[s.fontweight] || s.fontweight
  const align = s.textalign || s.textAlign
  if (align) out.textAlign = align as React.CSSProperties['textAlign']
  if (s.fontfamily) Object.assign(out, getFontStyle(s.fontfamily))
  return Object.keys(out).length ? out : undefined
}

const defaultCatStyle: FieldStyle = { fontcolor: '#111827', fontsize: 14, fontweight: 'medium', textalign: 'center', fontfamily: '' }
const defaultSloganStyle: FieldStyle = { fontcolor: '#0048BA', fontsize: 18, fontweight: 'semibold', textalign: 'left', fontfamily: '' }

const parseMemberStyles = (raw: string | undefined | null): MemberStyles => {
  try {
    if (!raw) return { ...defaultMemberStyles }
    const parsed = JSON.parse(raw)
    return {
      name: { ...defaultMemberStyles.name, ...parsed.name },
      role: { ...defaultMemberStyles.role, ...parsed.role },
      description: { ...defaultMemberStyles.description, ...parsed.description },
      location: { ...defaultMemberStyles.location, ...parsed.location },
      district: { ...defaultMemberStyles.district, ...parsed.district },
    }
  } catch { return { ...defaultMemberStyles } }
}

const parseCatStyle = (raw: string | undefined | null): FieldStyle => {
  try {
    if (!raw) return { ...defaultCatStyle }
    const parsed = JSON.parse(raw)
    const { slogan: _slogan, ...labelStyle } = parsed
    return { ...defaultCatStyle, ...labelStyle }
  } catch { return { ...defaultCatStyle } }
}

const parseSloganStyle = (raw: string | undefined | null): FieldStyle => {
  try {
    if (!raw) return { ...defaultSloganStyle }
    const parsed = JSON.parse(raw)
    return { ...defaultSloganStyle, ...(parsed.slogan || {}) }
  } catch { return { ...defaultSloganStyle } }
}

interface Translation {
  id?: number
  language: number
  name: string
  role: string
  description: string
  location: string
  district: string
  styles?: string
}

interface MemberAPI {
  id: number
  type: string
  image: string
  sort_order: number
  active: boolean
  pinned: boolean
  translations: Translation[]
}

interface CategoryTranslation {
  id?: number
  language: number
  language_code?: string
  label: string
  slogan?: string
  styles?: string
}

interface CategoryAPI {
  id: number
  key: string
  sort_order: number
  active: boolean
  translations: CategoryTranslation[]
}

interface MemberFormData {
  name_mn: string; name_en: string
  role_mn: string; role_en: string
  desc_mn: string; desc_en: string
  location_mn: string; location_en: string
  district_mn: string; district_en: string
  image: string
  imageFile: File | null
  type: string
  sort_order: number
  styles: MemberStyles
}

interface CategoryFormData {
  key: string
  label_mn: string
  label_en: string
  slogan_mn: string
  slogan_en: string
  sort_order: number
  catStyle: FieldStyle
  sloganStyle: FieldStyle
}

const emptyForm: MemberFormData = {
  name_mn: '', name_en: '',
  role_mn: '', role_en: '',
  desc_mn: '', desc_en: '',
  location_mn: '', location_en: '',
  district_mn: '', district_en: '',
  image: '',
  imageFile: null,
  type: '',
  sort_order: 0,
  styles: { ...defaultMemberStyles },
}

const emptyCategoryForm: CategoryFormData = {
  key: '',
  label_mn: '',
  label_en: '',
  slogan_mn: '',
  slogan_en: '',
  sort_order: 0,
  catStyle: { ...defaultCatStyle },
  sloganStyle: { ...defaultSloganStyle },
}

const getCatLabel = (cat: CategoryAPI, langId: number) => {
  const tr = cat.translations.find(t => t.language === langId)
  return tr?.label || cat.key
}

/* ── Helpers ───────────────────────────────────────────────────────── */

const getTrans = (translations: Translation[], langId: number) =>
  translations.find(t => t.language === langId)

const memberToForm = (m: MemberAPI): MemberFormData => {
  const mn = getTrans(m.translations, 1)
  const en = getTrans(m.translations, 2)
  return {
    name_mn: mn?.name || '', name_en: en?.name || '',
    role_mn: mn?.role || '', role_en: en?.role || '',
    desc_mn: mn?.description || '', desc_en: en?.description || '',
    location_mn: mn?.location || '', location_en: en?.location || '',
    district_mn: mn?.district || '', district_en: en?.district || '',
    image: m.image || '',
    imageFile: null,
    type: m.type,
    sort_order: m.sort_order,
    styles: parseMemberStyles(mn?.styles || en?.styles),
  }
}

const formToPayload = (form: MemberFormData): globalThis.FormData => {
  const fd = new globalThis.FormData()
  fd.append('type', form.type)
  fd.append('sort_order', String(form.sort_order))
  fd.append('active', 'true')
  fd.append('pinned', 'false')

  // Image: send file if selected, otherwise send existing URL
  if (form.imageFile) {
    fd.append('image_file', form.imageFile)
  } else if (form.image) {
    fd.append('image', form.image)
  }

  const stylesJson = JSON.stringify(form.styles)

  // Translations as indexed keys for FormData
  const translations = [
    { language: '2', name: form.name_en, role: form.role_en, description: form.desc_en, location: form.location_en, district: form.district_en, styles: stylesJson },
    { language: '1', name: form.name_mn, role: form.role_mn, description: form.desc_mn, location: form.location_mn, district: form.district_mn, styles: stylesJson },
  ]
  translations.forEach((tr, i) => {
    Object.entries(tr).forEach(([key, val]) => {
      fd.append(`translations[${i}][${key}]`, val)
    })
  })

  return fd
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function GovernanceTab() {
  const [members, setMembers] = useState<MemberAPI[]>([])
  const [categories, setCategories] = useState<CategoryAPI[]>([])
  const [activeType, setActiveType] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<MemberFormData>({ ...emptyForm })
  const [isSaving, setIsSaving] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberAPI | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Category CRUD state
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catEditing, setCatEditing] = useState<CategoryAPI | null>(null)
  const [catForm, setCatForm] = useState<CategoryFormData>({ ...emptyCategoryForm })
  const [catSaving, setCatSaving] = useState(false)
  const [showCatManager, setShowCatManager] = useState(false)
  const [showBranchFields, setShowBranchFields] = useState(false)

  const langId = 1

  /* ── Fetch ───────────────────────────────────────────────────────── */

  const extractArr = <T,>(raw: unknown): T[] =>
    Array.isArray(raw) ? raw : Array.isArray((raw as Record<string, unknown>)?.results) ? (raw as Record<string, unknown>).results as T[] : []

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [membersRes, catsRes] = await Promise.all([
        axiosInstance.get('/management/'),
        axiosInstance.get('/management-category/'),
      ])
      const membersList = extractArr<MemberAPI>(membersRes.data)
      const catsList = extractArr<CategoryAPI>(catsRes.data)
      setMembers(membersList)
      setCategories(catsList)
      if (catsList.length > 0 && !activeType) {
        setActiveType(catsList[0].key)
      }
    } catch {
      setErrorMsg('Өгөгдөл татахад алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const displayed = members.filter(m => m.type === activeType).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return (a.sort_order - b.sort_order)
  })

  /* ── Pin toggle ──────────────────────────────────────────────────── */

  const handleTogglePin = async (member: MemberAPI) => {
    try {
      const fd = new globalThis.FormData()
      fd.append('type', member.type)
      fd.append('sort_order', String(member.sort_order))
      fd.append('active', String(member.active))
      fd.append('pinned', String(!member.pinned))
      if (member.image) fd.append('image', member.image)

      // Copy existing translations
      member.translations.forEach((tr, i) => {
        fd.append(`translations[${i}][language]`, String(tr.language))
        fd.append(`translations[${i}][name]`, tr.name || '')
        fd.append(`translations[${i}][role]`, tr.role || '')
        fd.append(`translations[${i}][description]`, tr.description || '')
        fd.append(`translations[${i}][location]`, tr.location || '')
        fd.append(`translations[${i}][district]`, tr.district || '')
        fd.append(`translations[${i}][styles]`, tr.styles || '{}')
      })

      await axiosInstance.put(`/management/${member.id}/`, fd, { headers: { 'Content-Type': undefined } })
      setSuccessMsg(member.pinned ? 'Pin хасагдлаа' : 'Pin тавигдлаа')
      await fetchData()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Pin тогтоогоход алдаа гарлаа')
    }
  }

  /* ── CRUD ─────────────────────────────────────────────────────────── */

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ ...emptyForm, type: activeType, sort_order: displayed.length })
    setShowBranchFields(false)
    setModalOpen(true)
  }

  const openEditModal = (member: MemberAPI) => {
    setEditingId(member.id)
    const form = memberToForm(member)
    setFormData(form)
    setShowBranchFields(!!(form.location_mn || form.location_en || form.district_mn || form.district_en))
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name_mn.trim() && !formData.name_en.trim()) {
      setErrorMsg('Нэр оруулна уу'); return
    }
    setIsSaving(true); setErrorMsg('')
    try {
      const payload = formToPayload(formData)
      // FormData-г илгээхэд Content-Type-г axios автоматаар тохируулна (boundary-тай)
      // Гараар тохируулвал boundary дутагдаж, серверт parse хийхэд алдаа гарна
      if (editingId) {
        await axiosInstance.put(`/management/${editingId}/`, payload, { headers: { 'Content-Type': undefined } })
        setSuccessMsg('Амжилттай шинэчиллээ')
      } else {
        await axiosInstance.post('/management/', payload, { headers: { 'Content-Type': undefined } })
        setSuccessMsg('Амжилттай нэмэгдлээ')
      }
      setModalOpen(false)
      await fetchData()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Хадгалахад алдаа гарлаа')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Үнэхээр устгах уу?')) return
    try {
      await axiosInstance.delete(`/management/${id}/`)
      setSuccessMsg('Амжилттай устгалаа')
      await fetchData()
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
  /* ── Category CRUD ───────────────────────────────────────────────────── */

  const openAddCategory = () => {
    setCatEditing(null)
    setCatForm({ ...emptyCategoryForm, sort_order: categories.length })
    setCatModalOpen(true)
  }

  const openEditCategory = (cat: CategoryAPI) => {
    setCatEditing(cat)
    const mn = cat.translations.find(t => t.language === 1)
    const en = cat.translations.find(t => t.language === 2)
    setCatForm({
      key: cat.key,
      label_mn: mn?.label || '',
      label_en: en?.label || '',
      slogan_mn: mn?.slogan || '',
      slogan_en: en?.slogan || '',
      sort_order: cat.sort_order,
      catStyle: parseCatStyle(mn?.styles || en?.styles),
      sloganStyle: parseSloganStyle(mn?.styles || en?.styles),
    })
    setCatModalOpen(true)
  }

  const handleSaveCategory = async () => {
    if (!catForm.key.trim()) {
      setErrorMsg('Түлхүүр оруулна уу'); return
    }
    setCatSaving(true); setErrorMsg('')
    try {
      const stylesJson = JSON.stringify({ ...catForm.catStyle, slogan: catForm.sloganStyle })
      const payload = {
        key: catForm.key,
        sort_order: catForm.sort_order,
        active: true,
        translations: [
          { language: 1, label: catForm.label_mn, slogan: catForm.slogan_mn, styles: stylesJson },
          { language: 2, label: catForm.label_en, slogan: catForm.slogan_en, styles: stylesJson },
        ],
      }
      if (catEditing) {
        await axiosInstance.put(`/management-category/${catEditing.id}/`, payload)
        setSuccessMsg('Ангилал амжилттай шинэчлэгдлээ')
      } else {
        await axiosInstance.post('/management-category/', payload)
        setSuccessMsg('Ангилал амжилттай нэмэгдлээ')
      }
      setCatModalOpen(false)
      await fetchData()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.key?.[0] || 'Хадгалахад алдаа гарлаа')
    } finally {
      setCatSaving(false)
    }
  }

  const handleDeleteCategory = async (cat: CategoryAPI) => {
    const catMembers = members.filter(m => m.type === cat.key)
    if (catMembers.length > 0) {
      setErrorMsg(`"${getCatLabel(cat, langId)}" ангилалд ${catMembers.length} гишүүн байна. Эхлээд гишүүдийг устгана уу.`)
      return
    }
    if (!confirm(`"${getCatLabel(cat, langId)}" ангилалыг устгах уу?`)) return
    try {
      await axiosInstance.delete(`/management-category/${cat.id}/`)
      setSuccessMsg('Ангилал устгагдлаа')
      if (activeType === cat.key && categories.length > 1) {
        const remaining = categories.filter(c => c.id !== cat.id)
        setActiveType(remaining[0]?.key || '')
      }
      await fetchData()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Ангилал устгахад алдаа гарлаа')
    }
  }
  /* ── Keyboard shortcuts ──────────────────────────────────────────── */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's' && modalOpen) { e.preventDefault(); handleSave() }
      if (e.key === 'Escape') {
        if (selectedMember) setSelectedMember(null)
        else if (catModalOpen) setCatModalOpen(false)
        else if (modalOpen) handleCloseModal()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, formData, selectedMember, catModalOpen])

  useEffect(() => {
    document.body.style.overflow = selectedMember ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedMember])

  /* ── Render ──────────────────────────────────────────────────────── */

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
          <h2 className="sr-only">Компанийн засаглал</h2>
          <div className="flex items-center gap-4">
            {/* Image dimension info badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100" title="Зургийн зөвлөмж хэмжээ">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
              600×800 · 3:4
            </span>
            <button
              onClick={() => setShowCatManager(!showCatManager)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                showCatManager ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Ангилал
            </button>
          </div>
        </div>

        {/* Category Manager Panel */}
        {showCatManager && (
          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Ангилалууд удирдах</h3>
              <button onClick={openAddCategory}
                className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors text-xs font-medium">
                <PlusIcon className="w-3.5 h-3.5" />
                Нэмэх
              </button>
            </div>
            <div className="grid gap-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-sm font-medium text-slate-800">{getCatLabel(cat, langId)}</span>
                    <span className="text-xs text-slate-400 ml-2">({cat.key})</span>
                    <span className="text-xs text-slate-400 ml-2">· {members.filter(m => m.type === cat.key).length} гишүүн</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditCategory(cat)}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors" title="Засварлах">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Устгах">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Ангилал байхгүй</p>
              )}
            </div>
          </div>
        )}

        {/* Tabs from categories */}
        <div className="flex justify-center gap-8 border-b border-gray-200 mb-12 flex-wrap">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveType(cat.key)}
              className={clsx("pb-3 text-sm font-medium transition-colors duration-200",
                activeType === cat.key ? "text-teal-600 border-b-2 border-teal-600" : "text-gray-500 hover:text-gray-900"
              )}>{getCatLabel(cat, langId)}</button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Ачаалж байна...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-24 text-center text-gray-500"><p className="text-sm">Өгөгдөл байхгүй</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
            {displayed.map((person, idx) => {
              const tr = getTrans(person.translations, langId)
              const isPinned = person.pinned
              return (
                <div key={person.id}
                  className={clsx(
                    "group bg-white border rounded-xl transition-all cursor-pointer",
                    isPinned
                      ? "sm:col-span-2 lg:col-span-1 border-amber-300 ring-2 ring-amber-200 shadow-lg p-5 sm:p-7"
                      : "border-gray-200 hover:border-teal-300 p-4 sm:p-6"
                  )}
                  onClick={() => setSelectedMember(person)}
                >
                  {/* Pin badge */}
                  {isPinned && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
                        Захирал
                      </span>
                    </div>
                  )}
                  <div className={clsx(
                    "relative w-full aspect-[3/4] mb-3 sm:mb-4 rounded-lg overflow-hidden bg-gray-100",
                    isPinned ? "max-h-none" : "max-h-[220px] sm:max-h-none"
                  )}>
                    {person.image ? (
                      <Image src={person.image} alt={tr?.name || ''} fill priority={idx === 0}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/img/avatar-placeholder.png' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleTogglePin(person) }}
                        className={clsx(
                          "p-2 rounded-full transition-colors",
                          isPinned ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-white/90 text-slate-500 hover:bg-amber-100 hover:text-amber-600"
                        )} title={isPinned ? 'Pin хасах' : 'Pin тавих'}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(person) }}
                        className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors" title="Засварлах">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(person.id) }}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors" title="Устгах">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className={clsx("font-semibold text-gray-900", isPinned ? "text-base" : "text-sm")}>{tr?.name}</p>
                  <p className={clsx("text-gray-600", isPinned ? "text-sm" : "text-xs")}>{tr?.role}</p>
                  {person.type === 'branch' && tr?.location && (
                    <p className="text-xs text-gray-500 mt-3">{tr.location} · {tr.district}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Удирдлага:</label>
          <span className="text-sm text-slate-500">Нийт {members.length} хүн ({displayed.length} харуулж байна)</span>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium">
          <PlusIcon className="w-5 h-5" />
          Нэмэх
        </button>
      </div>

      {/* Detail Modal */}
      {selectedMember && (() => {
        const tr = getTrans(selectedMember.translations, langId)
        const ms = parseMemberStyles(tr?.styles)
        const descriptionStyle = toInlineStyle(ms.description)
        const isDescriptionJustified = descriptionStyle?.textAlign === 'justify'
        const descriptionTextStyle: React.CSSProperties | undefined = descriptionStyle
          ? {
              ...descriptionStyle,
              ...(isDescriptionJustified
                ? { textAlign: 'justify', textAlignLast: 'left', hyphens: 'auto' }
                : {}),
            }
          : undefined
        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-0 sm:items-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedMember(null)} role="dialog" aria-modal="true">
            <div className="bg-white w-full max-w-4xl rounded-2xl p-8 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedMember(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
              <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                <div className="w-full md:w-1/3 shrink-0">
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100">
                    {selectedMember.image ? (
                      <Image src={selectedMember.image} alt={tr?.name || ''} fill className="object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/img/avatar-placeholder.png' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full md:w-2/3 flex flex-col justify-start">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900" style={toInlineStyle(ms.name)}>{tr?.name}</h3>
                  <p className="text-xs sm:text-sm text-teal-600 uppercase tracking-wide mt-1 mb-4 sm:mb-6" style={toInlineStyle(ms.role)}>{tr?.role}</p>
                  {tr?.location && (
                    <p className="text-xs sm:text-sm text-slate-600 mb-4" style={toInlineStyle(ms.location)}>
                      <span className="font-medium">Байршил:</span> {tr.location} - {tr.district}
                    </p>
                  )}
                  {tr?.description && (
                    <div className="space-y-3 text-gray-600 leading-7 text-xs sm:text-sm mb-6" style={descriptionTextStyle}>
                      {tr.description.split('\n\n').map((p, i) => (<p key={i} style={descriptionTextStyle}>{p}</p>))}
                    </div>
                  )}
                  <div className="flex gap-3 pt-6 border-t border-slate-200">
                    <button onClick={() => { openEditModal(selectedMember); setSelectedMember(null) }}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium text-sm">
                      <PencilIcon className="w-4 h-4" /> Засварлах
                    </button>
                    <button onClick={() => { handleDelete(selectedMember.id); setSelectedMember(null) }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm">
                      <TrashIcon className="w-4 h-4" /> Устгах
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Edit/Add Modal */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingId ? 'Засварлах' : 'Нэмэх'}>
        <div className="space-y-6">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Төрөл *</label>
              <select value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                {categories.map(cat => (<option key={cat.id} value={cat.key}>{getCatLabel(cat, langId)}</option>))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Нэр (Монгол) *</label>
                <Input value={formData.name_mn} onChange={(e) => setFormData({ ...formData, name_mn: e.target.value })} placeholder="Монгол нэр" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name (English)</label>
                <Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} placeholder="English name" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Албан тушаал (Монгол)</label>
                <Input value={formData.role_mn} onChange={(e) => setFormData({ ...formData, role_mn: e.target.value })} placeholder="Албан тушаал" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role (English)</label>
                <Input value={formData.role_en} onChange={(e) => setFormData({ ...formData, role_en: e.target.value })} placeholder="Role" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Тайлбар (Монгол)</label>
                <Textarea value={formData.desc_mn} onChange={(e) => setFormData({ ...formData, desc_mn: e.target.value })} placeholder="Тайлбар" rows={4} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description (English)</label>
                <Textarea value={formData.desc_en} onChange={(e) => setFormData({ ...formData, desc_en: e.target.value })} placeholder="Description" rows={4} />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBranchFields}
                onChange={(e) => setShowBranchFields(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-slate-700">Салбар бичлэг</span>
            </label>

            {showBranchFields && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Байршил (Монгол)</label>
                    <Input value={formData.location_mn} onChange={(e) => setFormData({ ...formData, location_mn: e.target.value })} placeholder="Байршил" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Location (English)</label>
                    <Input value={formData.location_en} onChange={(e) => setFormData({ ...formData, location_en: e.target.value })} placeholder="Location" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Дүүрэг (Монгол)</label>
                    <Input value={formData.district_mn} onChange={(e) => setFormData({ ...formData, district_mn: e.target.value })} placeholder="Дүүрэг" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">District (English)</label>
                    <Input value={formData.district_en} onChange={(e) => setFormData({ ...formData, district_en: e.target.value })} placeholder="District" />
                  </div>
                </div>
              </>
            )}

            <div className="w-32">
              <label className="block text-xs font-medium text-slate-600 mb-1">Дараалал</label>
              <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Зураг</label>
              <ImageUpload onChange={(url) => setFormData({ ...formData, image: url, imageFile: null })} value={formData.image} />

              {/* ── Image dimension guide ──────────────────────────── */}
              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                  </svg>
                  Зургийн зөвлөмж
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-white rounded-md px-2.5 py-1.5 border border-blue-100">
                    <span className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-600">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                    </span>
                    <div>
                      <p className="text-[10px] text-slate-500 leading-none">Desktop</p>
                      <p className="text-xs font-bold text-slate-800">600 × 800 px</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-md px-2.5 py-1.5 border border-blue-100">
                    <span className="flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
                    </span>
                    <div>
                      <p className="text-[10px] text-slate-500 leading-none">Phone</p>
                      <p className="text-xs font-bold text-slate-800">400 × 533 px</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="inline-block w-4 h-5 rounded-sm border border-slate-300 bg-slate-100" />
                    Харьцаа: <strong className="text-slate-700">3:4</strong> (портрет)
                  </span>
                  <span className="text-[10px] text-slate-400">·</span>
                  <span className="text-[10px] text-slate-500">Бүрхэлт: <strong className="text-slate-700">object-cover, object-top</strong></span>
                </div>
              </div>
            </div>

            {/* Member Field Styling */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-base">🎨</span> Текстийн стиль тохиргоо
              </h4>
              {([
                { key: 'name' as keyof MemberStyles, label: 'Нэр' },
                { key: 'role' as keyof MemberStyles, label: 'Албан тушаал' },
                { key: 'description' as keyof MemberStyles, label: 'Тайлбар' },
                ...(showBranchFields ? [
                  { key: 'location' as keyof MemberStyles, label: 'Байршил' },
                  { key: 'district' as keyof MemberStyles, label: 'Дүүрэг' },
                ] : []),
              ]).map(({ key, label }) => (
                <div key={key} className="mb-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
                  <div className="grid grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Өнгө</label>
                      <div className="flex items-center gap-1">
                        <input type="color" value={formData.styles[key].fontcolor}
                          onChange={(e) => setFormData({ ...formData, styles: { ...formData.styles, [key]: { ...formData.styles[key], fontcolor: e.target.value } } })}
                          className="w-7 h-7 rounded cursor-pointer border border-slate-300" />
                        <input type="text" value={formData.styles[key].fontcolor}
                          onChange={(e) => setFormData({ ...formData, styles: { ...formData.styles, [key]: { ...formData.styles[key], fontcolor: e.target.value } } })}
                          className="flex-1 px-1.5 py-1 border border-slate-300 rounded text-[10px] font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Хэмжээ</label>
                      <input type="number" min="10" max="48" value={formData.styles[key].fontsize}
                        onChange={(e) => setFormData({ ...formData, styles: { ...formData.styles, [key]: { ...formData.styles[key], fontsize: parseInt(e.target.value) || 14 } } })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Жин</label>
                      <select value={formData.styles[key].fontweight}
                        onChange={(e) => setFormData({ ...formData, styles: { ...formData.styles, [key]: { ...formData.styles[key], fontweight: e.target.value } } })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs">
                        <option value="normal">Normal</option><option value="medium">Medium</option><option value="semibold">Semibold</option><option value="bold">Bold</option><option value="extrabold">Extrabold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Тэгшлэл</label>
                      <select value={formData.styles[key].textalign}
                        onChange={(e) => setFormData({ ...formData, styles: { ...formData.styles, [key]: { ...formData.styles[key], textalign: e.target.value } } })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs">
                        <option value="left">← Зүүн</option><option value="center">↔ Төв</option><option value="right">→ Баруун</option><option value="justify">⇔ Тэгш</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Фонт</label>
                      <FontSelect
                        value={formData.styles[key].fontfamily || ''}
                        onChange={(v) => setFormData({ ...formData, styles: { ...formData.styles, [key]: { ...formData.styles[key], fontfamily: v } } })}
                        label=""
                        className=""
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

      {/* Category Edit/Add Modal */}
      <Modal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} title={catEditing ? 'Ангилал засварлах' : 'Ангилал нэмэх'}>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Түлхүүр (key) *</label>
              <Input
                value={catForm.key}
                onChange={(e) => setCatForm({ ...catForm, key: e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase() })}
                placeholder="жишээ: board, executive"
                disabled={!!catEditing}
              />
              <p className="text-xs text-slate-400 mt-1">Зөвхөн англи үсэг, тоо, _ зөвшөөрнө</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Нэр (Монгол) *</label>
                <Input value={catForm.label_mn} onChange={(e) => setCatForm({ ...catForm, label_mn: e.target.value })} placeholder="Монгол нэр" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name (English)</label>
                <Input value={catForm.label_en} onChange={(e) => setCatForm({ ...catForm, label_en: e.target.value })} placeholder="English name" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Уриа үг (Монгол)</label>
                <Input value={catForm.slogan_mn} onChange={(e) => setCatForm({ ...catForm, slogan_mn: e.target.value })} placeholder="Жишээ: Хамтын хүчээр хөгжинө" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Slogan (English)</label>
                <Input value={catForm.slogan_en} onChange={(e) => setCatForm({ ...catForm, slogan_en: e.target.value })} placeholder="Example: Growing stronger together" />
              </div>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-slate-600 mb-1">Дараалал</label>
              <Input type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: parseInt(e.target.value) || 0 })} />
            </div>

            {/* Category Label Styling */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>🎨</span> Ангилал текст стиль
              </h4>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Өнгө</label>
                  <div className="flex items-center gap-1">
                    <input type="color" value={catForm.catStyle.fontcolor}
                      onChange={(e) => setCatForm({ ...catForm, catStyle: { ...catForm.catStyle, fontcolor: e.target.value } })}
                      className="w-7 h-7 rounded cursor-pointer border border-slate-300" />
                    <input type="text" value={catForm.catStyle.fontcolor}
                      onChange={(e) => setCatForm({ ...catForm, catStyle: { ...catForm.catStyle, fontcolor: e.target.value } })}
                      className="flex-1 px-1.5 py-1 border border-slate-300 rounded text-[10px] font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Хэмжээ</label>
                  <input type="number" min="10" max="48" value={catForm.catStyle.fontsize}
                    onChange={(e) => setCatForm({ ...catForm, catStyle: { ...catForm.catStyle, fontsize: parseInt(e.target.value) || 14 } })}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Жин</label>
                  <select value={catForm.catStyle.fontweight}
                    onChange={(e) => setCatForm({ ...catForm, catStyle: { ...catForm.catStyle, fontweight: e.target.value } })}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs">
                    <option value="normal">Normal</option><option value="medium">Medium</option><option value="semibold">Semibold</option><option value="bold">Bold</option><option value="extrabold">Extrabold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Тэгшлэл</label>
                  <select value={catForm.catStyle.textalign}
                    onChange={(e) => setCatForm({ ...catForm, catStyle: { ...catForm.catStyle, textalign: e.target.value } })}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs">
                    <option value="left">← Зүүн</option><option value="center">↔ Төв</option><option value="right">→ Баруун</option><option value="justify">⇔ Тэгш</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Фонт</label>
                  <FontSelect
                    value={catForm.catStyle.fontfamily || ''}
                    onChange={(v) => setCatForm({ ...catForm, catStyle: { ...catForm.catStyle, fontfamily: v } })}
                    label=""
                    className=""
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border border-blue-100 rounded-lg p-4 bg-blue-50/50">
            <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>↔</span> Уриа үгийн стиль
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Өнгө</label>
                <div className="flex items-center gap-1">
                  <input type="color" value={catForm.sloganStyle.fontcolor}
                    onChange={(e) => setCatForm({ ...catForm, sloganStyle: { ...catForm.sloganStyle, fontcolor: e.target.value } })}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-300" />
                  <input type="text" value={catForm.sloganStyle.fontcolor}
                    onChange={(e) => setCatForm({ ...catForm, sloganStyle: { ...catForm.sloganStyle, fontcolor: e.target.value } })}
                    className="flex-1 px-1.5 py-1 border border-slate-300 rounded text-[10px] font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Хэмжээ</label>
                <input type="number" min="10" max="64" value={catForm.sloganStyle.fontsize}
                  onChange={(e) => setCatForm({ ...catForm, sloganStyle: { ...catForm.sloganStyle, fontsize: parseInt(e.target.value) || 18 } })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Фонт</label>
                <FontSelect
                  value={catForm.sloganStyle.fontfamily || ''}
                  onChange={(v) => setCatForm({ ...catForm, sloganStyle: { ...catForm.sloganStyle, fontfamily: v } })}
                  label=""
                  className=""
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <div className="flex-1" />
            <button onClick={() => setCatModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">Цуцлах</button>
            <button onClick={handleSaveCategory} disabled={catSaving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 font-medium">
              {catSaving ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
