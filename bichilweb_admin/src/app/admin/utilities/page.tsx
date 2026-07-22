'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Modal from '@/components/Modal'
import { Input, PageHeader, Button } from '@/components/FormElements'
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { axiosInstance } from '@/lib/axios'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

/* --- TYPES --- */
interface CollateralTranslation { id?: number; language: number; label: string }
interface CollateralAPI { id: number; translations: CollateralTranslation[] }
interface CollateralItem { id: number; label_mn: string; label_en: string }

interface ConditionTranslation { id?: number; language: number; label: string }
interface ConditionAPI { id: number; translations: ConditionTranslation[] }
interface ConditionItem { id: number; label_mn: string; label_en: string }

interface DocumentTranslation { id?: number; language: number; label: string }
interface DocumentAPI { id: number; translations: DocumentTranslation[] }
interface DocumentItem { id: number; label_mn: string; label_en: string }

/* --- HELPERS --- */
const getTranslation = <T extends { language: number; label: string }>(
  translations: T[], language: number
) => translations.find(t => t.language === language)

/* --- MAP API TO ITEM --- */
const mapApiToCollateral = (item: CollateralAPI): CollateralItem => {
  const en = getTranslation(item.translations, 1)
  const mn = getTranslation(item.translations, 2)
  return { id: item.id, label_mn: mn?.label || '', label_en: en?.label || '' }
}

const mapApiToCondition = (item: ConditionAPI): ConditionItem => {
  const en = getTranslation(item.translations, 1)
  const mn = getTranslation(item.translations, 2)
  return { id: item.id, label_mn: mn?.label || '', label_en: en?.label || '' }
}

const mapApiToDocument = (item: DocumentAPI): DocumentItem => {
  const en = getTranslation(item.translations, 1)
  const mn = getTranslation(item.translations, 2)
  return { id: item.id, label_mn: mn?.label || '', label_en: en?.label || '' }
}

/* --- COMPONENT --- */
export default function AdminCollateralsConditionsDocuments() {
  const { language, t } = useLanguage()

  /* --- STATES --- */
  const [collaterals, setCollaterals] = useState<CollateralItem[]>([])
  const [conditions, setConditions] = useState<ConditionItem[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])

  /* Collateral modal */
  const [collateralModalOpen, setCollateralModalOpen] = useState(false)
  const [editingCollateral, setEditingCollateral] = useState<CollateralItem | null>(null)
  const [collLabelMn, setCollLabelMn] = useState('')
  const [collLabelEn, setCollLabelEn] = useState('')

  /* Condition modal */
  const [conditionModalOpen, setConditionModalOpen] = useState(false)
  const [editingCondition, setEditingCondition] = useState<ConditionItem | null>(null)
  const [condLabelMn, setCondLabelMn] = useState('')
  const [condLabelEn, setCondLabelEn] = useState('')

  /* Document modal */
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null)
  const [docLabelMn, setDocLabelMn] = useState('')
  const [docLabelEn, setDocLabelEn] = useState('')

  const [isSaving, setIsSaving] = useState(false)

  /* Accordion & Search */
  const [collateralOpen, setCollateralOpen] = useState(true)
  const [conditionOpen, setConditionOpen] = useState(false)
  const [documentOpen, setDocumentOpen] = useState(false)
  const [collSearch, setCollSearch] = useState('')
  const [condSearch, setCondSearch] = useState('')
  const [docSearch, setDocSearch] = useState('')

  const filterItems = <T extends { label_mn: string; label_en: string }>(items: T[], query: string) => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(i => i.label_mn.toLowerCase().includes(q) || i.label_en.toLowerCase().includes(q))
  }

  /* --- FETCH DATA --- */
  useEffect(() => {
    fetchCollaterals()
    fetchConditions()
    fetchDocuments()
  }, [])

  const fetchCollaterals = async () => {
    try { const res = await axiosInstance.get('/collateral/')
      const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
      setCollaterals(data.map(mapApiToCollateral))
    } catch (err) { console.error(err) }
  }

  const fetchConditions = async () => {
    try { const res = await axiosInstance.get('/condition')
      const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
      setConditions(data.map(mapApiToCondition))
    } catch (err) { console.error(err) }
  }

  const fetchDocuments = async () => {
    try { const res = await axiosInstance.get('/document')
      const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
      setDocuments(data.map(mapApiToDocument))
    } catch (err) { console.error(err) }
  }

  /* --- COLLATERAL HANDLERS --- */
  const handleSubmitCollateral = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const payload = [{ language: 1, label: collLabelEn }, { language: 2, label: collLabelMn }]
    try {
      if (editingCollateral) await axiosInstance.put(`/collateral/${editingCollateral.id}/`, { translations: payload })
      else await axiosInstance.post('/collateral/', { translations: payload })
      await fetchCollaterals()
      closeCollateralModal()
    } finally { setIsSaving(false) }
  }

  const handleEditCollateral = (item: CollateralItem) => {
    setEditingCollateral(item); setCollLabelMn(item.label_mn); setCollLabelEn(item.label_en)
    setCollateralModalOpen(true)
  }

  const handleDeleteCollateral = async (id: number) => {
    if (!confirm(t('Устгах уу?', 'Are you sure to delete?'))) return
    await axiosInstance.delete(`/collateral/${id}/`)
    fetchCollaterals()
  }

  const closeCollateralModal = () => { setCollateralModalOpen(false); setEditingCollateral(null); setCollLabelMn(''); setCollLabelEn('') }

  /* --- CONDITION HANDLERS --- */
  const handleSubmitCondition = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const payload = [{ language: 1, label: condLabelEn }, { language: 2, label: condLabelMn }]
    try {
      if (editingCondition) await axiosInstance.put(`/condition/${editingCondition.id}/`, { translations: payload })
      else await axiosInstance.post('/condition/', { translations: payload })
      await fetchConditions()
      closeConditionModal()
    } finally { setIsSaving(false) }
  }

  const handleEditCondition = (item: ConditionItem) => {
    setEditingCondition(item); setCondLabelMn(item.label_mn); setCondLabelEn(item.label_en)
    setConditionModalOpen(true)
  }

  const handleDeleteCondition = async (id: number) => {
    if (!confirm(t('Устгах уу?', 'Are you sure to delete?'))) return
    await axiosInstance.delete(`/condition/${id}/`)
    fetchConditions()
  }

  const closeConditionModal = () => { setConditionModalOpen(false); setEditingCondition(null); setCondLabelMn(''); setCondLabelEn('') }

  /* --- DOCUMENT HANDLERS --- */
  const handleSubmitDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const payload = [{ language: 1, label: docLabelEn }, { language: 2, label: docLabelMn }]
    try {
      if (editingDocument) await axiosInstance.put(`/document/${editingDocument.id}/`, { translations: payload })
      else await axiosInstance.post('/document/', { translations: payload })
      await fetchDocuments()
      closeDocumentModal()
    } finally { setIsSaving(false) }
  }

  const handleEditDocument = (item: DocumentItem) => {
    setEditingDocument(item); setDocLabelMn(item.label_mn); setDocLabelEn(item.label_en)
    setDocumentModalOpen(true)
  }

  const handleDeleteDocument = async (id: number) => {
    if (!confirm(t('Устгах уу?', 'Are you sure to delete?'))) return
    await axiosInstance.delete(`/document/${id}/`)
    fetchDocuments()
  }

  const closeDocumentModal = () => { setDocumentModalOpen(false); setEditingDocument(null); setDocLabelMn(''); setDocLabelEn('') }

  /* --- RENDER --- */
  const filteredCollaterals = filterItems(collaterals, collSearch)
  const filteredConditions = filterItems(conditions, condSearch)
  const filteredDocuments = filterItems(documents, docSearch)

  return (
    <AdminLayout title={t('Барьцаа, Нөхцөл & Бичиг баримт', 'Collaterals, Conditions & Documents')}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">

        {/* Header */}
        <PageHeader
          title={t('Барьцаа, Нөхцөл & Бичиг баримт', 'Collaterals, Conditions & Documents')}
          description={t('Зээлийн барьцаа, нөхцөл, бичиг баримт удирдах', 'Manage Collaterals, Conditions & Documents')}
          action={<LanguageSwitcher />}
        />

        {/* ─── COLLATERAL ACCORDION ─── */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div
            onClick={() => setCollateralOpen(!collateralOpen)}
            className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-teal-50 flex items-center justify-center">
                <span className="text-teal-600 font-bold text-sm sm:text-base">{collaterals.length}</span>
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-sm sm:text-base text-gray-900">{t('Барьцаа', 'Collaterals')}</h2>
                <p className="text-xs text-gray-500 hidden sm:block">{t('Барьцаа удирдах', 'Manage Collaterals')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {collateralOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
            </div>
          </div>

          {collateralOpen && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('Хайх...', 'Search...')}
                    value={collSearch}
                    onChange={e => setCollSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>
                <Button variant="dark" onClick={() => setCollateralModalOpen(true)} icon={<PlusIcon className="h-4 w-4" />} className="whitespace-nowrap text-sm">
                  {t('Нэмэх', 'Add')}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 sm:mt-4">
                {filteredCollaterals.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-3 sm:p-4 group hover:shadow-md transition flex items-center justify-between gap-2">
                    <h3 className="font-medium text-sm text-gray-800 truncate flex-1">{language==='mn'?item.label_mn||item.label_en:item.label_en||item.label_mn}</h3>
                    <div className="flex gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition">
                      <button onClick={() => handleEditCollateral(item)} className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm"><PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                      <button onClick={() => handleDeleteCollateral(item.id)} className="p-1.5 sm:p-2 bg-red-50 rounded-lg shadow-sm"><TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" /></button>
                    </div>
                  </div>
                ))}
                {filteredCollaterals.length === 0 && (
                  <p className="text-sm text-gray-400 col-span-full text-center py-4">{collSearch ? t('Илэрц олдсонгүй', 'No results found') : t('Барьцаа байхгүй', 'No collaterals')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── CONDITION ACCORDION ─── */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div
            onClick={() => setConditionOpen(!conditionOpen)}
            className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm sm:text-base">{conditions.length}</span>
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-sm sm:text-base text-gray-900">{t('Нөхцөл', 'Conditions')}</h2>
                <p className="text-xs text-gray-500 hidden sm:block">{t('Нөхцөл удирдах', 'Manage Conditions')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {conditionOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
            </div>
          </div>

          {conditionOpen && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('Хайх...', 'Search...')}
                    value={condSearch}
                    onChange={e => setCondSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>
                <Button variant="dark" onClick={() => setConditionModalOpen(true)} icon={<PlusIcon className="h-4 w-4" />} className="whitespace-nowrap text-sm">
                  {t('Нэмэх', 'Add')}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 sm:mt-4">
                {filteredConditions.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-3 sm:p-4 group hover:shadow-md transition flex items-center justify-between gap-2">
                    <h3 className="font-medium text-sm text-gray-800 truncate flex-1">{language==='mn'?item.label_mn||item.label_en:item.label_en||item.label_mn}</h3>
                    <div className="flex gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition">
                      <button onClick={() => handleEditCondition(item)} className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm"><PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                      <button onClick={() => handleDeleteCondition(item.id)} className="p-1.5 sm:p-2 bg-red-50 rounded-lg shadow-sm"><TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" /></button>
                    </div>
                  </div>
                ))}
                {filteredConditions.length === 0 && (
                  <p className="text-sm text-gray-400 col-span-full text-center py-4">{condSearch ? t('Илэрц олдсонгүй', 'No results found') : t('Нөхцөл байхгүй', 'No conditions')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── DOCUMENT ACCORDION ─── */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div
            onClick={() => setDocumentOpen(!documentOpen)}
            className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm sm:text-base">{documents.length}</span>
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-sm sm:text-base text-gray-900">{t('Бичиг баримт', 'Documents')}</h2>
                <p className="text-xs text-gray-500 hidden sm:block">{t('Бичиг баримт удирдах', 'Manage Documents')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {documentOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
            </div>
          </div>

          {documentOpen && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('Хайх...', 'Search...')}
                    value={docSearch}
                    onChange={e => setDocSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>
                <Button variant="dark" onClick={() => setDocumentModalOpen(true)} icon={<PlusIcon className="h-4 w-4" />} className="whitespace-nowrap text-sm">
                  {t('Нэмэх', 'Add')}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 sm:mt-4">
                {filteredDocuments.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-3 sm:p-4 group hover:shadow-md transition flex items-center justify-between gap-2">
                    <h3 className="font-medium text-sm text-gray-800 truncate flex-1">{language==='mn'?item.label_mn||item.label_en:item.label_en||item.label_mn}</h3>
                    <div className="flex gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition">
                      <button onClick={() => handleEditDocument(item)} className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm"><PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                      <button onClick={() => handleDeleteDocument(item.id)} className="p-1.5 sm:p-2 bg-red-50 rounded-lg shadow-sm"><TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" /></button>
                    </div>
                  </div>
                ))}
                {filteredDocuments.length === 0 && (
                  <p className="text-sm text-gray-400 col-span-full text-center py-4">{docSearch ? t('Илэрц олдсонгүй', 'No results found') : t('Бичиг баримт байхгүй', 'No documents')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <Modal isOpen={collateralModalOpen} onClose={closeCollateralModal} title={editingCollateral?t('Барьцаа засах','Edit Collateral'):t('Шинэ барьцаа','Add Collateral')}>
        <form onSubmit={handleSubmitCollateral} className="space-y-4">
          <Input label={t('Нэр (Монгол)','Name (Mongolian)')} value={collLabelMn} onChange={(e)=>setCollLabelMn(e.target.value)} required/>
          <Input label={t('Нэр (Англи)','Name (English)')} value={collLabelEn} onChange={(e)=>setCollLabelEn(e.target.value)} required/>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeCollateralModal} className="px-4 py-2 border rounded-lg">{t('Цуцлах','Cancel')}</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-teal-600 text-white rounded-lg">{isSaving?t('Хадгалж байна...','Saving...'):editingCollateral?t('Шинэчлэх','Update'):t('Нэмэх','Add')}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={conditionModalOpen} onClose={closeConditionModal} title={editingCondition?t('Нөхцөл засах','Edit Condition'):t('Шинэ нөхцөл','Add Condition')}>
        <form onSubmit={handleSubmitCondition} className="space-y-4">
          <Input label={t('Нэр (Монгол)','Name (Mongolian)')} value={condLabelMn} onChange={(e)=>setCondLabelMn(e.target.value)} required/>
          <Input label={t('Нэр (Англи)','Name (English)')} value={condLabelEn} onChange={(e)=>setCondLabelEn(e.target.value)} required/>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeConditionModal} className="px-4 py-2 border rounded-lg">{t('Цуцлах','Cancel')}</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-teal-600 text-white rounded-lg">{isSaving?t('Хадгалж байна...','Saving...'):editingCondition?t('Шинэчлэх','Update'):t('Нэмэх','Add')}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={documentModalOpen} onClose={closeDocumentModal} title={editingDocument?t('Бичиг баримт засах','Edit Document'):t('Шинэ бичиг баримт','Add Document')}>
        <form onSubmit={handleSubmitDocument} className="space-y-4">
          <Input label={t('Нэр (Монгол)','Name (Mongolian)')} value={docLabelMn} onChange={(e)=>setDocLabelMn(e.target.value)} required/>
          <Input label={t('Нэр (Англи)','Name (English)')} value={docLabelEn} onChange={(e)=>setDocLabelEn(e.target.value)} required/>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeDocumentModal} className="px-4 py-2 border rounded-lg">{t('Цуцлах','Cancel')}</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-teal-600 text-white rounded-lg">{isSaving?t('Хадгалж байна...','Saving...'):editingDocument?t('Шинэчлэх','Update'):t('Нэмэх','Add')}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  )
}
