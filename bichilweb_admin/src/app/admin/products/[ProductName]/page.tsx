'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { Input, Textarea, Select, PageHeader } from '@/components/FormElements'
import ProductPage from '@/components/ProductPage'
import DocumentSelector from '@/components/DocumentSelector'
import { axiosInstance } from '@/lib/axios'
import { useProduct } from '@/contexts/productContext'

interface Translation {
  id: number
  language: number
  label: string
}

interface ProductDetail {
  id: number
  amount: string
  min_fee_percent: string
  max_fee_percent: string
  min_interest_rate: string
  max_interest_rate: string
  term_months: number
  min_processing_hours: number
  max_processing_hoyrs: number
  processing_time_minutes?: number
  fee_type?: string
  calc_btn_color?: string
  calc_btn_font_size?: string
  calc_btn_text?: string
  request_btn_color?: string
  request_btn_font_size?: string
  request_btn_text?: string
  request_btn_url?: string
  disclaimer_color?: string
  disclaimer_font_size?: string
  disclaimer_text?: string
  banner_image?: string
  banner_mobile_image?: string
  description_mn?: string
  description_en?: string
  description_color?: string
  description_font_size?: string
  description_align?: string
  description_font_family?: string
}

interface Document {
  id: number
  translations: Translation[]
}

interface ProductDocument {
  id: number
  document: Document
}

interface Collateral {
  id: number
  translations: Translation[]
}

interface ProductCollateral {
  id: number
  collateral: Collateral
}

interface Condition {
  id: number
  translations: Translation[]
}

interface ProductCondition {
  id: number
  condition: Condition
}

interface ApiProductResponse {
  id: number
  product_type: number
  translations: Translation[]
  details: ProductDetail[]
  documents: ProductDocument[]
  collaterals: ProductCollateral[]
  conditions: ProductCondition[]
}

interface ProductTypeItem {
  id: number
  category: number
  translations: Translation[]
}

interface CategoryItem {
  id: number
  translations: Translation[]
  product_types: any[]
}

interface SelectedDocument {
  id: number
  product_relation_id?: number
  label_mn: string
  label_en: string
}

interface ProductDetailsForm {
  amount: string
  feeType: string
  fee_percent: string
  min_interest_rate: string
  max_interest_rate: string
  term_months: string
  processing_time_minutes: string
  // Calculator styling
  calcBtnColor: string
  calcBtnFontSize: string
  calcBtnText: string
  requestBtnColor: string
  requestBtnFontSize: string
  requestBtnText: string
  requestBtnUrl: string
  disclaimerColor: string
  disclaimerFontSize: string
  disclaimerText: string
  // Banner
  bannerImage: string
  bannerMobileImage: string
  // Description
  descriptionMn: string
  descriptionEn: string
  descriptionColor: string
  descriptionFontSize: string
  descriptionAlign: string
  descriptionFontFamily: string
}

interface ProductData {
  id: string
  product_type: number
  name_mn: string
  name_en: string
  category_mn: string
  category_en: string
  description_mn: string
  description_en: string
  details: ProductDetailsForm
  detailsId?: number
  documents: SelectedDocument[]
  collaterals: SelectedDocument[]
  conditions: SelectedDocument[]
  status: 'draft' | 'published'
}


const getTranslation = (translations: Translation[], languageId: number): string => {
  const translation = translations.find(t => t.language === languageId)
  return translation?.label || ''
}

const transformApiToUi = (apiData: ApiProductResponse): ProductData => {
  const detail = apiData.details?.[0] || {
    id: 0,
    amount: '0',
    min_fee_percent: '0',
    max_fee_percent: '0',
    min_interest_rate: '0',
    max_interest_rate: '0',
    term_months: 0,
    min_processing_hours: 0,
    max_processing_hoyrs: 0,
    processing_time_minutes: 0,
    fee_type: 'fee'
  }
  
  return {
    id: apiData.id.toString(),
    product_type: apiData.product_type,
    name_mn: getTranslation(apiData.translations, 2),
    name_en: getTranslation(apiData.translations, 1),
    category_mn: 'Бизнес · Санхүүжилт',
    category_en: 'Business · Financing',
    description_mn: '',
    description_en: '',
    details: {
      amount: detail.amount,
      feeType: detail.fee_type || 'fee',
      fee_percent: detail.min_fee_percent,
      min_interest_rate: detail.min_interest_rate,
      max_interest_rate: detail.max_interest_rate,
      term_months: detail.term_months.toString(),
      processing_time_minutes: (detail.processing_time_minutes || 0).toString(),
      calcBtnColor: detail.calc_btn_color || '#0048BA',
      calcBtnFontSize: detail.calc_btn_font_size || '14px',
      calcBtnText: detail.calc_btn_text || 'Тооцоолох',
      requestBtnColor: detail.request_btn_color || '#2563eb',
      requestBtnFontSize: detail.request_btn_font_size || '14px',
      requestBtnText: detail.request_btn_text || 'Хүсэлт илгээх',
      requestBtnUrl: detail.request_btn_url || '',
      disclaimerColor: detail.disclaimer_color || '#92400e',
      disclaimerFontSize: detail.disclaimer_font_size || '10px',
      disclaimerText: detail.disclaimer_text || 'Энэхүү тооцоолуур нь зөвхөн мэдээллийн зорилготой бөгөөд бодит зээлийн нөхцөл өөр байж болно.',
      // Banner & Description
      bannerImage: detail.banner_image || '',
      bannerMobileImage: detail.banner_mobile_image || '',
      descriptionMn: detail.description_mn || '',
      descriptionEn: detail.description_en || '',
      descriptionColor: detail.description_color || '#ffffff',
      descriptionFontSize: detail.description_font_size || '16px',
      descriptionAlign: detail.description_align || 'center',
      descriptionFontFamily: detail.description_font_family || '',
    },
    detailsId: detail.id,
    documents: apiData.documents?.map((doc) => ({
      id: doc.document.id,
      product_relation_id: doc.id,
      label_mn: getTranslation(doc.document.translations, 2),
      label_en: getTranslation(doc.document.translations, 1),
    })) || [],
    collaterals: apiData.collaterals?.map((coll) => ({
      id: coll.collateral.id,
      product_relation_id: coll.id,
      label_mn: getTranslation(coll.collateral.translations, 2),
      label_en: getTranslation(coll.collateral.translations, 1),
    })) || [],
    conditions: apiData.conditions?.map((cond) => ({
      id: cond.condition.id,
      product_relation_id: cond.id,
      label_mn: getTranslation(cond.condition.translations, 2),
      label_en: getTranslation(cond.condition.translations, 1),
    })) || [],
    status: 'draft',
  }
}

const createDefaultData = (): ProductData => ({
  id: '',
  product_type: 1,
  name_mn: '',
  name_en: '',
  category_mn: 'Бизнес · Санхүүжилт',
  category_en: 'Business · Financing',
  description_mn: '',
  description_en: '',
  details: {
    amount: '0',
    feeType: 'fee',
    fee_percent: '0',
    min_interest_rate: '0',
    max_interest_rate: '0',
    term_months: '0',
    processing_time_minutes: '0',
    calcBtnColor: '#0048BA',
    calcBtnFontSize: '14px',
    calcBtnText: 'Тооцоолох',
    requestBtnColor: '#2563eb',
    requestBtnFontSize: '14px',
    requestBtnText: 'Хүсэлт илгээх',
    requestBtnUrl: '',
    disclaimerColor: '#92400e',
    disclaimerFontSize: '10px',
    disclaimerText: 'Энэхүү тооцоолуур нь зөвхөн мэдээллийн зорилготой бөгөөд бодит зээлийн нөхцөл өөр байж болно.',
    // Banner & Description
    bannerImage: '',
    bannerMobileImage: '',
    descriptionMn: '',
    descriptionEn: '',
    descriptionColor: '#ffffff',
    descriptionFontSize: '16px',
    descriptionAlign: 'center',
      descriptionFontFamily: '',
  },
  documents: [],
  collaterals: [],
  conditions: [],
  status: 'draft',
})

export default function ProductAdminPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.ProductName as string
  
  const [data, setData] = useState<ProductData>(createDefaultData())
  const [previewLang, setPreviewLang] = useState<'mn' | 'en'>('mn')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [availableCollaterals, setAvailableCollaterals] = useState<Document[]>([])
  const [availableConditions, setAvailableConditions] = useState<Document[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [productTypes, setProductTypes] = useState<ProductTypeItem[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingMobileBanner, setUploadingMobileBanner] = useState(false)

  const handleBannerUpload = async (file: File, field: 'bannerImage' | 'bannerMobileImage') => {
    const setter = field === 'bannerImage' ? setUploadingBanner : setUploadingMobileBanner
    setter(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await axiosInstance.post('/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = res.data.url || res.data.file_url
      updateData(prev => ({
        ...prev,
        details: { ...prev.details, [field]: url }
      }))
    } catch (err: any) {
      console.error('Banner upload failed:', err)
      alert('Зураг хадгалахад алдаа гарлаа')
    } finally {
      setter(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setError('Product ID олдсонгүй')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setLoadingAvailable(true)
        setError(null)
        
        const [productRes, docsRes, collsRes, condsRes, catsRes, ptRes] = await Promise.all([
          axiosInstance.get<ApiProductResponse>(`/product/${productId}`),
          axiosInstance.get<Document[]>('/document/'),
          axiosInstance.get<Document[]>('/collateral/'),
          axiosInstance.get<Document[]>('/condition/'),
          axiosInstance.get('/categories/'),
          axiosInstance.get('/product-type/')
        ])
        
        const extract = (d: any) => Array.isArray(d) ? d : (d?.results ?? [])
        setData(transformApiToUi(productRes.data))
        setAvailableDocuments(extract(docsRes.data))
        setAvailableCollaterals(extract(collsRes.data))
        setAvailableConditions(extract(condsRes.data))
        setCategories(extract(catsRes.data))
        setProductTypes(extract(ptRes.data))
        
      } catch (err: any) {
        console.error('Failed to fetch data:', err)
        setError(`Алдаа гарлаа: ${err.response?.data?.message || err.message}`)
      } finally {
        setLoading(false)
        setLoadingAvailable(false)
      }
    }

    fetchData()
  }, [productId])

  const updateData = (updater: (prev: ProductData) => ProductData) => {
    setData(updater)
  }

  const getCategoryLabel = (productTypeId: number, lang: 'mn' | 'en'): string => {
    const productType = productTypes.find(pt => pt.id === productTypeId)
    if (!productType) return ''
    const category = categories.find(cat => cat.id === productType.category)
    if (!category) return ''
    return getTranslation(category.translations, lang === 'mn' ? 2 : 1)
  }

  const getProductTypeLabel = (productTypeId: number, lang: 'mn' | 'en'): string => {
    const productType = productTypes.find(pt => pt.id === productTypeId)
    if (!productType) return ''
    return getTranslation(productType.translations, lang === 'mn' ? 2 : 1)
  }

  const productTypeTitle = (() => {
    const catLabel = getCategoryLabel(data.product_type, 'mn')
    const typeLabel = getProductTypeLabel(data.product_type, 'mn')
    if (catLabel && typeLabel) return `${catLabel} · ${typeLabel}`
    return data.name_mn || 'Бүтээгдэхүүн'
  })()

  const handleAddDocument = async (document: Document): Promise<boolean> => {
    try {
      const newDoc: SelectedDocument = {
        id: document.id,
        label_mn: getTranslation(document.translations, 2),
        label_en: getTranslation(document.translations, 1),
      }

      setData(prev => ({
        ...prev,
        documents: [...prev.documents, newDoc]
      }))

      return true
    } catch (error: any) {
      throw new Error('Баримт нэмэхэд алдаа гарлаа')
    }
  }

  const handleRemoveDocument = async (documentId: number): Promise<boolean> => {
    try {
      setData(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== documentId)
      }))

      return true
    } catch (error: any) {
      throw new Error('Баримт устгахад алдаа гарлаа')
    }
  }

  const handleAddCollateral = async (collateral: Document): Promise<boolean> => {
    try {
      const newColl: SelectedDocument = {
        id: collateral.id,
        label_mn: getTranslation(collateral.translations, 2),
        label_en: getTranslation(collateral.translations, 1),
      }

      setData(prev => ({
        ...prev,
        collaterals: [...prev.collaterals, newColl]
      }))

      return true
    } catch (error: any) {
      throw new Error('Барьцаа нэмэхэд алдаа гарлаа')
    }
  }

  const handleRemoveCollateral = async (collateralId: number): Promise<boolean> => {
    try {
      setData(prev => ({
        ...prev,
        collaterals: prev.collaterals.filter(c => c.id !== collateralId)
      }))

      return true
    } catch (error: any) {
      throw new Error('Барьцаа устгахад алдаа гарлаа')
    }
  }

  const handleAddCondition = async (condition: Document): Promise<boolean> => {
    try {
      const newCond: SelectedDocument = {
        id: condition.id,
        label_mn: getTranslation(condition.translations, 2),
        label_en: getTranslation(condition.translations, 1),
      }

      setData(prev => ({
        ...prev,
        conditions: [...prev.conditions, newCond]
      }))

      return true
    } catch (error: any) {
      throw new Error('Нөхцөл нэмэхэд алдаа гарлаа')
    }
  }

  const handleRemoveCondition = async (conditionId: number): Promise<boolean> => {
    try {
      setData(prev => ({
        ...prev,
        conditions: prev.conditions.filter(c => c.id !== conditionId)
      }))

      return true
    } catch (error: any) {
      throw new Error('Нөхцөл устгахад алдаа гарлаа')
    }
  }

 

  const handleDeleteProduct = async () => {
    if (!productId) return
    const confirmMsg = `Та "${data.name_mn || data.name_en}" бүтээгдэхүүнийг устгахдаа итгэлтэй байна уу?\n\nЭнэ үйлдлийг буцаах боломжгүй!`
    if (!confirm(confirmMsg)) return
    setIsDeleting(true)
    try {
      await axiosInstance.delete(`/product/${productId}/`)
      alert('Бүтээгдэхүүн амжилттай устгагдлаа!')
      router.push('/admin/product-add')
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Тодорхойгүй алдаа'
      alert(`Устгахад алдаа гарлаа: ${errorMsg}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveAll = async () => {
    if (!productId) return

    setIsSaving(true)
    try {
      const updatePayload = {
        product_type: data.product_type,
        translations: [
          { language: 1, label: data.name_en },
          { language: 2, label: data.name_mn }
        ],
        details: {
          amount: parseFloat(data.details.amount),
          min_fee_percent: parseFloat(data.details.fee_percent),
          max_fee_percent: parseFloat(data.details.fee_percent),
          min_interest_rate: parseFloat(data.details.min_interest_rate),
          max_interest_rate: parseFloat(data.details.max_interest_rate),
          term_months: parseInt(data.details.term_months),
          processing_time_minutes: parseInt(data.details.processing_time_minutes) || 0,
          fee_type: data.details.feeType,
          calc_btn_color: data.details.calcBtnColor,
          calc_btn_font_size: data.details.calcBtnFontSize,
          calc_btn_text: data.details.calcBtnText,
          request_btn_color: data.details.requestBtnColor,
          request_btn_font_size: data.details.requestBtnFontSize,
          request_btn_text: data.details.requestBtnText,
          request_btn_url: data.details.requestBtnUrl,
          disclaimer_color: data.details.disclaimerColor,
          disclaimer_font_size: data.details.disclaimerFontSize,
          disclaimer_text: data.details.disclaimerText,
          // Banner & Description
          banner_image: data.details.bannerImage,
          banner_mobile_image: data.details.bannerMobileImage,
          description_mn: data.details.descriptionMn,
          description_en: data.details.descriptionEn,
          description_color: data.details.descriptionColor,
          description_font_size: data.details.descriptionFontSize,
          description_align: data.details.descriptionAlign,
          description_font_family: data.details.descriptionFontFamily,
        },
        documents: data.documents.map(doc => ({
          document: doc.id
        })),
        collaterals: data.collaterals.map(coll => ({
          collateral: coll.id
        })),
        conditions: data.conditions.map(cond => ({
          condition: cond.id
        }))
      }

      await axiosInstance.put(`/product/${productId}/`, updatePayload)
      alert('Бүх мэдээлэл амжилттай хадгалагдлаа!')
      
      const productRes = await axiosInstance.get<ApiProductResponse>(`/product/${productId}`)
      setData(transformApiToUi(productRes.data))
      
    } catch (error: any) {
      console.error('Save failed:', error)
      const errorMsg = error.response?.data?.detail 
        || error.response?.data?.message 
        || error.message 
        || 'Тодорхойгүй алдаа'
      alert(`Алдаа: ${errorMsg}`)
    } finally {
      setIsSaving(false)
    }
  }

  const previewStats = {
    interest: `${data.details.min_interest_rate}% - ${data.details.max_interest_rate}%`,
    decision: `${data.details.processing_time_minutes} минут`,
    term: `${data.details.term_months} сар`,
  }

  const previewDetails = {
    amount: `${parseFloat(data.details.amount || '0').toLocaleString()}₮`,
    fee: `${data.details.fee_percent}%`,
    feeLabel: data.details.feeType === 'down_payment' ? 'Урьдчилгаа төлбөр /%/' : 'Шимтгэл /%/',
    feeLabelEn: data.details.feeType === 'down_payment' ? 'Down Payment' : 'Fee',
    interest: `${data.details.min_interest_rate}% - ${data.details.max_interest_rate}%`,
    term: `${data.details.term_months} сар`,
    decision: `${data.details.processing_time_minutes} минут`,
  }

  if (loading) {
    return (
      <AdminLayout title="Бүтээгдэхүүн">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Уншиж байна...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Алдаа">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Алдаа гарлаа</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={productTypeTitle}>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title={productTypeTitle}
          description={`${data.name_mn || 'Бүтээгдэхүүн'} · ID: ${productId}`}
          action={
            <div className="flex gap-2">
              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
              >
                {isDeleting ? '🗑️ Устгаж байна...' : '🗑️ Устгах'}
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
              >
                {isSaving ? ' Хадгалж байна...' : 'Бүгдийг хадгалах'}
              </button>
            </div>
          }
        />

        <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50 shadow-sm">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Live Preview
              </span>
            </div>
            
            <div className="flex bg-slate-200/80 p-1 rounded-lg">
               <button 
                 onClick={() => setPreviewLang('mn')}
                 className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                   previewLang === 'mn' 
                     ? 'bg-white text-teal-700 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 MN
               </button>
               <button 
                 onClick={() => setPreviewLang('en')}
                 className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                   previewLang === 'en' 
                     ? 'bg-white text-teal-700 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 EN
               </button>
            </div>
          </div>
          
          <div className="bg-white">
            <ProductPage 
              data={{
                ...data,
                category_mn: [getCategoryLabel(data.product_type, 'mn'), getProductTypeLabel(data.product_type, 'mn')].filter(Boolean).join(' · ') || data.category_mn,
                category_en: [getCategoryLabel(data.product_type, 'en'), getProductTypeLabel(data.product_type, 'en')].filter(Boolean).join(' · ') || data.category_en,
                stats: previewStats,
                details: previewDetails,
                materials: data.documents.map(doc => ({ 
                  id: doc.id.toString(), 
                  mn: doc.label_mn, 
                  en: doc.label_en 
                })),
                collateral: data.collaterals.map(coll => ({ 
                  id: coll.id.toString(), 
                  mn: coll.label_mn, 
                  en: coll.label_en 
                })),
                conditions: data.conditions.map(cond => ({ 
                  id: cond.id.toString(), 
                  mn: cond.label_mn, 
                  en: cond.label_en 
                })),
                name_style: { color: '#0f172a', fontSize: { mobile: 24, desktop: 32 }, fontWeight: 'bold', align: 'center' },
                category_style: { color: '#64748b', fontSize: { mobile: 12, desktop: 14 }, fontWeight: 'normal', align: 'center' },
                description_style: { color: '#334155', fontSize: { mobile: 14, desktop: 16 }, fontWeight: 'normal', align: 'center' },
                bannerImage: data.details.bannerImage,
                bannerMobileImage: data.details.bannerMobileImage,
                descriptionMn: data.details.descriptionMn,
                descriptionEn: data.details.descriptionEn,
                descriptionColor: data.details.descriptionColor,
                descriptionFontSize: data.details.descriptionFontSize,
                descriptionAlign: data.details.descriptionAlign,
                statsLabelStyle: { color: '#64748b', fontSize: { mobile: 10, desktop: 11 }, fontWeight: 'normal', align: 'center' },
                statsValueStyle: { color: '#0048BA', fontSize: { mobile: 14, desktop: 16 }, fontWeight: 'bold', align: 'center' },
                detailsSectionTitle_mn: 'Бүтээгдэхүүний үндсэн нөхцөл',
                detailsSectionTitle_en: 'Product conditions',
                detailsSectionTitleStyle: { color: '#64748b', fontSize: { mobile: 11, desktop: 12 }, fontWeight: 'normal', align: 'left' },
                detailsSubtitle_mn: data.name_mn,
                detailsSubtitle_en: data.name_en,
                detailsSubtitleStyle: { color: '#0f172a', fontSize: { mobile: 20, desktop: 24 }, fontWeight: 'bold', align: 'left' },
                metricsLabelStyle: { color: '#64748b', fontSize: { mobile: 11, desktop: 11 }, fontWeight: 'normal', align: 'left' },
                metricsValueStyle: { color: '#0f172a', fontSize: { mobile: 14, desktop: 16 }, fontWeight: 'bold', align: 'left' },
                materialsTitle_mn: 'Шаардагдах материал',
                materialsTitle_en: 'Required Documents',
                materialsTitleStyle: { color: '#0f172a', fontSize: { mobile: 14, desktop: 14 }, fontWeight: 'bold', align: 'left' },
                materialsTextStyle: { color: '#334155', fontSize: { mobile: 12, desktop: 12 }, fontWeight: 'normal', align: 'left' },
                materialsIconColor: '#0048BA',
                collateralTitle_mn: 'Барьцаа хөрөнгө',
                collateralTitle_en: 'Collateral',
                collateralTitleStyle: { color: '#0f172a', fontSize: { mobile: 14, desktop: 14 }, fontWeight: 'bold', align: 'left' },
                collateralTextStyle: { color: '#334155', fontSize: { mobile: 12, desktop: 12 }, fontWeight: 'normal', align: 'left' },
                collateralIconColor: '#0048BA',
                conditionsTitle_mn: 'Нөхцөл',
                conditionsTitle_en: 'Conditions',
                conditionsTitleStyle: { color: '#0f172a', fontSize: { mobile: 14, desktop: 14 }, fontWeight: 'bold', align: 'left' },
                conditionsTextStyle: { color: '#334155', fontSize: { mobile: 12, desktop: 12 }, fontWeight: 'normal', align: 'left' },
                conditionsIconColor: '#f97316',
                blocks: [],
                // Calculator styling
                calcBtnColor: data.details.calcBtnColor,
                calcBtnFontSize: data.details.calcBtnFontSize,
                calcBtnText: data.details.calcBtnText,
                requestBtnColor: data.details.requestBtnColor,
                requestBtnFontSize: data.details.requestBtnFontSize,
                requestBtnText: data.details.requestBtnText,
                requestBtnUrl: data.details.requestBtnUrl,
                disclaimerColor: data.details.disclaimerColor,
                disclaimerFontSize: data.details.disclaimerFontSize,
                disclaimerText: data.details.disclaimerText,
                // Product details for calculator
                maxAmount: parseFloat(data.details.amount) || 100000000,
                minRate: parseFloat(data.details.min_interest_rate) || 0.5,
                maxRate: parseFloat(data.details.max_interest_rate) || 5.0,
                maxTerm: parseInt(data.details.term_months) || 60,
                downPaymentPercent: data.details.feeType === 'down_payment' ? (parseFloat(data.details.fee_percent) || 0) : 0,
                feeType: data.details.feeType || 'fee',
              }} 
              forceLang={previewLang} 
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Үндсэн мэдээлэл / Basic Information
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <Select
                  label="Бүтээгдэхүүний төрөл / Product Type"
                  value={data.product_type}
                  onChange={(e) => updateData((prev) => ({ ...prev, product_type: parseInt(e.target.value) }))}
                  required
                >
                  {categories.map(category => {
                    const categoryProductTypes = productTypes.filter(pt => pt.category === category.id)
                    if (categoryProductTypes.length === 0) return null
                    return (
                      <optgroup key={category.id} label={`${getTranslation(category.translations, 2)} / ${getTranslation(category.translations, 1)}`}>
                        {categoryProductTypes.map(productType => (
                          <option key={productType.id} value={productType.id}>
                            {getTranslation(productType.translations, 2)} / {getTranslation(productType.translations, 1)}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Input
                  label="Нэр (MN)"
                  value={data.name_mn}
                  onChange={(e) => updateData((prev) => ({ ...prev, name_mn: e.target.value }))}
                  placeholder="Бүтээгдэхүүний нэр монгол хэлээр..."
                />
                <Input
                  label="Name (EN)"
                  value={data.name_en}
                  onChange={(e) => updateData((prev) => ({ ...prev, name_en: e.target.value }))}
                  placeholder="Product name in English..."
                />
              </div>

              {/* <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Input
                  label="Ангилал (MN)"
                  value={data.category_mn}
                  onChange={(e) => updateData((prev) => ({ ...prev, category_mn: e.target.value }))}
                  placeholder="Жишээ: Бизнес · Санхүүжилт"
                />
                <Input
                  label="Category (EN)"
                  value={data.category_en}
                  onChange={(e) => updateData((prev) => ({ ...prev, category_en: e.target.value }))}
                  placeholder="Example: Business · Financing"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Textarea
                  label="Тайлбар (MN)"
                  value={data.description_mn}
                  onChange={(e) => updateData((prev) => ({ ...prev, description_mn: e.target.value }))}
                  rows={3}
                  placeholder="Дэлгэрэнгүй тайлбар..."
                />
                <Textarea
                  label="Description (EN)"
                  value={data.description_en}
                  onChange={(e) => updateData((prev) => ({ ...prev, description_en: e.target.value }))}
                  rows={3}
                  placeholder="Detailed description..."
                />
              </div> */}
            </div>
          </div>
          
          {/* ══════ Баннер ══════ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <span>🖼️</span>
              Баннер / Banner
            </h3>
            <div className="space-y-4">
              {/* Desktop Banner */}
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Баннер зураг (Desktop)</label>
                {data.details.bannerImage && (
                  <div className="relative mb-3 rounded-lg overflow-hidden border border-gray-200">
                    <img src={data.details.bannerImage} alt="Banner" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => updateData(prev => ({ ...prev, details: { ...prev.details, bannerImage: '' } }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >×</button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-sky-300 rounded-lg cursor-pointer hover:bg-sky-100 transition-colors">
                  {uploadingBanner ? (
                    <span className="text-sm text-gray-500">Хадгалж байна...</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-sm text-gray-600">Зураг сонгох</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleBannerUpload(file, 'bannerImage')
                    }}
                  />
                </label>
              </div>

              {/* Mobile Banner */}
              <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Баннер зураг (Mobile)</label>
                {data.details.bannerMobileImage && (
                  <div className="relative mb-3 rounded-lg overflow-hidden border border-gray-200">
                    <img src={data.details.bannerMobileImage} alt="Mobile Banner" className="w-full h-32 object-cover" />
                    <button
                      onClick={() => updateData(prev => ({ ...prev, details: { ...prev.details, bannerMobileImage: '' } }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >×</button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-violet-300 rounded-lg cursor-pointer hover:bg-violet-100 transition-colors">
                  {uploadingMobileBanner ? (
                    <span className="text-sm text-gray-500">Хадгалж байна...</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      <span className="text-sm text-gray-600">Мобайл зураг сонгох</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleBannerUpload(file, 'bannerMobileImage')
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ══════ Тайлбар / Description ══════ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <span>✍️</span>
              Тайлбар / Description
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Textarea
                  label="Тайлбар (MN)"
                  value={data.details.descriptionMn}
                  onChange={(e) => updateData(prev => ({ ...prev, details: { ...prev.details, descriptionMn: e.target.value } }))}
                  rows={3}
                  placeholder="Бүтээгдэхүүний тайлбар монголоор..."
                />
                <Textarea
                  label="Description (EN)"
                  value={data.details.descriptionEn}
                  onChange={(e) => updateData(prev => ({ ...prev, details: { ...prev.details, descriptionEn: e.target.value } }))}
                  rows={3}
                  placeholder="Product description in English..."
                />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {/* Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Өнгө</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={data.details.descriptionColor}
                      onChange={(e) => updateData(prev => ({ ...prev, details: { ...prev.details, descriptionColor: e.target.value } }))}
                      className="w-9 h-9 rounded border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={data.details.descriptionColor}
                      onChange={(e) => updateData(prev => ({ ...prev, details: { ...prev.details, descriptionColor: e.target.value } }))}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                {/* Font Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Фонт хэмжээ</label>
                  <select
                    value={data.details.descriptionFontSize}
                    onChange={(e) => updateData(prev => ({ ...prev, details: { ...prev.details, descriptionFontSize: e.target.value } }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                  </select>
                </div>
                {/* Font Family */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Фонт</label>
                  <select
                    value={data.details.descriptionFontFamily}
                    onChange={(e) => updateData(prev => ({ ...prev, details: { ...prev.details, descriptionFontFamily: e.target.value } }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Default</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                    <option value="Courier New, monospace">Courier New</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="Open Sans, sans-serif">Open Sans</option>
                    <option value="Inter, sans-serif">Inter</option>
                  </select>
                </div>
                {/* Align */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Тэгшилэлт</label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right', 'justify'] as const).map(align => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => updateData(prev => ({ ...prev, details: { ...prev.details, descriptionAlign: align } }))}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          data.details.descriptionAlign === align
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {align === 'left' ? '←' : align === 'center' ? '↔' : align === 'right' ? '→' : '≡'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div className="p-4 bg-slate-800 rounded-xl">
                <p className="text-[10px] text-gray-400 mb-2">Урьдчилан харах:</p>
                <p style={{
                  color: data.details.descriptionColor,
                  fontSize: data.details.descriptionFontSize,
                  textAlign: data.details.descriptionAlign as any,
                  fontFamily: data.details.descriptionFontFamily || 'inherit',
                }}>
                  {data.details.descriptionMn || 'Тайлбар текст энд харагдана'}
                </p>
              </div>
            </div>
          </div>




<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <span>📊</span>
              Дэлгэрэнгүй мэдээлэл / Product Details
            </h3>

            <div className="space-y-4">
              {/* Amount */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дүн / Amount
                </label>
                <Input
                  value={data.details.amount}
                  onChange={(e) => updateData((prev) => ({
                    ...prev,
                    details: { ...prev.details, amount: e.target.value }
                  }))}
                  placeholder="0"
                  type="number"
                />
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Төрөл / Type
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="feeType"
                        value="fee"
                        checked={data.details.feeType === 'fee'}
                        onChange={() => updateData((prev) => ({
                          ...prev,
                          details: { ...prev.details, feeType: 'fee' }
                        }))}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Шимтгэл /%/</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="feeType"
                        value="down_payment"
                        checked={data.details.feeType === 'down_payment'}
                        onChange={() => updateData((prev) => ({
                          ...prev,
                          details: { ...prev.details, feeType: 'down_payment' }
                        }))}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Урьдчилгаа төлбөр /%/</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {data.details.feeType === 'down_payment' ? 'Урьдчилгаа төлбөр %' : 'Шимтгэл %'} / Percent
                  </label>
                  <Input
                    value={data.details.fee_percent}
                    onChange={(e) => updateData((prev) => ({
                      ...prev,
                      details: { ...prev.details, fee_percent: e.target.value }
                    }))}
                    placeholder="0"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Хүү хамгийн бага % / Min Interest %
                  </label>
                  <Input
                    value={data.details.min_interest_rate}
                    onChange={(e) => updateData((prev) => ({
                      ...prev,
                      details: { ...prev.details, min_interest_rate: e.target.value }
                    }))}
                    placeholder="0"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Хүү хамгийн их % / Max Interest %
                  </label>
                  <Input
                    value={data.details.max_interest_rate}
                    onChange={(e) => updateData((prev) => ({
                      ...prev,
                      details: { ...prev.details, max_interest_rate: e.target.value }
                    }))}
                    placeholder="0"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Хугацаа (сар) / Term (months)
                </label>
                <Input
                  value={data.details.term_months}
                  onChange={(e) => updateData((prev) => ({
                    ...prev,
                    details: { ...prev.details, term_months: e.target.value }
                  }))}
                  placeholder="0"
                  type="number"
                />
              </div>

              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Шийдвэрлэх хугацаа (минут) / Processing Time (minutes)
                </label>
                <Input
                  value={data.details.processing_time_minutes}
                  onChange={(e) => updateData((prev) => ({
                    ...prev,
                    details: { ...prev.details, processing_time_minutes: e.target.value }
                  }))}
                  placeholder="0"
                  type="number"
                />
              </div>
            </div>
          </div>

          <DocumentSelector
            title="Шаардагдах материал / Required Documents"
            selectedDocuments={data.documents}
            availableDocuments={availableDocuments}
            onAdd={handleAddDocument}
            onRemove={handleRemoveDocument}
            loading={loadingAvailable}
          />

          <DocumentSelector
            title="Барьцаа хөрөнгө / Collateral"
            selectedDocuments={data.collaterals}
            availableDocuments={availableCollaterals}
            onAdd={handleAddCollateral}
            onRemove={handleRemoveCollateral}
            loading={loadingAvailable}
          />

          <DocumentSelector
            title=" Нөхцөл / Conditions"
            selectedDocuments={data.conditions}
            availableDocuments={availableConditions}
            onAdd={handleAddCondition}
            onRemove={handleRemoveCondition}
            loading={loadingAvailable}
          />

          {/* Calculator Styling */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <span>🔢</span>
              Тооцоолуур тохиргоо / Calculator Settings
            </h3>
            <div className="space-y-5">
              {/* Тооцоолох товч */}
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Тооцоолох товч</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Текст</label>
                    <Input
                      value={data.details.calcBtnText}
                      onChange={(e) => updateData((prev) => ({
                        ...prev,
                        details: { ...prev.details, calcBtnText: e.target.value }
                      }))}
                      placeholder="Тооцоолох"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Өнгө</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={data.details.calcBtnColor}
                        onChange={(e) => updateData((prev) => ({
                          ...prev,
                          details: { ...prev.details, calcBtnColor: e.target.value }
                        }))}
                        className="w-9 h-9 rounded border border-gray-200 cursor-pointer"
                      />
                      <Input
                        value={data.details.calcBtnColor}
                        onChange={(e) => updateData((prev) => ({
                          ...prev,
                          details: { ...prev.details, calcBtnColor: e.target.value }
                        }))}
                        placeholder="#0048BA"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Фонт хэмжээ</label>
                    <select
                      value={data.details.calcBtnFontSize}
                      onChange={(e) => updateData((prev) => ({
                        ...prev,
                        details: { ...prev.details, calcBtnFontSize: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option value="12px">12px</option>
                      <option value="14px">14px</option>
                      <option value="16px">16px</option>
                      <option value="18px">18px</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] text-gray-400 mb-1">Урьдчилан харах:</p>
                  <button
                    type="button"
                    style={{ backgroundColor: data.details.calcBtnColor, fontSize: data.details.calcBtnFontSize }}
                    className="w-full rounded-lg px-4 py-2.5 font-medium text-white"
                  >
                    {data.details.calcBtnText}
                  </button>
                </div>
              </div>

              {/* Хүсэлт илгээх товч */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Хүсэлт илгээх товч</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Текст</label>
                    <Input
                      value={data.details.requestBtnText}
                      onChange={(e) => updateData((prev) => ({
                        ...prev,
                        details: { ...prev.details, requestBtnText: e.target.value }
                      }))}
                      placeholder="Хүсэлт илгээх"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Өнгө</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={data.details.requestBtnColor}
                        onChange={(e) => updateData((prev) => ({
                          ...prev,
                          details: { ...prev.details, requestBtnColor: e.target.value }
                        }))}
                        className="w-9 h-9 rounded border border-gray-200 cursor-pointer"
                      />
                      <Input
                        value={data.details.requestBtnColor}
                        onChange={(e) => updateData((prev) => ({
                          ...prev,
                          details: { ...prev.details, requestBtnColor: e.target.value }
                        }))}
                        placeholder="#2563eb"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Фонт хэмжээ</label>
                    <select
                      value={data.details.requestBtnFontSize}
                      onChange={(e) => updateData((prev) => ({
                        ...prev,
                        details: { ...prev.details, requestBtnFontSize: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="12px">12px</option>
                      <option value="14px">14px</option>
                      <option value="16px">16px</option>
                      <option value="18px">18px</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL (линк)</label>
                  <Input
                    value={data.details.requestBtnUrl}
                    onChange={(e) => updateData((prev) => ({
                      ...prev,
                      details: { ...prev.details, requestBtnUrl: e.target.value }
                    }))}
                    placeholder="https://example.com/apply"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-[10px] text-gray-400 mb-1">Урьдчилан харах:</p>
                  <button
                    type="button"
                    style={{ backgroundColor: data.details.requestBtnColor, fontSize: data.details.requestBtnFontSize }}
                    className="w-full rounded-lg px-4 py-2.5 font-medium text-white"
                  >
                    {data.details.requestBtnText}
                  </button>
                </div>
              </div>

              {/* Анхааруулга */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Анхааруулга</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Текст</label>
                    <Textarea
                      value={data.details.disclaimerText}
                      onChange={(e) => updateData((prev) => ({
                        ...prev,
                        details: { ...prev.details, disclaimerText: e.target.value }
                      }))}
                      rows={2}
                      placeholder="Анхааруулга текст..."
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Өнгө</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={data.details.disclaimerColor}
                          onChange={(e) => updateData((prev) => ({
                            ...prev,
                            details: { ...prev.details, disclaimerColor: e.target.value }
                          }))}
                          className="w-9 h-9 rounded border border-gray-200 cursor-pointer"
                        />
                        <Input
                          value={data.details.disclaimerColor}
                          onChange={(e) => updateData((prev) => ({
                            ...prev,
                            details: { ...prev.details, disclaimerColor: e.target.value }
                          }))}
                          placeholder="#92400e"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Фонт хэмжээ</label>
                      <select
                        value={data.details.disclaimerFontSize}
                        onChange={(e) => updateData((prev) => ({
                          ...prev,
                          details: { ...prev.details, disclaimerFontSize: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="9px">9px</option>
                        <option value="10px">10px</option>
                        <option value="11px">11px</option>
                        <option value="12px">12px</option>
                        <option value="14px">14px</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Урьдчилан харах:</p>
                    <div
                      className="rounded-lg border border-amber-200 bg-amber-50 p-2.5"
                      style={{ color: data.details.disclaimerColor, fontSize: data.details.disclaimerFontSize }}
                    >
                      <p className="font-medium mb-0.5">Анхааруулга</p>
                      <p>{data.details.disclaimerText}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}