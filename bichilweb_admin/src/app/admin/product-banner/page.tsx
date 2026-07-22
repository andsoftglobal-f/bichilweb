'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { PageHeader } from '@/components/FormElements'
import { axiosInstance } from '@/lib/axios'
import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

interface Translation {
  id: number
  language: number
  label: string
}

interface ProductDetail {
  id: number
  banner_image?: string
  banner_mobile_image?: string
}

interface Product {
  id: number
  product_type: number
  translations: Translation[]
  details: ProductDetail[]
}

const getTranslation = (translations: Translation[], languageId: number): string => {
  const t = translations.find(tr => tr.language === languageId)
  return t?.label || ''
}

export default function ProductBannerPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [showSafeZone, setShowSafeZone] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<number | null>(null)

  // Frontend dimensions (from ProductContent.tsx):
  // Desktop: h-[600px], header -mt-24 (96px overlap), full width
  // Mobile: h-[420px], header -mt-20 (80px overlap)
  const DESKTOP_H = 600
  const MOBILE_H = 420
  const HEADER_DESKTOP = 96 // -mt-24 = 96px
  const HEADER_MOBILE = 80  // -mt-20 = 80px

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get('/product/')
      const raw = res.data
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      setProducts(list)
      // Auto-select first product with banner for preview
      const first = list.find((p: Product) => p.details?.[0]?.banner_image)
      if (first && !previewProduct) setPreviewProduct(first.id)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (productId: number, file: File, field: 'banner_image' | 'banner_mobile_image') => {
    const key = `${productId}_${field}`
    setUploading(prev => ({ ...prev, [key]: true }))
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await axiosInstance.post('/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = res.data.url || res.data.file_url

      // Update local state
      setProducts(prev => prev.map(p => {
        if (p.id !== productId) return p
        const detail = p.details?.[0] || {} as ProductDetail
        return {
          ...p,
          details: [{ ...detail, [field]: url }]
        }
      }))
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Зураг хадгалахад алдаа гарлаа')
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleRemove = (productId: number, field: 'banner_image' | 'banner_mobile_image') => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p
      const detail = p.details?.[0] || {} as ProductDetail
      return {
        ...p,
        details: [{ ...detail, [field]: '' }]
      }
    }))
  }

  const handleSave = async (product: Product) => {
    setSaving(prev => ({ ...prev, [product.id]: true }))
    try {
      const detail = product.details?.[0] || {} as ProductDetail

      // We need to PUT the entire product. Build the payload from current data.
      const payload: any = {
        product_type: product.product_type,
        translations: product.translations.map(t => ({
          language: t.language,
          label: t.label,
        })),
        details: {
          amount: (detail as any).amount || 0,
          min_fee_percent: (detail as any).min_fee_percent || 0,
          max_fee_percent: (detail as any).max_fee_percent || 0,
          min_interest_rate: (detail as any).min_interest_rate || 0,
          max_interest_rate: (detail as any).max_interest_rate || 0,
          term_months: (detail as any).term_months || 0,
          min_processing_hours: (detail as any).min_processing_hours || 0,
          max_processing_hoyrs: (detail as any).max_processing_hoyrs || 0,
          processing_time_minutes: (detail as any).processing_time_minutes || 0,
          fee_type: (detail as any).fee_type || 'fee',
          calc_btn_color: (detail as any).calc_btn_color || '#0048BA',
          calc_btn_font_size: (detail as any).calc_btn_font_size || '14px',
          calc_btn_text: (detail as any).calc_btn_text || '',
          request_btn_color: (detail as any).request_btn_color || '#2563eb',
          request_btn_font_size: (detail as any).request_btn_font_size || '14px',
          request_btn_text: (detail as any).request_btn_text || '',
          request_btn_url: (detail as any).request_btn_url || '',
          disclaimer_color: (detail as any).disclaimer_color || '#92400e',
          disclaimer_font_size: (detail as any).disclaimer_font_size || '10px',
          disclaimer_text: (detail as any).disclaimer_text || '',
          banner_image: detail.banner_image || '',
          banner_mobile_image: detail.banner_mobile_image || '',
          description_mn: (detail as any).description_mn || '',
          description_en: (detail as any).description_en || '',
          description_color: (detail as any).description_color || '#ffffff',
          description_font_size: (detail as any).description_font_size || '16px',
          description_align: (detail as any).description_align || 'center',
        },
        documents: (product as any).documents?.map((d: any) => ({ document: d.document?.id || d.id })) || [],
        collaterals: (product as any).collaterals?.map((c: any) => ({ collateral: c.collateral?.id || c.id })) || [],
        conditions: (product as any).conditions?.map((c: any) => ({ condition: c.condition?.id || c.id })) || [],
      }

      await axiosInstance.put(`/product/${product.id}/`, payload)
      alert('✅ Баннер амжилттай хадгалагдлаа!')
    } catch (err: any) {
      console.error('Save failed:', err)
      alert(`Алдаа: ${err.response?.data?.detail || err.message}`)
    } finally {
      setSaving(prev => ({ ...prev, [product.id]: false }))
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Бүтээгдэхүүн баннер">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Уншиж байна...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Бүтээгдэхүүн баннер">
      <div>
        <PageHeader
          title="Бүтээгдэхүүн баннер"
          description="Бүтээгдэхүүн тус бүрийн баннер зургийг удирдах"
        />
      </div>

        {products.length === 0 ? (
          <div className="max-w-5xl mx-auto text-center py-16 text-gray-400">
            <p className="text-lg">Бүтээгдэхүүн олдсонгүй</p>
          </div>
        ) : (<>
          {/* ══════════ PREVIEW — full-width ══════════ */}
          {products.some(p => p.details?.[0]?.banner_image) && (
            <div className="-mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 mt-6 mb-6 overflow-hidden border-y border-slate-200">
              {/* Toolbar */}
              <div className="px-4 py-2.5 border-b flex items-center justify-between bg-white">
                <span className="text-xs font-semibold text-slate-600">PREVIEW</span>
                <div className="flex items-center gap-2">
                  {/* Product selector */}
                  <select
                    value={previewProduct ?? ''}
                    onChange={(e) => setPreviewProduct(e.target.value ? Number(e.target.value) : null)}
                    className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600 focus:outline-none focus:border-blue-400"
                  >
                    {products.filter(p => p.details?.[0]?.banner_image).map(p => (
                      <option key={p.id} value={p.id}>
                        {getTranslation(p.translations, 2) || getTranslation(p.translations, 1)}
                      </option>
                    ))}
                  </select>
                  <div className="w-px h-5 bg-slate-200" />
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

              {/* Preview content — яг frontend-тэй адилхан */}
              <div className={`bg-slate-100 ${previewDevice === 'mobile' ? 'flex justify-center py-6' : ''}`}>
                {(() => {
                  const pp = previewProduct
                    ? products.find(p => p.id === previewProduct)
                    : products.find(p => p.details?.[0]?.banner_image)
                  if (!pp) return null
                  const det = pp.details?.[0] || {} as ProductDetail
                  const bannerSrc = previewDevice === 'mobile' && det.banner_mobile_image
                    ? det.banner_mobile_image
                    : det.banner_image
                  const bannerH = previewDevice === 'desktop' ? DESKTOP_H : MOBILE_H
                  const headerH = previewDevice === 'desktop' ? HEADER_DESKTOP : HEADER_MOBILE

                  if (!bannerSrc) return (
                    <div className="text-center py-16 text-slate-400 text-sm">
                      {previewDevice === 'mobile' ? 'Мобайл баннер зураг байхгүй' : 'Desktop баннер зураг байхгүй'}
                    </div>
                  )

                  /* ── Яг frontend-тэй ижил render ── */
                  const bannerContent = (
                    <div className="relative overflow-hidden" style={{ width: '100%' }}>
                      {/* Floating Header — яг frontend Header.tsx-тэй адилхан */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40" style={{ width: 'calc(100% - 32px)', maxWidth: '1240px' }}>
                        <div className="w-full rounded-2xl bg-white/70 backdrop-blur-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-white/40">
                          <div className="px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between" style={{ height: '64px' }}>
                              <div className="flex items-center gap-2">
                                <div className={`${previewDevice === 'desktop' ? 'w-8 h-8' : 'w-6 h-6'} rounded-lg bg-blue-600 flex items-center justify-center`}>
                                  <span className={`text-white font-bold ${previewDevice === 'desktop' ? 'text-xs' : 'text-[8px]'}`}>G</span>
                                </div>
                                <span className={`font-semibold text-slate-800 ${previewDevice === 'desktop' ? 'text-sm' : 'text-xs'}`}>Globus</span>
                              </div>
                              {previewDevice === 'desktop' ? (
                                <div className="flex gap-4">
                                  <div className="w-16 h-2 rounded bg-slate-300/50" />
                                  <div className="w-16 h-2 rounded bg-slate-300/50" />
                                  <div className="w-16 h-2 rounded bg-slate-300/50" />
                                  <div className="w-16 h-2 rounded bg-slate-300/50" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded bg-slate-200/50 flex items-center justify-center">
                                  <div className="space-y-0.5">
                                    <div className="w-3 h-px bg-slate-400" />
                                    <div className="w-3 h-px bg-slate-400" />
                                    <div className="w-3 h-px bg-slate-400" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Banner — яг frontend: h-[420px] md:h-[600px] -mt-20 lg:-mt-24 */}
                      <div className="relative w-full overflow-hidden" style={{ height: `${bannerH}px` }}>
                        <img
                          src={bannerSrc}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                        {/* Gradient overlay — яг frontend-тэй адилхан */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-50/80" />
                      </div>

                      {/* Safe Zone Overlay */}
                      {showSafeZone && (
                        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                          {/* Header danger zone */}
                          <div
                            className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-500"
                            style={{
                              height: `${(headerH / bannerH) * 100}%`,
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
                            style={{ top: `calc(${(headerH / bannerH) * 100}% + 6px)` }}
                          >
                            ✓ АЮУЛГҮЙ БҮС ({bannerH - headerH}px)
                          </div>
                          {/* Dimension badge */}
                          <div className="absolute top-1.5 right-10 z-50 text-[9px] font-bold text-slate-700 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm border border-slate-200">
                            📐 {previewDevice === 'desktop' ? '1920 × 600px (3.2:1)' : '750 × 840px (25:28)'}
                          </div>
                          {/* px ruler */}
                          <div className="absolute top-0 right-2 h-full flex flex-col items-center" style={{ width: '30px' }}>
                            <div className="flex flex-col items-center" style={{ height: `${(headerH / bannerH) * 100}%` }}>
                              <div className="w-px bg-red-400 flex-1" />
                              <div className="text-[8px] font-bold text-red-700 bg-red-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
                                {headerH}px
                              </div>
                              <div className="w-px bg-red-400 flex-1" />
                            </div>
                            <div className="flex flex-col items-center flex-1">
                              <div className="w-px bg-emerald-400 flex-1" />
                              <div className="text-[8px] font-bold text-emerald-700 bg-emerald-50/95 px-1 py-px rounded shadow-sm whitespace-nowrap my-px">
                                {bannerH - headerH}px
                              </div>
                              <div className="w-px bg-emerald-400 flex-1" />
                            </div>
                          </div>
                          {/* Center guides */}
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400/15" />
                          <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-400/15" />
                        </div>
                      )}
                    </div>
                  )

                  if (previewDevice === 'mobile') {
                    return (
                      <div className="relative rounded-[2.5rem] border-[6px] border-slate-800 bg-slate-800 shadow-2xl overflow-hidden" style={{ width: '375px' }}>
                        {/* Phone notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-2xl z-50" />
                        {bannerContent}
                      </div>
                    )
                  }

                  return bannerContent
                })()}
              </div>

              {/* ── Зөвлөмж хэмжээ ── */}
              <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ComputerDesktopIcon className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[11px] text-slate-600">
                      Desktop: <span className="font-bold text-slate-800">1920 × 600px</span>
                      <span className="text-slate-400 ml-1">(3.2 : 1)</span>
                    </span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <DevicePhoneMobileIcon className="h-3.5 w-3.5 text-teal-500" />
                    <span className="text-[11px] text-slate-600">
                      Mobile: <span className="font-bold text-slate-800">750 × 840px</span>
                      <span className="text-slate-400 ml-1">(25 : 28)</span>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Яг энэ хэмжээгээр оруулбал crop-гүй яг таарна</span>
              </div>
            </div>
          )}

          <div className="max-w-5xl mx-auto space-y-6 mt-6">
            {products.map(product => {
              const detail = product.details?.[0] || {} as ProductDetail
              const nameMn = getTranslation(product.translations, 2)
              const nameEn = getTranslation(product.translations, 1)

              return (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{nameMn || nameEn}</h3>
                      {nameEn && nameMn && (
                        <p className="text-xs text-gray-500 mt-0.5">{nameEn}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSave(product)}
                      disabled={saving[product.id]}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {saving[product.id] ? 'Хадгалж байна...' : '💾 Хадгалах'}
                    </button>
                  </div>

                  {/* Banner images */}
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Desktop Banner */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🖥️ Desktop баннер
                          <span className="ml-1.5 text-[10px] font-normal text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">1920 × 600px (3.2:1)</span>
                        </label>
                        {detail.banner_image ? (
                          <div className="relative rounded-lg overflow-hidden border border-gray-200 mb-2">
                            <img src={detail.banner_image} alt="Desktop Banner" className="w-full h-40 object-cover" />
                            {/* Safe Zone overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                              <div
                                className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-400"
                                style={{
                                  height: `${(HEADER_DESKTOP / DESKTOP_H) * 100}%`,
                                  backgroundColor: 'rgba(239,68,68,0.15)',
                                }}
                              >
                                <span className="absolute bottom-0.5 left-1 text-[8px] font-bold text-red-600 bg-red-50/90 px-1 rounded">
                                  Header бүс
                                </span>
                              </div>
                              <div
                                className="absolute left-0 right-0 bottom-0 border-t border-dashed border-emerald-400"
                                style={{
                                  top: `${(HEADER_DESKTOP / DESKTOP_H) * 100}%`,
                                }}
                              >
                                <span className="absolute top-0.5 left-1 text-[8px] font-bold text-emerald-600 bg-emerald-50/90 px-1 rounded">
                                  ✓ Аюулгүй бүс
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemove(product.id, 'banner_image')}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 shadow-md"
                            >×</button>
                          </div>
                        ) : (
                          <div className="h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 mb-2">
                            <span className="text-sm">Зураг байхгүй</span>
                          </div>
                        )}
                        <label className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                          {uploading[`${product.id}_banner_image`] ? (
                            <span className="text-sm text-gray-500">Хадгалж байна...</span>
                          ) : (
                            <>
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-blue-600 font-medium">Зураг сонгох</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(product.id, file, 'banner_image')
                            }}
                          />
                        </label>
                      </div>

                      {/* Mobile Banner */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📱 Мобайл баннер
                          <span className="ml-1.5 text-[10px] font-normal text-teal-500 bg-teal-50 px-1.5 py-0.5 rounded">750 × 840px (25:28)</span>
                        </label>
                        {detail.banner_mobile_image ? (
                          <div className="relative rounded-lg overflow-hidden border border-gray-200 mb-2">
                            <img src={detail.banner_mobile_image} alt="Mobile Banner" className="w-full h-40 object-cover" />
                            {/* Safe Zone overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                              <div
                                className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-400"
                                style={{
                                  height: `${(HEADER_MOBILE / MOBILE_H) * 100}%`,
                                  backgroundColor: 'rgba(239,68,68,0.15)',
                                }}
                              >
                                <span className="absolute bottom-0.5 left-1 text-[8px] font-bold text-red-600 bg-red-50/90 px-1 rounded">
                                  Header бүс
                                </span>
                              </div>
                              <div
                                className="absolute left-0 right-0 bottom-0 border-t border-dashed border-emerald-400"
                                style={{
                                  top: `${(HEADER_MOBILE / MOBILE_H) * 100}%`,
                                }}
                              >
                                <span className="absolute top-0.5 left-1 text-[8px] font-bold text-emerald-600 bg-emerald-50/90 px-1 rounded">
                                  ✓ Аюулгүй бүс
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemove(product.id, 'banner_mobile_image')}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 shadow-md"
                            >×</button>
                          </div>
                        ) : (
                          <div className="h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 mb-2">
                            <span className="text-sm">Зураг байхгүй</span>
                          </div>
                        )}
                        <label className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-violet-300 rounded-lg cursor-pointer hover:bg-violet-50 transition-colors">
                          {uploading[`${product.id}_banner_mobile_image`] ? (
                            <span className="text-sm text-gray-500">Хадгалж байна...</span>
                          ) : (
                            <>
                              <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-violet-600 font-medium">Мобайл зураг сонгох</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(product.id, file, 'banner_mobile_image')
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>)}
    </AdminLayout>
  )
}
