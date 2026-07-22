import React from 'react'

/**
 * Shared font options for all admin pages.
 * These map to Google Fonts loaded in layout.tsx.
 */
export const FONT_OPTIONS = [
  { value: '', label: 'Default', family: 'inherit', weight: 400 },
  { value: 'Montserrat-Bold', label: 'Montserrat Bold', family: "'Montserrat', sans-serif", weight: 700 },
  { value: 'Montserrat-Regular', label: 'Montserrat Regular', family: "'Montserrat', sans-serif", weight: 400 },
  { value: 'Montserrat-Black', label: 'Montserrat Black', family: "'Montserrat', sans-serif", weight: 900 },
  { value: 'OpenSans-ExtraBold', label: 'Open Sans Extra Bold', family: "'Open Sans', sans-serif", weight: 800 },
  { value: 'OpenSans-Regular', label: 'Open Sans Regular', family: "'Open Sans', sans-serif", weight: 400 },
  { value: 'Poppins-Bold', label: 'Poppins Bold', family: "'Poppins', sans-serif", weight: 700 },
  { value: 'Poppins-Regular', label: 'Poppins Regular', family: "'Poppins', sans-serif", weight: 400 },
] as const

/**
 * Convert a stored font value (e.g. 'Montserrat-Bold') to CSS properties.
 */
export function getFontStyle(fontValue: string | undefined | null): React.CSSProperties {
  if (!fontValue) return {}
  const opt = FONT_OPTIONS.find(f => f.value === fontValue)
  if (!opt || !opt.value) return {}
  return { fontFamily: opt.family, fontWeight: opt.weight }
}

/**
 * Reusable font selector dropdown.
 */
export function FontSelect({
  value,
  onChange,
  label = 'Фонт',
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  label?: string
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.family, fontWeight: f.weight }}>
            {f.label}
          </option>
        ))}
      </select>
      {value && (
        <p className="text-xs text-slate-500 mt-1" style={getFontStyle(value)}>
          Жишээ текст
        </p>
      )}
    </div>
  )
}
