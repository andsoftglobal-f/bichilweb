import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const RAW_BACKEND_URL = process.env.BACKEND_API_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000/api/v1'
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/+$/, '').endsWith('/api/v1')
  ? RAW_BACKEND_URL.replace(/\/+$/, '')
  : `${RAW_BACKEND_URL.replace(/\/+$/, '')}/api/v1`

type Translation = {
  label?: string
  language_id?: number
  language?: number
}

type MenuNode = {
  id?: number
  path?: string
  font?: string
  index?: number
  visible?: number
  translations?: Translation[]
  submenus?: MenuNode[]
  tertiary_menus?: MenuNode[]
  quaternary_menus?: MenuNode[]
}

type HeaderStylePayload = {
  id?: number
  bgcolor?: string
  fontcolor?: string
  hovercolor?: string
  height?: number
  sticky?: number
  max_width?: string
  logo_size?: number
}

type HeaderBody = {
  id?: number | null
  logo?: string
  active?: number
  menus?: MenuNode[]
  styles?: HeaderStylePayload[]
  _skipIds?: {
    menus?: number[]
    submenus?: number[]
    tertiary?: number[]
    quaternary?: number[]
  }
}

const EMPTY_HEADER = { id: null, logo: '', active: 1, menus: [], styles: [] }
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results
  }
  return []
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function mapTranslations(translations: Translation[] | undefined, key: 'language' | 'language_id') {
  return (translations || []).map(t => ({
    [key]: t.language_id ?? t.language ?? 2,
    label: t.label || '',
  }))
}

async function responsePreview(res: Response): Promise<string> {
  const text = await res.text().catch(() => '')
  return text.length > 1000 ? `${text.slice(0, 1000)}...` : text
}

async function assertBackendOk(res: Response, label: string) {
  if (!res.ok) {
    throw new Error(`${label}: ${res.status} ${await responsePreview(res)}`)
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  baseDelay = 1500
): Promise<Response> {
  const token = await getAccessToken()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'BichilWebAdmin/1.0',
    'Cache-Control': 'no-cache, no-store',
    Pragma: 'no-cache',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  }

  const retryableStatuses = new Set([429, 500, 502, 503, 504, 520, 521, 522, 523, 524])

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers })
      if (retryableStatuses.has(res.status) && attempt < retries) {
        await delay(baseDelay * Math.pow(2, attempt))
        continue
      }
      return res
    } catch (error) {
      if (attempt < retries) {
        await delay(baseDelay * Math.pow(2, attempt))
        continue
      }
      throw error
    }
  }

  return fetch(url, { ...options, headers })
}

async function getBackendList<T>(endpoint: string): Promise<T[]> {
  const res = await fetchWithRetry(`${BACKEND_URL}/${endpoint}`, { cache: 'no-store' } as RequestInit)
  await assertBackendOk(res, `${endpoint} татахад алдаа`)
  return asList<T>(await res.json())
}

async function sendBackendJson<T>(
  endpoint: string,
  method: 'POST' | 'PUT',
  payload: unknown,
  label: string
): Promise<T> {
  const res = await fetchWithRetry(`${BACKEND_URL}/${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  await assertBackendOk(res, label)
  return (await res.json()) as T
}

async function deleteBackend(endpoint: string, label: string) {
  const res = await fetchWithRetry(`${BACKEND_URL}/${endpoint}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 404) {
    throw new Error(`${label}: ${res.status} ${await responsePreview(res)}`)
  }
}

export async function GET() {
  try {
    const res = await fetchWithRetry(`${BACKEND_URL}/headers/`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    } as RequestInit)

    if (!res.ok) {
      if (res.status === 404) return NextResponse.json(EMPTY_HEADER)
      const errorBody = await responsePreview(res)
      return NextResponse.json({ ...EMPTY_HEADER, _error: `Django ${res.status}: ${errorBody}` })
    }

    const data = await res.json()
    if (data && typeof data === 'object' && 'menus' in data) {
      return NextResponse.json(data)
    }

    const headers = asList<unknown>(data)
    return NextResponse.json(headers[0] || EMPTY_HEADER)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ...EMPTY_HEADER, _error: `Fetch алдаа: ${message}` })
  }
}

async function syncQuaternaryMenus(tertiaryId: number, quaternaryMenus: MenuNode[], skipIds: Set<number>) {
  const existing = await getBackendList<{ id: number }>(`header-quaternary/?tertiary_id=${tertiaryId}`)
  const existingIds = new Set(existing.map(item => item.id))
  const clientIds = new Set<number>()

  for (const item of quaternaryMenus || []) {
    const payload = {
      header_tertiary: tertiaryId,
      path: item.path || '',
      font: item.font || '',
      index: item.index ?? 0,
      visible: item.visible ?? 1,
      translations: mapTranslations(item.translations, 'language_id'),
    }

    const itemId = toNumber(item.id)
    if (itemId && existingIds.has(itemId)) {
      if (skipIds.has(itemId)) {
        clientIds.add(itemId)
      } else {
        await sendBackendJson(`header-quaternary/${itemId}/`, 'PUT', payload, 'Дөрөвдөгч цэс шинэчлэхэд алдаа')
        clientIds.add(itemId)
      }
    } else {
      const created = await sendBackendJson<{ id: number }>('header-quaternary/', 'POST', payload, 'Дөрөвдөгч цэс үүсгэхэд алдаа')
      clientIds.add(created.id)
    }
  }

  for (const item of existing) {
    if (!clientIds.has(item.id)) {
      await deleteBackend(`header-quaternary/${item.id}/`, 'Дөрөвдөгч цэс устгахад алдаа')
    }
  }
}

async function syncTertiaryMenus(submenuId: number, tertiaryMenus: MenuNode[], skipIds: Set<number>, skipQuatIds: Set<number>) {
  const existing = await getBackendList<{ id: number }>(`header-tertiary/?submenu_id=${submenuId}`)
  const existingIds = new Set(existing.map(item => item.id))
  const clientIds = new Set<number>()

  for (const item of tertiaryMenus || []) {
    const payload = {
      header_submenu: submenuId,
      path: item.path || '',
      font: item.font || '',
      index: item.index ?? 0,
      visible: item.visible ?? 1,
      translations: mapTranslations(item.translations, 'language_id'),
    }

    let tertiaryId: number
    const itemId = toNumber(item.id)
    if (itemId && existingIds.has(itemId)) {
      if (skipIds.has(itemId)) {
        tertiaryId = itemId
      } else {
        await sendBackendJson(`header-tertiary/${itemId}/`, 'PUT', payload, 'Гуравдагч цэс шинэчлэхэд алдаа')
        tertiaryId = itemId
      }
    } else {
      const created = await sendBackendJson<{ id: number }>('header-tertiary/', 'POST', payload, 'Гуравдагч цэс үүсгэхэд алдаа')
      tertiaryId = created.id
    }

    clientIds.add(tertiaryId)
    await syncQuaternaryMenus(tertiaryId, item.quaternary_menus || [], skipQuatIds)
  }

  for (const item of existing) {
    if (!clientIds.has(item.id)) {
      await deleteBackend(`header-tertiary/${item.id}/`, 'Гуравдагч цэс устгахад алдаа')
    }
  }
}

async function syncSubmenus(menuId: number, submenus: MenuNode[], skipIds: Set<number>, skipTerIds: Set<number>, skipQuatIds: Set<number>) {
  const existing = await getBackendList<{ id: number }>(`header-submenu/?menu_id=${menuId}`)
  const existingIds = new Set(existing.map(item => item.id))
  const clientIds = new Set<number>()

  for (const item of submenus || []) {
    const payload = {
      header_menu: menuId,
      path: item.path || '',
      font: item.font || '',
      index: item.index ?? 0,
      visible: item.visible ?? 1,
      translations: mapTranslations(item.translations, 'language'),
    }

    let submenuId: number
    const itemId = toNumber(item.id)
    if (itemId && existingIds.has(itemId)) {
      if (skipIds.has(itemId)) {
        submenuId = itemId
      } else {
        await sendBackendJson(`header-submenu/${itemId}/`, 'PUT', payload, 'Дэд цэс шинэчлэхэд алдаа')
        submenuId = itemId
      }
    } else {
      const created = await sendBackendJson<{ id: number }>('header-submenu/', 'POST', payload, 'Дэд цэс үүсгэхэд алдаа')
      submenuId = created.id
    }

    clientIds.add(submenuId)
    await syncTertiaryMenus(submenuId, item.tertiary_menus || [], skipTerIds, skipQuatIds)
  }

  for (const item of existing) {
    if (!clientIds.has(item.id)) {
      await deleteBackend(`header-submenu/${item.id}/`, 'Дэд цэс устгахад алдаа')
    }
  }
}

async function syncMenus(headerId: number, menus: MenuNode[], body: HeaderBody) {
  const skipMenuIds = new Set(body._skipIds?.menus || [])
  const skipSubIds = new Set(body._skipIds?.submenus || [])
  const skipTerIds = new Set(body._skipIds?.tertiary || [])
  const skipQuatIds = new Set(body._skipIds?.quaternary || [])
  const existing = await getBackendList<{ id: number }>(`header-menu/?header_id=${headerId}`)
  const existingIds = new Set(existing.map(item => item.id))
  const clientIds = new Set<number>()

  for (const item of menus || []) {
    const payload = {
      header: headerId,
      path: item.path || '',
      font: item.font || '',
      index: item.index ?? 0,
      visible: item.visible ?? 1,
      translations: mapTranslations(item.translations, 'language'),
    }

    let menuId: number
    const itemId = toNumber(item.id)
    if (itemId && existingIds.has(itemId)) {
      if (skipMenuIds.has(itemId)) {
        menuId = itemId
      } else {
        await sendBackendJson(`header-menu/${itemId}/`, 'PUT', payload, 'Цэс шинэчлэхэд алдаа')
        menuId = itemId
      }
    } else {
      const created = await sendBackendJson<{ id: number }>('header-menu/', 'POST', payload, 'Цэс үүсгэхэд алдаа')
      menuId = created.id
    }

    clientIds.add(menuId)
    await syncSubmenus(menuId, item.submenus || [], skipSubIds, skipTerIds, skipQuatIds)
  }

  for (const item of existing) {
    if (!clientIds.has(item.id)) {
      await deleteBackend(`header-menu/${item.id}/`, 'Цэс устгахад алдаа')
    }
  }
}

async function syncStyle(headerId: number, style?: HeaderStylePayload) {
  if (!style) return

  const existing = await getBackendList<{ id: number; header: number }>('header-style/')
  const matched = existing.find(item => item.header === headerId)
  const payload = {
    header: headerId,
    bgcolor: style.bgcolor || '#ffffff',
    fontcolor: style.fontcolor || '#1f2937',
    hovercolor: style.hovercolor || '#0048BA',
    height: style.height || 80,
    sticky: style.sticky ?? 1,
    max_width: style.max_width || '1240px',
    logo_size: style.logo_size || 44,
  }

  if (matched) {
    await sendBackendJson(`header-style/${matched.id}/`, 'PUT', payload, 'Header style шинэчлэхэд алдаа')
  } else {
    await sendBackendJson('header-style/', 'POST', payload, 'Header style үүсгэхэд алдаа')
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрэх шаардлагатай.' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as HeaderBody
    let headerId = body.id || null

    if (headerId) {
      await sendBackendJson(
        `headers/${headerId}/`,
        'PUT',
        { logo: body.logo || '', active: body.active ?? 1 },
        'Header шинэчлэхэд алдаа'
      )
    } else {
      const created = await sendBackendJson<{ id: number }>(
        'headers/',
        'POST',
        { logo: body.logo || '', active: body.active ?? 1 },
        'Header үүсгэхэд алдаа'
      )
      headerId = created.id
    }

    if (!headerId) {
      throw new Error('Header ID олдсонгүй')
    }

    if (body.menus !== undefined) {
      await syncMenus(headerId, body.menus || [], body)
    }

    await syncStyle(headerId, body.styles?.[0])

    const updatedRes = await fetchWithRetry(`${BACKEND_URL}/headers/${headerId}/`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    } as RequestInit)
    await assertBackendOk(updatedRes, 'Шинэчлэгдсэн header татахад алдаа')

    return NextResponse.json(await updatedRes.json(), { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Тодорхойгүй'
    console.error('Header хадгалахад алдаа:', error)
    return NextResponse.json({ error: `Хадгалахад алдаа: ${message}` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Нэвтрэх шаардлагатай.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ error: 'type болон id параметр шаардлагатай' }, { status: 400 })
    }

    const endpointMap: Record<string, string> = {
      menu: 'header-menu',
      submenu: 'header-submenu',
      tertiary: 'header-tertiary',
      quaternary: 'header-quaternary',
    }

    const endpoint = endpointMap[type]
    if (!endpoint) {
      return NextResponse.json({ error: `Тодорхойгүй төрөл: ${type}` }, { status: 400 })
    }

    await deleteBackend(`${endpoint}/${id}/`, `${type} устгахад алдаа`)
    return NextResponse.json({ success: true, deleted: { type, id: Number(id) } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Тодорхойгүй'
    return NextResponse.json({ error: `Устгахад алдаа: ${message}` }, { status: 500 })
  }
}
