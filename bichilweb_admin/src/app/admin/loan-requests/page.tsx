'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { PageHeader, Input, Textarea, Button } from '@/components/FormElements'
import ImageUpload from '@/components/ImageUpload'
import { axiosInstance } from '@/lib/axios'
import { ArrowTopRightOnSquareIcon, PaintBrushIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, EyeIcon } from '@heroicons/react/24/outline'

interface TextStyle {
  fontSize?: string
  color?: string
  fontWeight?: string
  fontFamily?: string
}

interface TextStyles {
  [key: string]: TextStyle
}

const FONT_OPTIONS = [
  { value: '', label: 'Системийн фонт (default)' },
  { value: 'Montserrat:700', label: 'Montserrat Bold' },
  { value: 'Montserrat:400', label: 'Montserrat Regular' },
  { value: 'Montserrat:900', label: 'Montserrat Black' },
  { value: "'Open Sans':800", label: 'Open Sans Extra Bold' },
  { value: "'Open Sans':400", label: 'Open Sans Regular' },
  { value: 'Poppins:700', label: 'Poppins Bold' },
  { value: 'Poppins:400', label: 'Poppins Regular' },
]

interface PageConfig {
  id?: number
  banner_image: string
  mobile_banner_image: string
  title_mn: string
  title_en: string
  subtitle_mn: string
  subtitle_en: string
  disclaimer_mn: string
  disclaimer_en: string
  button_text_mn: string
  button_text_en: string
  success_title_mn: string
  success_title_en: string
  success_subtitle_mn: string
  success_subtitle_en: string
  success_description_mn: string
  success_description_en: string
  form_title_mn: string
  form_title_en: string
  form_subtitle_mn: string
  form_subtitle_en: string
  text_styles: TextStyles
  active: boolean
}

const defaultPageConfig: PageConfig = {
  banner_image: '',
  mobile_banner_image: '',
  title_mn: '',
  title_en: '',
  subtitle_mn: '',
  subtitle_en: '',
  disclaimer_mn: '',
  disclaimer_en: '',
  button_text_mn: '',
  button_text_en: '',
  success_title_mn: '',
  success_title_en: '',
  success_subtitle_mn: '',
  success_subtitle_en: '',
  success_description_mn: '',
  success_description_en: '',
  form_title_mn: '',
  form_title_en: '',
  form_subtitle_mn: '',
  form_subtitle_en: '',
  text_styles: {},
  active: true,
}

export default function LoanRequestsPage() {
  const [pageConfig, setPageConfig] = useState<PageConfig>(defaultPageConfig)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageSaving, setPageSaving] = useState(false)
  const [pageLang, setPageLang] = useState<'mn' | 'en'>('mn')
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [openStyleKey, setOpenStyleKey] = useState<string | null>(null)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  const getStyle = (key: string): TextStyle => pageConfig.text_styles?.[key] || {}

  const updateStyle = (key: string, prop: keyof TextStyle, value: string) => {
    setPageConfig(prev => ({
      ...prev,
      text_styles: {
        ...prev.text_styles,
        [key]: { ...(prev.text_styles?.[key] || {}), [prop]: value }
      }
    }))
  }

  const getFontValue = (key: string): string => {
    const s = getStyle(key)
    if (!s.fontFamily) return ''
    return s.fontFamily + (s.fontWeight ? ':' + s.fontWeight : '')
  }

  const handleFontChange = (key: string, combined: string) => {
    if (!combined) {
      setPageConfig(prev => ({
        ...prev,
        text_styles: {
          ...prev.text_styles,
          [key]: { ...(prev.text_styles?.[key] || {}), fontFamily: '', fontWeight: '' }
        }
      }))
      return
    }
    const [family, weight] = combined.split(':')
    setPageConfig(prev => ({
      ...prev,
      text_styles: {
        ...prev.text_styles,
        [key]: { ...(prev.text_styles?.[key] || {}), fontFamily: family, fontWeight: weight || '' }
      }
    }))
  }

  const renderStylePanel = (key: string, defaults: { color: string; fontSize: string }) => (
    <>
      <button
        type="button"
        onClick={() => setOpenStyleKey(openStyleKey === key ? null : key)}
        className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
      >
        <PaintBrushIcon className="w-3 h-3" /> Стиль тохируулах
      </button>
      {openStyleKey === key && (
        <div className="flex flex-wrap items-center gap-3 mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500">
            Өнгө
            <input type="color" value={getStyle(key).color || defaults.color} onChange={(e) => updateStyle(key, 'color', e.target.value)} className="w-6 h-6 rounded border border-gray-200 cursor-pointer bg-transparent" />
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500">
            Хэмжээ
            <input type="number" min={10} max={72} value={parseInt(getStyle(key).fontSize || defaults.fontSize)} onChange={(e) => updateStyle(key, 'fontSize', e.target.value + 'px')} className="w-14 border border-gray-200 rounded px-1.5 py-0.5 text-[11px] text-gray-700" />
            <span className="text-gray-400">px</span>
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500">
            Фонт
            <select value={getFontValue(key)} onChange={(e) => handleFontChange(key, e.target.value)} className="border border-gray-200 rounded px-1.5 py-0.5 text-[11px] text-gray-700">
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </>
  )

  useEffect(() => {
    fetchPageConfig()
  }, [])

  const fetchPageConfig = async () => {
    try {
      setPageLoading(true)
      const res = await axiosInstance.get('/loan-request-page/')
      setPageConfig({ ...res.data, text_styles: res.data.text_styles || {} })
    } catch (err) {
      console.error('Failed to fetch page config:', err)
    } finally {
      setPageLoading(false)
    }
  }

  const savePageConfig = async () => {
    try {
      setPageSaving(true)
      await axiosInstance.post('/loan-request-page/', pageConfig)
      setPageMessage({ type: 'success', text: 'Амжилттай хадгалагдлаа' })
      setTimeout(() => setPageMessage(null), 3000)
    } catch (err) {
      console.error('Failed to save page config:', err)
      setPageMessage({ type: 'error', text: 'Хадгалахад алдаа гарлаа' })
      setTimeout(() => setPageMessage(null), 3000)
    } finally {
      setPageSaving(false)
    }
  }

  if (pageLoading) {
    return (
      <AdminLayout title="Зээлийн хүсэлт">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Уншиж байна...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Зээлийн хүсэлт">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Зээлийн хүсэлт хуудас"
          description="Хэрэглэгч хэсэгт харагдах зээлийн хүсэлт хуудсыг тохируулах"
          action={
            <a
              href="http://localhost:3000/loan-request"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              Хуудсыг харах
            </a>
          }
        />

        <div className="space-y-6">
          {pageMessage && (
            <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
              pageMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {pageMessage.text}
            </div>
          )}

          {/* Active toggle */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Хуудас идэвхтэй эсэх</h3>
                <p className="text-xs text-gray-500 mt-1">Хэрэглэгч хэсэгт зээлийн хүсэлт хуудсыг харуулах</p>
              </div>
              <button
                onClick={() => setPageConfig(prev => ({ ...prev, active: !prev.active }))}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  pageConfig.active ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  pageConfig.active ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`} />
              </button>
            </div>
          </div>

          {/* Banner images */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Баннер зураг</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUpload
                label="Баннер зураг (Desktop)"
                value={pageConfig.banner_image}
                onChange={(url) => setPageConfig(prev => ({ ...prev, banner_image: url }))}
              />
              <ImageUpload
                label="Баннер зураг (Mobile)"
                value={pageConfig.mobile_banner_image}
                onChange={(url) => setPageConfig(prev => ({ ...prev, mobile_banner_image: url }))}
              />
            </div>
          </div>

          {/* Banner Preview */}
          {(pageConfig.banner_image || pageConfig.mobile_banner_image) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeIcon className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                      previewDevice === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ComputerDesktopIcon className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                      previewDevice === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <DevicePhoneMobileIcon className="w-3.5 h-3.5" /> Mobile
                  </button>
                </div>
              </div>

              {/*
                Loan-request hero: min-h-screen flex items-center, full viewport
                Desktop (1920×1080): navbar ~96px top, content centered, form card ~440px wide
                  Banner = 100vh = 1080px, navbar covers 96px top (8.9%)
                  Content centered vertically, safe = middle ~60%
                Mobile (375×812): navbar ~80px top
                  Banner = 100vh = 812px, navbar covers 80px top (9.9%)
              */}
              <div className="flex justify-center">
                <div
                  className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900"
                  style={{
                    width: previewDevice === 'desktop' ? '100%' : '375px',
                    aspectRatio: previewDevice === 'desktop' ? '1920/1080' : '375/812',
                  }}
                >
                  {/* Banner image */}
                  {(() => {
                    const src = previewDevice === 'mobile'
                      ? (pageConfig.mobile_banner_image || pageConfig.banner_image)
                      : pageConfig.banner_image
                    return src ? (
                      <img
                        src={src}
                        alt="Banner preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : null
                  })()}

                  {/* Dark overlay like frontend */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />

                  {/* Navbar overlay zone (top) */}
                  <div
                    className="absolute top-0 left-0 right-0 bg-gray-900/70 backdrop-blur-[1px] border-b border-dashed border-red-400/50 z-20"
                    style={{ height: previewDevice === 'desktop' ? '8.9%' : '9.9%' }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-semibold text-red-300/80 bg-black/40 px-2 py-0.5 rounded-full">
                        Navbar — {previewDevice === 'desktop' ? '96px' : '80px'}
                      </span>
                    </div>
                    <div className="absolute right-1.5 bottom-1">
                      <span className="text-[8px] font-mono text-red-300/60">
                        {previewDevice === 'desktop' ? '1920 × 96' : '375 × 80'}
                      </span>
                    </div>
                  </div>

                  {/* SAFE ZONE — visible content area */}
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{
                      top: previewDevice === 'desktop' ? '8.9%' : '9.9%',
                      bottom: '0%',
                    }}
                  >
                    <div className="absolute inset-0 border-2 border-emerald-400/70" />

                    {/* Safe zone label */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-400/40 whitespace-nowrap">
                        ✓ Safe Zone — {previewDevice === 'desktop' ? '1920 × 984px' : '375 × 732px'}
                      </span>
                    </div>

                    {/* px labels */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                      <span className="text-[8px] font-mono text-emerald-300 bg-black/50 px-1 py-0.5 rounded-r">
                        {previewDevice === 'desktop' ? 'px-12 (48px)' : 'px-5 (20px)'}
                      </span>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <span className="text-[8px] font-mono text-emerald-300 bg-black/50 px-1 py-0.5 rounded-l">
                        {previewDevice === 'desktop' ? 'px-12 (48px)' : 'px-5 (20px)'}
                      </span>
                    </div>
                  </div>

                  {/* Content preview — centered form card */}
                  <div
                    className="absolute inset-0 z-30 flex items-center justify-center"
                    style={{
                      paddingTop: previewDevice === 'desktop' ? '8.9%' : '9.9%',
                    }}
                  >
                    <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg" style={{
                      width: previewDevice === 'desktop' ? '24%' : '85%',
                      padding: previewDevice === 'desktop' ? '12px' : '10px',
                    }}>
                      <div className="mb-2">
                        <h3 className="font-bold text-gray-900" style={{
                          fontSize: previewDevice === 'desktop' ? '10px' : '9px',
                          ...(() => {
                            const s = getStyle('form_title')
                            return { color: s.color, fontFamily: s.fontFamily || undefined, fontWeight: s.fontWeight || '700' }
                          })()
                        }}>
                          {pageLang === 'mn' ? pageConfig.form_title_mn || 'Мэдээллээ бөглөнө үү' : pageConfig.form_title_en || 'Fill in your details'}
                        </h3>
                        <p className="text-gray-400" style={{
                          fontSize: '7px',
                          ...(() => {
                            const s = getStyle('form_subtitle')
                            return { color: s.color, fontFamily: s.fontFamily || undefined }
                          })()
                        }}>
                          {pageLang === 'mn' ? pageConfig.form_subtitle_mn || 'Бид тантай холбогдох болно' : pageConfig.form_subtitle_en || 'We will contact you'}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="grid grid-cols-2 gap-1">
                          <div className="h-2 bg-gray-200 rounded" />
                          <div className="h-2 bg-gray-200 rounded" />
                        </div>
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2.5 rounded bg-[#0048BA] mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* Dimension label */}
                  <div className="absolute top-2 left-2 z-30">
                    <span className="text-[9px] font-mono text-white/70 bg-black/60 px-1.5 py-0.5 rounded">
                      {previewDevice === 'desktop' ? '1920 × 1080px (100vh)' : '375 × 812px (100vh)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gray-900/70 border border-red-400/50" />
                  <span className="text-gray-500">Navbar хаагдах хэсэг</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border-2 border-emerald-400/70" />
                  <span className="text-gray-500">Safe zone — контент харагдах хэсэг</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 text-center">
                Энэ хуудас full-screen (100vh) баннертай. Зөвхөн navbar-ын дор бүх зураг бүрэн харагдана. Маягтын карт зургийн дунд байрлана.
              </p>
            </div>
          )}

          {/* Language toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setPageLang('mn')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                pageLang === 'mn' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              MN
            </button>
            <button
              onClick={() => setPageLang('en')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                pageLang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              EN
            </button>
          </div>

          {/* Form section texts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Маягтын текст ({pageLang === 'mn' ? 'Монгол' : 'English'})
            </h3>

            {/* Form title */}
            <div>
              <Input
                label="Маягтын гарчиг"
                placeholder={pageLang === 'mn' ? 'Мэдээллээ бөглөнө үү' : 'Fill in your details'}
                value={pageLang === 'mn' ? pageConfig.form_title_mn : pageConfig.form_title_en}
                onChange={(e) => setPageConfig(prev => ({
                  ...prev,
                  [pageLang === 'mn' ? 'form_title_mn' : 'form_title_en']: e.target.value
                }))}
              />
              {renderStylePanel('form_title', { color: '#111827', fontSize: '20' })}
            </div>

            {/* Form subtitle */}
            <div>
              <Input
                label="Маягтын дэд гарчиг"
                placeholder={pageLang === 'mn' ? 'Бид тантай холбогдох болно' : 'We will contact you'}
                value={pageLang === 'mn' ? pageConfig.form_subtitle_mn : pageConfig.form_subtitle_en}
                onChange={(e) => setPageConfig(prev => ({
                  ...prev,
                  [pageLang === 'mn' ? 'form_subtitle_mn' : 'form_subtitle_en']: e.target.value
                }))}
              />
              {renderStylePanel('form_subtitle', { color: '#9ca3af', fontSize: '12' })}
            </div>

            {/* Disclaimer */}
            <div>
              <Textarea
                label="Анхааруулга текст"
                placeholder={pageLang === 'mn' ? 'Мэдээлэл зөв оруулна уу...' : 'Please enter correct info...'}
                value={pageLang === 'mn' ? pageConfig.disclaimer_mn : pageConfig.disclaimer_en}
                onChange={(e) => setPageConfig(prev => ({
                  ...prev,
                  [pageLang === 'mn' ? 'disclaimer_mn' : 'disclaimer_en']: e.target.value
                }))}
                rows={3}
              />
              {renderStylePanel('disclaimer', { color: '#9ca3af', fontSize: '11' })}
            </div>

            {/* Button text */}
            <div>
              <Input
                label="Товч текст"
                placeholder={pageLang === 'mn' ? 'Хүсэлт илгээх' : 'Submit'}
                value={pageLang === 'mn' ? pageConfig.button_text_mn : pageConfig.button_text_en}
                onChange={(e) => setPageConfig(prev => ({
                  ...prev,
                  [pageLang === 'mn' ? 'button_text_mn' : 'button_text_en']: e.target.value
                }))}
              />
              {renderStylePanel('button_text', { color: '#ffffff', fontSize: '14' })}
            </div>
          </div>

          {/* Success state texts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Амжилттай илгээсний дараах текст ({pageLang === 'mn' ? 'Монгол' : 'English'})
            </h3>

            {/* Success title */}
            <div>
              <Input
                label="Гарчиг"
                placeholder={pageLang === 'mn' ? 'Баярлалаа!' : 'Thank you!'}
                value={pageLang === 'mn' ? pageConfig.success_title_mn : pageConfig.success_title_en}
                onChange={(e) => setPageConfig(prev => ({
                  ...prev,
                  [pageLang === 'mn' ? 'success_title_mn' : 'success_title_en']: e.target.value
                }))}
              />
              {renderStylePanel('success_title', { color: '#ffffff', fontSize: '36' })}
            </div>

            {/* Success subtitle */}
            <div>
              <Input
                label="Дэд гарчиг"
                placeholder={pageLang === 'mn' ? 'Хүсэлт амжилттай илгээгдлээ' : 'Request submitted successfully'}
                value={pageLang === 'mn' ? pageConfig.success_subtitle_mn : pageConfig.success_subtitle_en}
                onChange={(e) => setPageConfig(prev => ({
                  ...prev,
                  [pageLang === 'mn' ? 'success_subtitle_mn' : 'success_subtitle_en']: e.target.value
                }))}
              />
              {renderStylePanel('success_subtitle', { color: '#ffffffe6', fontSize: '20' })}
            </div>

            {/* Success description */}
            <div>
              <Input
                label="Тайлбар"
                placeholder={pageLang === 'mn' ? 'Манай мэргэжилтэн тантай удахгүй холбогдох болно.' : 'Our specialist will contact you soon.'}
                value={pageLang === 'mn' ? pageConfig.success_description_mn : pageConfig.success_description_en}
                onChange={(e) => setPageConfig(prev => ({
                  ...prev,
                  [pageLang === 'mn' ? 'success_description_mn' : 'success_description_en']: e.target.value
                }))}
              />
              {renderStylePanel('success_description', { color: '#ffffff66', fontSize: '14' })}
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              loading={pageSaving}
              onClick={savePageConfig}
            >
              Хадгалах
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
