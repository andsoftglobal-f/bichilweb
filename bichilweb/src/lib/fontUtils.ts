/**
 * Shared font utilities for the frontend.
 * Maps stored font values (e.g. 'Montserrat-Bold') to CSS properties.
 */

export const FONT_MAP: Record<string, { family: string; weight: number }> = {
  'Montserrat-Bold': { family: "'Montserrat', sans-serif", weight: 700 },
  'Montserrat-Regular': { family: "'Montserrat', sans-serif", weight: 400 },
  'Montserrat-Black': { family: "'Montserrat', sans-serif", weight: 900 },
  'OpenSans-ExtraBold': { family: "'Open Sans', sans-serif", weight: 800 },
  'OpenSans-Regular': { family: "'Open Sans', sans-serif", weight: 400 },
  'Poppins-Bold': { family: "'Poppins', sans-serif", weight: 700 },
  'Poppins-Regular': { family: "'Poppins', sans-serif", weight: 400 },
}

/**
 * Convert a stored font value (e.g. 'Montserrat-Bold') to CSS style object.
 * Falls back to treating unknown values as raw fontFamily strings (for legacy data).
 */
export function getFontStyle(fontValue: string | undefined | null): React.CSSProperties {
  if (!fontValue) return {}
  const m = FONT_MAP[fontValue]
  if (!m) return { fontFamily: fontValue }
  return { fontFamily: m.family, fontWeight: m.weight }
}
