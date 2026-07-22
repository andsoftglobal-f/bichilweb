'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import ImageUpload from '@/components/ImageUpload'
import {
  SwatchIcon,
  PhotoIcon,
  CheckIcon,
  ArrowPathIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import { PageHeader } from '@/components/FormElements'

// ============================================================================
// Өнгө utils
// ============================================================================
function hexToRgb(hex: string) {
  const c = hex.replace('#', '')
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  }
}

const PRESET_SIDEBAR_COLORS = [
  { name: 'Royal Blue', value: '#0048BA' },
  { name: 'Navy', value: '#1B1F3B' },
  { name: 'Dark Slate', value: '#1e1e2d' },
  { name: 'Midnight', value: '#0f172a' },
  { name: 'Charcoal', value: '#334155' },
  { name: 'Deep Purple', value: '#3b0764' },
  { name: 'Dark Teal', value: '#134e4a' },
  { name: 'Dark Red', value: '#7f1d1d' },
]

const PRESET_ACCENT_COLORS = [
  { name: 'Sky Blue', value: '#00B2E7' },
  { name: 'Royal Blue', value: '#0048BA' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Cyan', value: '#06b6d4' },
]

// Цэсийн анхдагч нэрс
const DEFAULT_MENU_ITEMS = [
  { key: 'Хянах самбар', group: 'Эх цэс' },
  { key: 'Сайтын бүтэц', group: 'Эх цэс' },
  { key: 'Толгой хэсэг', group: 'Сайтын бүтэц' },
  { key: 'Баннер слайдер', group: 'Сайтын бүтэц' },
  { key: 'CTA слайдер', group: 'Сайтын бүтэц' },
  { key: 'Хөвөгч цэс', group: 'Сайтын бүтэц' },
  { key: 'Хөл хэсэг', group: 'Сайтын бүтэц' },
  { key: 'Апп татах', group: 'Сайтын бүтэц' },
  { key: 'Хамтрагчид', group: 'Сайтын бүтэц' },
  { key: 'Үзүүлэлтүүд', group: 'Сайтын бүтэц' },
  { key: 'Бүтээгдэхүүний заавар', group: 'Сайтын бүтэц' },
  { key: 'Хуудас холбох', group: 'Сайтын бүтэц' },
  { key: 'Бүтээгдэхүүн', group: 'Эх цэс' },
  { key: 'Бүтээгдхүүн удирдлага', group: 'Бүтээгдэхүүн' },
  { key: 'Бүтээгдхүүн нэмэх', group: 'Бүтээгдэхүүн' },
  { key: 'Баннер', group: 'Бүтээгдэхүүн' },
  { key: 'Үйлчилгээ', group: 'Эх цэс' },
  { key: 'Үйлчилгээ нэмэх', group: 'Үйлчилгээ' },
  { key: 'Байгууллага', group: 'Эх цэс' },
  { key: 'Бидний тухай', group: 'Байгууллага' },
  { key: 'Салбарууд', group: 'Байгууллага' },
  { key: 'Контент', group: 'Эх цэс' },
  { key: 'Мэдээ', group: 'Контент' },
  { key: 'Хуудас удирдах', group: 'Эх цэс' },
  { key: 'Хүний нөөц', group: 'Эх цэс' },
  { key: 'Санхүү', group: 'Эх цэс' },
  { key: 'Валютын ханш', group: 'Санхүү' },
  { key: 'Хэрэглэгдэхүүн', group: 'Эх цэс' },
  { key: 'Мэдээлэл', group: 'Хэрэглэгдэхүүн' },
  { key: 'Тохиргоо', group: 'Эх цэс' },
  { key: 'Лого', group: 'Тохиргоо' },
  { key: 'Өнгө', group: 'Тохиргоо' },
  { key: 'Цэс тохиргоо', group: 'Тохиргоо' },
]

// ============================================================================
// Тохиргоо хуудас
// ============================================================================
export default function ConfigPage() {
  return (
    <Suspense fallback={<AdminLayout title="Тохиргоо"><div className="flex items-center justify-center h-64">Ачааллаж байна...</div></AdminLayout>}>
      <ConfigPageInner />
    </Suspense>
  )
}

function ConfigPageInner() {
  const { settings, updateSettings, saving } = useAdminSettings()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl)
  const [sidebarColor, setSidebarColor] = useState(settings.sidebarColor)
  const [accentColor, setAccentColor] = useState(settings.accentColor)
  const [saved, setSaved] = useState(false)
  const [menuLabels, setMenuLabels] = useState<Record<string, string>>(settings.menuLabels || {})
  const [activeSection, setActiveSection] = useState<'logo' | 'color' | 'menu'>(
    tabParam === 'color' ? 'color' : tabParam === 'menu' ? 'menu' : 'logo'
  )

  // Sync tab from URL — activeSection has its own lifecycle (tab buttons
  // can change it without a navigation), so this effect exists specifically
  // to re-sync it on those occasions tabParam DOES change post-mount (Link
  // navigation, browser back/forward), not just to set an initial value.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (tabParam === 'color') setActiveSection('color')
    else if (tabParam === 'menu') setActiveSection('menu')
    else if (tabParam === 'logo') setActiveSection('logo')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [tabParam])

  // settings loads asynchronously (localStorage + API, see
  // AdminSettingsContext) — these local fields are an editable draft that
  // must pick up the real values once they arrive, then diverge freely as
  // the user edits, so they can't just be computed from `settings` inline.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLogoUrl(settings.logoUrl)
    setSidebarColor(settings.sidebarColor)
    setAccentColor(settings.accentColor)
    setMenuLabels(settings.menuLabels || {})
  }, [settings])

  const handleSave = () => {
    updateSettings({ logoUrl, sidebarColor, accentColor, menuLabels })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setSidebarColor('#0048BA')
    setAccentColor('#00B2E7')
    setLogoUrl(settings.logoUrl) // keep current logo
    setMenuLabels({})
  }

  const sidebarRgb = hexToRgb(sidebarColor)
  const accentRgb = hexToRgb(accentColor)

  return (
    <AdminLayout title="Тохиргоо">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Тохиргоо"
          description="Админ панелийн лого болон өнгөний тохиргоо"
        />

        {/* Section tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveSection('logo')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === 'logo'
                ? 'text-white shadow-lg'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            style={activeSection === 'logo' ? { background: settings.accentColor } : {}}
          >
            <PhotoIcon className="w-4 h-4" />
            Лого
          </button>
          <button
            onClick={() => setActiveSection('color')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === 'color'
                ? 'text-white shadow-lg'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            style={activeSection === 'color' ? { background: settings.accentColor } : {}}
          >
            <SwatchIcon className="w-4 h-4" />
            Өнгө
          </button>
          <button
            onClick={() => setActiveSection('menu')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === 'menu'
                ? 'text-white shadow-lg'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            style={activeSection === 'menu' ? { background: settings.accentColor } : {}}
          >
            <Bars3Icon className="w-4 h-4" />
            Цэс тохиргоо
          </button>
        </div>

        {/* ================================================================ */}
        {/* ЛОГО Section */}
        {/* ================================================================ */}
        {activeSection === 'logo' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${settings.accentColor}20` }}>
                  <PhotoIcon className="w-5 h-5" style={{ color: settings.accentColor }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Лого тохиргоо</h2>
                  <p className="text-xs text-slate-500">Sidebar дээр харагдах лого зургийг тохируулна</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current logo preview */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Одоогийн лого</label>
                <div className="flex items-center gap-6">
                  <div
                    className="w-64 h-16 rounded-xl flex items-center justify-center px-4"
                    style={{ background: sidebarColor }}
                  >
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo preview"
                        width={200}
                        height={48}
                        className="h-10 w-auto object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg" style={{ background: accentColor }} />
                        <span className="text-white/60 text-sm">Лого байхгүй</span>
                      </div>
                    )}
                  </div>
                  {logoUrl && (
                    <button
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                      Лого устгах
                    </button>
                  )}
                </div>
              </div>

              {/* Upload new logo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Шинэ лого оруулах</label>
                <ImageUpload
                  value={logoUrl}
                  onChange={(url) => setLogoUrl(url)}
                  label="Лого зураг сонгох"
                />
                <p className="text-xs text-slate-400 mt-2">PNG, SVG, WEBP формат (ил дэвсгэртэй зураг зөвлөмжтэй)</p>
              </div>

              {/* Or paste URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Эсвэл URL оруулах</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': settings.accentColor } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* ӨНГӨ Section */}
        {/* ================================================================ */}
        {activeSection === 'color' && (
          <div className="space-y-6">
            {/* Sidebar color */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sidebarColor }}>
                    <SwatchIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Цэсийн өнгө</h2>
                    <p className="text-xs text-slate-500">Sidebar-ийн арын дэвсгэр өнгө</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={sidebarColor}
                      onChange={(e) => setSidebarColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer p-0.5"
                    />
                    <div>
                      <input
                        type="text"
                        value={sidebarColor}
                        onChange={(e) => {
                          if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setSidebarColor(e.target.value)
                        }}
                        className="w-28 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-mono text-center uppercase"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5 text-center">
                        RGB({sidebarRgb.r}, {sidebarRgb.g}, {sidebarRgb.b})
                      </p>
                    </div>
                  </div>
                  {/* Sidebar preview mini */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="w-full h-14 rounded-xl flex items-center gap-2 px-4" style={{ background: sidebarColor }}>
                      {logoUrl ? (
                        <Image src={logoUrl} alt="" width={80} height={24} className="h-6 w-auto object-contain" unoptimized />
                      ) : (
                        <div className="h-6 w-6 rounded" style={{ background: accentColor }} />
                      )}
                      <div className="flex-1 flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-white/30" />
                        <div className="h-2 w-12 rounded-full bg-white/20" />
                        <div className="h-2 w-20 rounded-full bg-white/15" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Бэлэн өнгөнүүд</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SIDEBAR_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setSidebarColor(c.value)}
                        className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 ${
                          sidebarColor === c.value ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-400' : 'border-slate-200'
                        }`}
                        style={{ background: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Accent / button color */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}20` }}>
                    <SwatchIcon className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Товчнуудын өнгө</h2>
                    <p className="text-xs text-slate-500">Хуудасуудын товчлуур, идэвхтэй elements-ийн өнгө</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer p-0.5"
                    />
                    <div>
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => {
                          if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setAccentColor(e.target.value)
                        }}
                        className="w-28 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-mono text-center uppercase"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5 text-center">
                        RGB({accentRgb.r}, {accentRgb.g}, {accentRgb.b})
                      </p>
                    </div>
                  </div>
                  {/* Button preview */}
                  <div className="flex-1 min-w-[200px] flex flex-wrap gap-2">
                    <button className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm" style={{ background: accentColor }}>
                      Хадгалах
                    </button>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: accentColor, color: accentColor }}>
                      Засварлах
                    </button>
                    <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${accentColor}15`, color: accentColor }}>
                      Идэвхтэй
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Бэлэн өнгөнүүд</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_ACCENT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setAccentColor(c.value)}
                        className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 ${
                          accentColor === c.value ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-400' : 'border-slate-200'
                        }`}
                        style={{ background: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* ЦЭС Section */}
        {/* ================================================================ */}
        {activeSection === 'menu' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${settings.accentColor}20` }}>
                    <Bars3Icon className="w-5 h-5" style={{ color: settings.accentColor }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Цэсийн нэрс</h2>
                    <p className="text-xs text-slate-500">Sidebar цэсийн нэрсийг өөрчлөх</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Group by parent menus */}
                {DEFAULT_MENU_ITEMS.filter(item => item.group === 'Эх цэс').map((parentItem) => {
                  const children = DEFAULT_MENU_ITEMS.filter(item => item.group === parentItem.key)
                  return (
                    <div key={parentItem.key} className="border border-slate-100 rounded-xl overflow-hidden">
                      {/* Parent menu item */}
                      <div className="bg-slate-50 px-4 py-3 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: settings.accentColor }} />
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-1">Анхдагч: {parentItem.key}</label>
                          <input
                            type="text"
                            value={menuLabels[parentItem.key] || ''}
                            onChange={(e) => setMenuLabels(prev => ({ ...prev, [parentItem.key]: e.target.value }))}
                            placeholder={parentItem.key}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                            style={{ '--tw-ring-color': settings.accentColor } as React.CSSProperties}
                          />
                        </div>
                      </div>

                      {/* Children */}
                      {children.length > 0 && (
                        <div className="px-4 py-3 space-y-3">
                          {children.map((child) => (
                            <div key={child.key} className="flex items-center gap-3 pl-5">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <div className="flex-1">
                                <label className="block text-xs text-slate-400 mb-1">Анхдагч: {child.key}</label>
                                <input
                                  type="text"
                                  value={menuLabels[child.key] || ''}
                                  onChange={(e) => setMenuLabels(prev => ({ ...prev, [child.key]: e.target.value }))}
                                  placeholder={child.key}
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                                  style={{ '--tw-ring-color': settings.accentColor } as React.CSSProperties}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* Save / Reset */}
        {/* ================================================================ */}
        <div className="mt-6 flex items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Анхдагч болгох
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            style={{ background: settings.accentColor }}
          >
            {saved ? <CheckIcon className="w-4 h-4" /> : null}
            {saved ? 'Хадгалагдлаа!' : saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
