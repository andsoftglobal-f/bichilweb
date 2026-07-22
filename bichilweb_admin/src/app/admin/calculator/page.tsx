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

interface CalcConfig {
  id?: number
  banner_image: string
  banner_mobile_image: string
  title_mn: string
  title_en: string
  subtitle_mn: string
  subtitle_en: string
  calc_btn_color: string
  calc_btn_font_size: string
  calc_btn_text: string
  request_btn_color: string
  request_btn_font_size: string
  request_btn_text: string
  request_btn_url: string
  disclaimer_color: string
  disclaimer_font_size: string
  disclaimer_text: string
  text_styles: TextStyles
  active: boolean
}

const defaultConfig: CalcConfig = {
  banner_image: '',
  banner_mobile_image: '',
  title_mn: 'Зээлийн тооцоолол',
  title_en: 'Loan Calculator',
  subtitle_mn: 'Зээлийн хэмжээ, хүү, хугацааг оруулан сарын төлбөр болон эргэн төлөх хуваарийг тооцоолно уу',
  subtitle_en: 'Enter loan amount, interest rate and term to calculate monthly payments and repayment schedule',
  calc_btn_color: '#0048BA',
  calc_btn_font_size: '14px',
  calc_btn_text: 'Тооцоолох',
  request_btn_color: '#2563eb',
  request_btn_font_size: '14px',
  request_btn_text: 'Хүсэлт илгээх',
  request_btn_url: '/loan-request',
  disclaimer_color: '#92400e',
  disclaimer_font_size: '10px',
  disclaimer_text: 'Энэхүү тооцоолуур нь зөвхөн мэдээллийн зорилготой бөгөөд бодит зээлийн нөхцөл өөр байж болно.',
  text_styles: {},
  active: true,
}

export default function CalculatorAdminPage() {
  const [config, setConfig] = useState<CalcConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lang, setLang] = useState<'mn' | 'en'>('mn')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [openStyleKey, setOpenStyleKey] = useState<string | null>(null)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  const getStyle = (key: string): TextStyle => config.text_styles?.[key] || {}

  const updateStyle = (key: string, prop: keyof TextStyle, value: string) => {
    setConfig(prev => ({
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
      setConfig(prev => ({
        ...prev,
        text_styles: {
          ...prev.text_styles,
          [key]: { ...(prev.text_styles?.[key] || {}), fontFamily: '', fontWeight: '' }
        }
      }))
      return
    }
    const [family, weight] = combined.split(':')
    setConfig(prev => ({
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
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get('/calculator-config/')
      setConfig({ ...defaultConfig, ...res.data, text_styles: res.data.text_styles || {} })
    } catch (err) {
      console.error('Failed to fetch calculator config:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      await axiosInstance.post('/calculator-config/', config)
      setMessage({ type: 'success', text: 'Амжилттай хадгалагдлаа' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Failed to save calculator config:', err)
      setMessage({ type: 'error', text: 'Хадгалахад алдаа гарлаа' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Зээлийн тооцоолуур">
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
    <AdminLayout title="Зээлийн тооцоолуур">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Зээлийн тооцоолуур"
          description="Хэрэглэгч хэсэгт харагдах зээлийн тооцоолуур хуудсыг тохируулах"
          action={
            <a
              href="http://localhost:3000/calculator"
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
          {message && (
            <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Active toggle */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Хуудас идэвхтэй эсэх</h3>
                <p className="text-xs text-gray-500 mt-1">Зээлийн тооцоолуур хуудсыг хэрэглэгчдэд харуулах</p>
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, active: !prev.active }))}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  config.active ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  config.active ? 'translate-x-[22px]' : 'translate-x-[2px]'
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
                value={config.banner_image}
                onChange={(url) => setConfig(prev => ({ ...prev, banner_image: url }))}
              />
              <ImageUpload
                label="Баннер зураг (Mobile)"
                value={config.banner_mobile_image}
                onChange={(url) => setConfig(prev => ({ ...prev, banner_mobile_image: url }))}
              />
            </div>
          </div>

          {/* Banner Preview */}
          {(config.banner_image || config.banner_mobile_image) && (
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
                Desktop layout (1920px viewport):
                  - Banner: section(pt-36=144 + content~130 + pb-28=112 = ~386px) + extend(-bottom-32=128px) = ~514px
                  - Navbar covers top: ~96px (lg:-mt-24=96px)
                  - Calc card overlap bottom: -mt-16=64px + extend 128px = 192px from bottom
                  Percentages: navbar=18.7%, visible=44%, card+extend=37.3%

                Mobile layout (375px viewport):
                  - Banner: section(pt-32=128 + content~110 + pb-20=80 = ~318px) + extend(-bottom-24=96px) = ~414px  
                  - Navbar covers top: ~80px (-mt-20=80px)
                  - Calc card overlap bottom: -mt-12=48px + extend 96px = 144px from bottom
                  Percentages: navbar=19.3%, visible=45.8%, card+extend=34.9%
              */}
              <div className="flex justify-center">
                <div
                  className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900"
                  style={{
                    width: previewDevice === 'desktop' ? '100%' : '375px',
                    aspectRatio: previewDevice === 'desktop' ? '1920/514' : '375/414',
                  }}
                >
                  {/* Banner image */}
                  {(() => {
                    const src = previewDevice === 'mobile'
                      ? (config.banner_mobile_image || config.banner_image)
                      : config.banner_image
                    return src ? (
                      <img
                        src={src}
                        alt="Banner preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : null
                  })()}

                  {/* Dark overlay like frontend */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30" />

                  {/* Navbar overlay zone (top) */}
                  <div
                    className="absolute top-0 left-0 right-0 bg-gray-900/70 backdrop-blur-[1px] border-b border-dashed border-red-400/50 z-20"
                    style={{ height: previewDevice === 'desktop' ? '18.7%' : '19.3%' }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-semibold text-red-300/80 bg-black/40 px-2 py-0.5 rounded-full">
                        Navbar — {previewDevice === 'desktop' ? '96px' : '80px'}
                      </span>
                    </div>
                    {/* Size label */}
                    <div className="absolute right-1.5 bottom-1">
                      <span className="text-[8px] font-mono text-red-300/60">
                        {previewDevice === 'desktop' ? '1920 × 96' : '375 × 80'}
                      </span>
                    </div>
                  </div>

                  {/* Card overlap zone (bottom) */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gray-100/70 backdrop-blur-[1px] border-t border-dashed border-amber-400/50 z-20"
                    style={{ height: previewDevice === 'desktop' ? '37.3%' : '34.9%' }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <div className="w-[60%] h-[2px] bg-amber-400/40 rounded-full" />
                      <span className="text-[9px] font-semibold text-amber-400/80 bg-black/40 px-2 py-0.5 rounded-full">
                        Карт давхцал + үргэлжлэл — {previewDevice === 'desktop' ? '192px' : '144px'}
                      </span>
                      <span className="text-[8px] text-amber-300/60">
                        ({previewDevice === 'desktop' ? 'card -mt-16 + extend -bottom-32' : 'card -mt-12 + extend -bottom-24'})
                      </span>
                    </div>
                    {/* Size label */}
                    <div className="absolute right-1.5 top-1">
                      <span className="text-[8px] font-mono text-amber-300/60">
                        {previewDevice === 'desktop' ? '1920 × 192' : '375 × 144'}
                      </span>
                    </div>
                  </div>

                  {/* SAFE ZONE — visible content area */}
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{
                      top: previewDevice === 'desktop' ? '18.7%' : '19.3%',
                      bottom: previewDevice === 'desktop' ? '37.3%' : '34.9%',
                    }}
                  >
                    {/* Safe zone border */}
                    <div className="absolute inset-0 border-2 border-emerald-400/70" />

                    {/* px measurements on sides */}
                    <div className="absolute left-0 top-0 bottom-0 flex items-center">
                      <span className="text-[8px] font-mono text-emerald-300 bg-black/50 px-1 py-0.5 rounded-r">
                        {previewDevice === 'desktop' ? 'px-8 (32px)' : 'px-5 (20px)'}
                      </span>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 flex items-center">
                      <span className="text-[8px] font-mono text-emerald-300 bg-black/50 px-1 py-0.5 rounded-l">
                        {previewDevice === 'desktop' ? 'px-8 (32px)' : 'px-5 (20px)'}
                      </span>
                    </div>

                    {/* Safe zone label */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-400/40 whitespace-nowrap">
                        ✓ Safe Zone — {previewDevice === 'desktop' ? '1920 × 226px' : '375 × 190px'}
                      </span>
                    </div>

                    {/* Height label */}
                    <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 flex flex-col items-center">
                      <div className="w-px h-full bg-emerald-400/40 absolute" />
                    </div>
                  </div>

                  {/* Content preview inside safe zone */}
                  <div
                    className="absolute left-0 right-0 z-30 flex flex-col items-center justify-center"
                    style={{
                      top: previewDevice === 'desktop' ? '18.7%' : '19.3%',
                      bottom: previewDevice === 'desktop' ? '37.3%' : '34.9%',
                      paddingLeft: previewDevice === 'desktop' ? '32px' : '20px',
                      paddingRight: previewDevice === 'desktop' ? '32px' : '20px',
                    }}
                  >
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-2">
                      <span className="text-[8px] font-medium text-white/70 uppercase tracking-wider">
                        Зээлийн тооцоолуур
                      </span>
                    </div>
                    <h2 className="text-white font-bold text-center leading-tight mb-1" style={{
                      fontSize: previewDevice === 'desktop' ? '18px' : '14px',
                      ...(() => {
                        const s = getStyle('title')
                        return {
                          color: s.color || '#ffffff',
                          fontFamily: s.fontFamily || undefined,
                          fontWeight: s.fontWeight || '700',
                        }
                      })()
                    }}>
                      {lang === 'mn' ? config.title_mn : config.title_en}
                    </h2>
                    <p className="text-center max-w-xs leading-snug" style={{
                      fontSize: previewDevice === 'desktop' ? '9px' : '8px',
                      ...(() => {
                        const s = getStyle('subtitle')
                        return {
                          color: s.color || 'rgba(255,255,255,0.5)',
                          fontFamily: s.fontFamily || undefined,
                          fontWeight: s.fontWeight || '400',
                        }
                      })()
                    }}>
                      {lang === 'mn' ? config.subtitle_mn : config.subtitle_en}
                    </p>
                  </div>

                  {/* Dimension labels */}
                  <div className="absolute top-2 left-2 z-30">
                    <span className="text-[9px] font-mono text-white/70 bg-black/60 px-1.5 py-0.5 rounded">
                      {previewDevice === 'desktop' ? '1920 × 514px' : '375 × 414px'}
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
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gray-100/70 border border-amber-400/50" />
                  <span className="text-gray-500">Калькулятор карт давхцах хэсэг</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 text-center">
                Зургийн чухал контент (текст, лого г.м) ногоон safe zone дотор байрлуулна уу. Улаан, шар хэсэг нь navbar эсвэл калькулятор картаар хаагдана.
              </p>
            </div>
          )}

          {/* Language toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setLang('mn')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                lang === 'mn' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              MN
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              EN
            </button>
          </div>

          {/* Hero texts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Гарчиг текст ({lang === 'mn' ? 'Монгол' : 'English'})
            </h3>

            {/* Title */}
            <div>
              <Input
                label="Гарчиг"
                placeholder={lang === 'mn' ? 'Зээлийн тооцоолол' : 'Loan Calculator'}
                value={lang === 'mn' ? config.title_mn : config.title_en}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  [lang === 'mn' ? 'title_mn' : 'title_en']: e.target.value
                }))}
              />
              {renderStylePanel('title', { color: '#ffffff', fontSize: '40' })}
            </div>

            {/* Subtitle */}
            <div>
              <Textarea
                label="Дэд гарчиг"
                placeholder={lang === 'mn' ? 'Зээлийн хэмжээ, хүү...' : 'Enter loan amount...'}
                value={lang === 'mn' ? config.subtitle_mn : config.subtitle_en}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  [lang === 'mn' ? 'subtitle_mn' : 'subtitle_en']: e.target.value
                }))}
                rows={2}
              />
              {renderStylePanel('subtitle', { color: '#ffffff80', fontSize: '14' })}
            </div>
          </div>

          {/* Button styles */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900">Товчны тохиргоо</h3>

            {/* Calculate button */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Тооцоолох товч</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Товч текст"
                  value={config.calc_btn_text}
                  onChange={(e) => setConfig(prev => ({ ...prev, calc_btn_text: e.target.value }))}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Товч өнгө</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.calc_btn_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, calc_btn_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.calc_btn_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, calc_btn_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700"
                    />
                  </div>
                </div>
                <Input
                  label="Фонт хэмжээ"
                  value={config.calc_btn_font_size}
                  onChange={(e) => setConfig(prev => ({ ...prev, calc_btn_font_size: e.target.value }))}
                />
              </div>
              {/* Preview */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-[11px] text-gray-400 block mb-2">Урьдчилан харах:</span>
                <button
                  type="button"
                  className="px-6 py-2.5 text-white rounded-xl font-semibold transition-all"
                  style={{ backgroundColor: config.calc_btn_color, fontSize: config.calc_btn_font_size }}
                >
                  {config.calc_btn_text}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Request button */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Хүсэлт илгээх товч</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Товч текст"
                  value={config.request_btn_text}
                  onChange={(e) => setConfig(prev => ({ ...prev, request_btn_text: e.target.value }))}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Товч өнгө</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.request_btn_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, request_btn_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.request_btn_color}
                      onChange={(e) => setConfig(prev => ({ ...prev, request_btn_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700"
                    />
                  </div>
                </div>
                <Input
                  label="Фонт хэмжээ"
                  value={config.request_btn_font_size}
                  onChange={(e) => setConfig(prev => ({ ...prev, request_btn_font_size: e.target.value }))}
                />
              </div>
              <Input
                label="Товч линк (URL)"
                placeholder="/loan-request"
                value={config.request_btn_url}
                onChange={(e) => setConfig(prev => ({ ...prev, request_btn_url: e.target.value }))}
              />
              {/* Preview */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-[11px] text-gray-400 block mb-2">Урьдчилан харах:</span>
                <button
                  type="button"
                  className="px-6 py-2.5 text-white rounded-xl font-semibold transition-all"
                  style={{ backgroundColor: config.request_btn_color, fontSize: config.request_btn_font_size }}
                >
                  {config.request_btn_text}
                </button>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Анхааруулга текст</h3>
            <Textarea
              label="Текст"
              value={config.disclaimer_text}
              onChange={(e) => setConfig(prev => ({ ...prev, disclaimer_text: e.target.value }))}
              rows={2}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Текст өнгө</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.disclaimer_color}
                    onChange={(e) => setConfig(prev => ({ ...prev, disclaimer_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={config.disclaimer_color}
                    onChange={(e) => setConfig(prev => ({ ...prev, disclaimer_color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700"
                  />
                </div>
              </div>
              <Input
                label="Фонт хэмжээ"
                value={config.disclaimer_font_size}
                onChange={(e) => setConfig(prev => ({ ...prev, disclaimer_font_size: e.target.value }))}
              />
            </div>
            {/* Preview */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-[11px] text-gray-400 block mb-2">Урьдчилан харах:</span>
              <p style={{ color: config.disclaimer_color, fontSize: config.disclaimer_font_size }}>
                {config.disclaimer_text}
              </p>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              loading={saving}
              onClick={saveConfig}
            >
              Хадгалах
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
