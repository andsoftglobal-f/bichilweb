// ============================================================================
// HEADER API - Django backend-аас шууд дуудна
// ============================================================================
// Тогтмол өгөгдөл байхгүй - бүх header мэдээллийг PostgreSQL-ээс авна.
// Frontend → Django backend (/api/v1/headers/) → PostgreSQL
// Admin panel дундуур дамжихгүй - шууд Django backend руу хандана.
// ============================================================================

import axios from 'axios';
import { logApiWarning } from '@/lib/apiError';

// ── Django backend-ийн бүтцийн тодорхойлолт ──

// Орчуулгын бүтэц (хэл тус бүрд нэг)
interface ApiTranslation {
  id?: number
  label: string
  language_id: number // 1 = Англи, 2 = Монгол
}

// 4-р түвшний цэс (дөрөвдөгч)
interface ApiQuaternaryMenu {
  id: number
  path: string
  font: string
  index: number
  visible: number
  translations: ApiTranslation[]
}

// 3-р түвшний цэс (гуравдагч)
interface ApiTertiaryMenu {
  id: number
  path: string
  font: string
  index: number
  visible: number
  translations: ApiTranslation[]
  quaternary_menus: ApiQuaternaryMenu[]
}

// 2-р түвшний цэс (дэд цэс)
interface ApiSubmenu {
  id: number
  path: string
  font: number | string
  index: number
  visible: number
  translations: ApiTranslation[]
  tertiary_menus: ApiTertiaryMenu[]
}

// 1-р түвшний цэс (үндсэн цэс)
interface ApiMenu {
  id: number
  path: string
  font: number | string
  index: number
  visible: number
  translations: ApiTranslation[]
  submenus: ApiSubmenu[]
}

// Стиль
interface ApiHeaderStyle {
  id: number
  bgcolor: string
  fontcolor: string
  hovercolor: string
  height: number
  sticky: number
  max_width?: string
  logo_size?: number
}

// Header бүтэц (Django-ийн `/api/v1/headers/` endpoint-аас ирэх)
interface ApiHeaderData {
  id: number
  logo: string
  active: number
  styles: ApiHeaderStyle[]
  menus: ApiMenu[]
}

// ── Frontend-д хэрэглэх бүтцийн тодорхойлолт ──

export interface FrontendSubMenuItem {
  title_mn: string
  title_en: string
  href: string
  font?: string
}

export interface FrontendMenuItem {
  title_mn: string
  title_en: string
  href?: string
  font?: string
  items?: FrontendSubMenuItem[]
  subMenus?: Record<string, FrontendSubMenuItem[]>
  tertiarySubMenus?: Record<string, FrontendSubMenuItem[]>
}

export interface FrontendHeaderStyle {
  backgroundColor: string
  textColor: string
  hoverColor: string
  height: string
  isSticky: boolean
  logoUrl: string
  maxWidth: string
  logoSize: number
}

export interface FrontendHeaderData {
  menuItems: FrontendMenuItem[]
  style: FrontendHeaderStyle | null
}

const HEADER_CACHE_KEY = 'bichil_header_data_v2'

export const readHeaderCache = (): FrontendHeaderData | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(HEADER_CACHE_KEY)
    return raw ? JSON.parse(raw) as FrontendHeaderData : null
  } catch {
    return null
  }
}

const writeHeaderCache = (data: FrontendHeaderData) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(HEADER_CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage can be unavailable in private mode; header still works from API.
  }
}

const clearHeaderCache = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(HEADER_CACHE_KEY)
  } catch {
    // Ignore unavailable storage.
  }
}

// ============================================================================
// Орчуулгаас текст авах туслах функц
// ============================================================================
const getLabelByLang = (translations: ApiTranslation[], langId: number): string => {
  return translations?.find(t => t.language_id === langId)?.label || ''
}

// ============================================================================
// Django backend-аас header өгөгдөл татах
// ============================================================================
// Django-ийн /api/v1/headers/ нь header + menus + submenus + tertiary_menus
// + translations + styles бүгдийг nested JSON байдлаар буцаадаг.
// Энэ функц нь тэр бүтцийг frontend-д тохирох хэлбэрт хөрвүүлнэ.
// ============================================================================
export const fetchHeaderFromDB = async (): Promise<FrontendHeaderData | null> => {
  try {
    // Django backend-ийн URL хаяг
    const response = await axios.get('/api/header', {
      timeout: 30000,
      headers: {
        'Cache-Control': 'no-cache',
      },
    })

    if (response.status !== 200 || !response.data) {
      return null
    }

    // Django жагсаалт буцаадаг - эхний header авна
    // Paginated response: {count, next, previous, results: [...]}
    const rawData = response.data
    const headers: ApiHeaderData[] = Array.isArray(rawData) 
      ? rawData 
      : (rawData.results && Array.isArray(rawData.results) ? rawData.results : [])
    if (headers.length === 0) {
      clearHeaderCache()
      return null
    }

    const headerData = headers[0]
    if (!headerData?.menus || headerData.menus.length === 0) {
      clearHeaderCache()
    }
    const transformed = transformApiToFrontend(headerData)
    if (transformed.menuItems.length > 0) {
      writeHeaderCache(transformed)
    } else {
      clearHeaderCache()
    }
    return transformed
  } catch (error) {
    logApiWarning('Header API', error)
    return readHeaderCache()
  }
}

// ============================================================================
// Django-ийн nested бүтцийг frontend-ийн бүтэц рүү хөрвүүлэх
// ============================================================================
// Django бүтэц:
//   header.menus[].submenus[].tertiary_menus[] (тус бүр translations[]-тай)
// Frontend бүтэц:
//   MenuItem[].items[] (SubMenuItem[]) + subMenus (Record<string, SubMenuItem[]>)
// ============================================================================
const transformApiToFrontend = (data: ApiHeaderData): FrontendHeaderData => {
  const menus = data.menus || []

  // Цэснүүдийг index-ээр нь эрэмбэлэх
  const sortedMenus = [...menus].sort((a, b) => a.index - b.index)

  const menuItems: FrontendMenuItem[] = sortedMenus
    .filter(menu => menu.visible === 1) // Зөвхөн идэвхтэй цэснүүд
    .map(menu => {
      const titleMn = getLabelByLang(menu.translations, 2)
      const titleEn = getLabelByLang(menu.translations, 1)

      const submenus = (menu.submenus || [])
        .filter(sub => sub.visible === 1)
        .sort((a, b) => a.index - b.index)

      // Хэрэв дэд цэсгүй бол шууд линк
      if (submenus.length === 0) {
        return {
          title_mn: titleMn,
          title_en: titleEn,
          href: menu.path !== '#' ? menu.path : undefined,
          font: String(menu.font || ''),
        } as FrontendMenuItem
      }

      // Дэд цэснүүдийг хөрвүүлэх
      const items: FrontendSubMenuItem[] = submenus.map(sub => ({
        title_mn: getLabelByLang(sub.translations, 2),
        title_en: getLabelByLang(sub.translations, 1),
        href: sub.path || '#',
        font: String(sub.font || ''),
      }))

      // 3-р түвшний цэснүүдийг subMenus (Record) руу хөрвүүлэх
      // Түлхүүр = дэд цэсний нэр, утга = гуравдагч цэснүүдийн жагсаалт
      const subMenus: Record<string, FrontendSubMenuItem[]> = {}
      // 4-р түвшний цэснүүдийг tertiarySubMenus (Record) руу хөрвүүлэх
      // Түлхүүр = гуравдагч цэсний нэр, утга = дөрөвдөгч цэснүүдийн жагсаалт
      const tertiarySubMenus: Record<string, FrontendSubMenuItem[]> = {}

      submenus.forEach(sub => {
        const tertiaryMenus = (sub.tertiary_menus || [])
          .filter(t => t.visible === 1)
          .sort((a, b) => a.index - b.index)

        if (tertiaryMenus.length > 0) {
          const subLabelMn = getLabelByLang(sub.translations, 2)
          const subLabelEn = getLabelByLang(sub.translations, 1)

          const tertiaryItems = tertiaryMenus.map(t => ({
            title_mn: getLabelByLang(t.translations, 2),
            title_en: getLabelByLang(t.translations, 1),
            href: t.path || '#',
            font: String(t.font || ''),
          }))

          // Монгол болон Англи хэл дээрх түлхүүрүүдийг хоёуланг нь нэмнэ
          if (subLabelMn) subMenus[subLabelMn] = tertiaryItems
          if (subLabelEn) subMenus[subLabelEn] = tertiaryItems

          // 4-р түвшний цэснүүдийг гуравдагч цэснүүдийн доороос хайж хөрвүүлэх
          tertiaryMenus.forEach(ter => {
            const quaternaryMenus = (ter.quaternary_menus || [])
              .filter(q => q.visible === 1)
              .sort((a, b) => a.index - b.index)

            if (quaternaryMenus.length > 0) {
              const terLabelMn = getLabelByLang(ter.translations, 2)
              const terLabelEn = getLabelByLang(ter.translations, 1)

              const quaternaryItems = quaternaryMenus.map(q => ({
                title_mn: getLabelByLang(q.translations, 2),
                title_en: getLabelByLang(q.translations, 1),
                href: q.path || '#',
                font: String(q.font || ''),
              }))

              if (terLabelMn) tertiarySubMenus[terLabelMn] = quaternaryItems
              if (terLabelEn) tertiarySubMenus[terLabelEn] = quaternaryItems
            }
          })
        }
      })

      return {
        title_mn: titleMn,
        title_en: titleEn,
        font: String(menu.font || ''),
        items,
        subMenus: Object.keys(subMenus).length > 0 ? subMenus : undefined,
        tertiarySubMenus: Object.keys(tertiarySubMenus).length > 0 ? tertiarySubMenus : undefined,
      } as FrontendMenuItem
    })

  // Стиль хөрвүүлэх
  let style: FrontendHeaderStyle | null = null
  if (data.styles && data.styles.length > 0) {
    const s = data.styles[0]
    style = {
      backgroundColor: s.bgcolor || '#ffffff',
      textColor: s.fontcolor || '#1f2937',
      hoverColor: s.hovercolor || '#0d9488',
      height: `${s.height || 80}px`,
      isSticky: s.sticky === 1,
      logoUrl: data.logo || '',
      maxWidth: s.max_width || '1240px',
      logoSize: s.logo_size || 44,
    }
  }

  return { menuItems, style }
}

// ============================================================================
// Хуучин нэрс (backward compatibility)
// ============================================================================
// Хуучин код дуудаж байвал энэ функц ашиглана
export const fetchAdminHeaderMenu = async (): Promise<FrontendMenuItem[] | null> => {
  const result = await fetchHeaderFromDB()
  return result?.menuItems || null
}
