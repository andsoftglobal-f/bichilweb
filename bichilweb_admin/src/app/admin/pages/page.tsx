/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { PageHeader } from '@/components/FormElements'
import {
  PlusIcon, TrashIcon, PencilIcon, EyeIcon, EyeSlashIcon,
  DocumentDuplicateIcon, ArrowLeftIcon, LinkIcon, DocumentTextIcon,
  PhotoIcon, VideoCameraIcon, CodeBracketIcon, ListBulletIcon,
  ChatBubbleBottomCenterTextIcon, ViewColumnsIcon,
  SparklesIcon, Bars3BottomLeftIcon, CursorArrowRaysIcon,
  ArrowsUpDownIcon, MinusIcon, CloudArrowUpIcon,
  ArrowPathIcon, ChevronDownIcon, ChevronUpIcon,
  Squares2X2Icon, MagnifyingGlassIcon, PaperClipIcon,
} from '@heroicons/react/24/outline'
import { axiosInstance } from '@/lib/axios'
import { FONT_OPTIONS, getFontStyle } from '@/lib/fontOptions'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type BlockType = 'heading' | 'text' | 'image' | 'video' | 'button' | 'spacer' | 'divider' | 'banner' | 'columns' | 'html' | 'list' | 'quote' | 'attachment' | 'filelink'

interface Block {
  id: string
  type: BlockType
  content: Record<string, unknown>
  style: Record<string, string>
}

interface ApiTranslation {
  id?: number
  language: number
  label: string
  font?: string
  family?: string
  weight?: string
  size?: string
}

interface ApiPage {
  id: number
  url: string
  active: boolean
  image: string | null
  content_blocks: string | null
  title_translations: ApiTranslation[]
  description_translations: ApiTranslation[]
}

interface PageSettings {
  url: string
  title_mn: string
  title_en: string
  description_mn: string
  description_en: string
  active: boolean
  image: string
}

interface LayoutSettings {
  maxWidth: string
  fullWidth: boolean
  pagePaddingTop: string
  pagePaddingBottom: string
  pagePaddingLeft: string
  pagePaddingRight: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const BLOCK_DEFS: { type: BlockType; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; desc: string; color: string }[] = [
  { type: 'heading', label: 'Гарчиг', icon: Bars3BottomLeftIcon, desc: 'H1-H4 гарчиг', color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { type: 'text', label: 'Текст', icon: DocumentTextIcon, desc: 'Текст параграф', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { type: 'image', label: 'Зураг', icon: PhotoIcon, desc: 'Зураг нэмэх', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { type: 'video', label: 'Видео', icon: VideoCameraIcon, desc: 'YouTube видео', color: 'text-red-600 bg-red-50 border-red-200' },
  { type: 'button', label: 'Товч', icon: CursorArrowRaysIcon, desc: 'CTA товч', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { type: 'spacer', label: 'Зай', icon: ArrowsUpDownIcon, desc: 'Хоосон зай', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { type: 'divider', label: 'Зураас', icon: MinusIcon, desc: 'Хэвтээ шугам', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { type: 'banner', label: 'Баннер', icon: SparklesIcon, desc: 'Баннер зураг', color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { type: 'columns', label: 'Багана', icon: ViewColumnsIcon, desc: '2-3 багана', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { type: 'html', label: 'HTML', icon: CodeBracketIcon, desc: 'HTML код', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { type: 'list', label: 'Жагсаалт', icon: ListBulletIcon, desc: 'Жагсаалт', color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { type: 'quote', label: 'Ишлэл', icon: ChatBubbleBottomCenterTextIcon, desc: 'Ишлэл', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { type: 'attachment', label: 'Файл', icon: PaperClipIcon, desc: 'PDF, DOC, ZIP хавсаргах', color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { type: 'filelink', label: 'Файл-линк', icon: LinkIcon, desc: 'Файл оруулаад URL авах (харагдахгүй)', color: 'text-rose-600 bg-rose-50 border-rose-200' },
]

const DEFAULT_BLOCK_WIDTH: Record<BlockType, number> = {
  heading: 700, text: 700, image: 500, video: 640, button: 220,
  spacer: 700, divider: 700, banner: 900, columns: 800,
  html: 700, list: 600, quote: 600,
  attachment: 420,
  filelink: 420,
}

const getFileDisplayName = (url?: string, fallback?: string) => {
  if (fallback) return fallback
  if (!url) return ''
  const cleanUrl = url.split('?')[0]
  const name = cleanUrl.split('/').pop() || ''
  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}

const getBackendOrigin = () => {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'
  try {
    const parsed = new URL(api)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return 'http://127.0.0.1:8000'
  }
}

const resolvePageAssetUrl = (url?: string) => {
  if (!url) return ''
  const raw = url.trim()
  if (!raw) return ''
  // Blob URLs are temporary local URLs and should never be used as persisted file links.
  if (raw.startsWith('blob:')) return ''
  if (raw.startsWith('data:')) return raw

  const backendOrigin = getBackendOrigin()

  // Handles values like "localhost:8000/media/file.pdf"
  if (/^localhost:\d+/i.test(raw)) {
    return resolvePageAssetUrl(`http://${raw}`)
  }

  // Handles protocol-relative URLs like //host/path
  if (raw.startsWith('//')) {
    return resolvePageAssetUrl(`http:${raw}`)
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw)
      // If DB stored admin/frontend host, force backend origin for static files
      if ((parsed.host.includes('localhost:3001') || parsed.host.includes('localhost:3000')) && (parsed.pathname.startsWith('/media/') || parsed.pathname.startsWith('/uploads/'))) {
        return `${backendOrigin}${parsed.pathname}${parsed.search || ''}`
      }
      return raw
    } catch {
      return raw
    }
  }

  const origin = getBackendOrigin()
  return `${origin}${raw.startsWith('/') ? '' : '/'}${raw}`
}

const openFileForView = async (url: string) => {
  const resolved = resolvePageAssetUrl(url)
  if (!resolved) return
  window.open(resolved, '_blank', 'noopener,noreferrer')
}

const buildHtmlSrcDoc = (code?: string, extraCss = '') => {
  const raw = (code || '').trim()
  if (!raw) return ''
  if (/<html[\s>]/i.test(raw)) {
    if (!extraCss) return raw
    if (/<\/head>/i.test(raw)) return raw.replace(/<\/head>/i, `<style>${extraCss}</style></head>`)
    return raw.replace(/<html[^>]*>/i, m => `${m}<head><style>${extraCss}</style></head>`)
  }
  return `<!doctype html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />${extraCss ? `<style>${extraCss}</style>` : ''}</head><body>${raw}</body></html>`
}

const getHtmlImageStyleKey = (index: number) => index <= 1 ? 'htmlImageUrl' : `htmlImageUrl${index}`

const getHtmlImageSlotCount = (code?: string) => {
  const raw = code || ''
  const placeholderRe = /\{\{\s*IMAGE_URL(?:_(\d+))?\s*\}\}/gi
  let m: RegExpExecArray | null
  let maxIndex = 0
  while ((m = placeholderRe.exec(raw)) !== null) {
    const idx = m[1] ? parseInt(m[1], 10) : 1
    if (idx > maxIndex) maxIndex = idx
  }
  if (maxIndex > 0) return maxIndex

  const iconMatches = raw.match(/class\s*=\s*['"][^'"]*\bicon\b[^'"]*['"]/gi)
  return iconMatches ? Math.min(iconMatches.length, 12) : 0
}

const getHtmlImageStyleValue = (style: Record<string, string>, index: number) => {
  if (index <= 1) return style.htmlImageUrl || ''
  return style[getHtmlImageStyleKey(index)] || ''
}

const applyHtmlTemplate = (code: string, style: Record<string, string>) => {
  return code.replace(/\{\{\s*IMAGE_URL(?:_(\d+))?\s*\}\}/gi, (_m, idxRaw: string) => {
    const idx = idxRaw ? parseInt(idxRaw, 10) : 1
    return getHtmlImageStyleValue(style, idx)
  })
}

const buildHtmlImageOverrideCssByCode = (code: string, style: Record<string, string>) => {
  const hasPlaceholder = /\{\{\s*IMAGE_URL(?:_\d+)?\s*\}\}/i.test(code)
  if (hasPlaceholder) return ''

  const slotCount = getHtmlImageSlotCount(code)
  if (!slotCount) return ''

  let css = ''
  for (let i = 1; i <= slotCount; i += 1) {
    const url = getHtmlImageStyleValue(style, i).trim()
    if (!url) continue
    const safeUrl = url.replace(/'/g, "\\'")
    css += `.item:nth-of-type(${i}) .icon{background-image:url('${safeUrl}') !important;background-size:cover !important;background-position:center !important;background-repeat:no-repeat !important;color:transparent !important;}`
  }
  return css
}

const getHtmlButtonStyleKey = (index: number) => index <= 1 ? 'htmlButtonLink' : `htmlButtonLink${index}`

const getSequentialPlaceholderIndices = (raw: string, token: 'BUTTON_LINK' | 'IMAGE_URL') => {
  const placeholderRe = new RegExp(`\\{\\{\\s*${token}(?:_(\\d+))?\\s*\\}\\}`, 'gi')
  const indices: number[] = []
  let m: RegExpExecArray | null
  let nextImplicitIndex = 1
  while ((m = placeholderRe.exec(raw)) !== null) {
    if (m[1]) {
      const explicitIndex = parseInt(m[1], 10)
      indices.push(explicitIndex)
      if (explicitIndex >= nextImplicitIndex) nextImplicitIndex = explicitIndex + 1
      continue
    }
    indices.push(nextImplicitIndex)
    nextImplicitIndex += 1
  }
  return indices
}

const getHtmlButtonSlotCount = (code?: string) => {
  const raw = code || ''
  const placeholderIndices = getSequentialPlaceholderIndices(raw, 'BUTTON_LINK')
  if (placeholderIndices.length > 0) {
    return Math.min(Math.max(...placeholderIndices), 12)
  }
  const buttonClassMatches = raw.match(/class\s*=\s*['"][^'"]*\b(btn|button)\b[^'"]*['"]/gi)
  const anchorMatches = raw.match(/<a\b/gi)
  const buttonTagMatches = raw.match(/<button\b/gi)
  const fallbackCount = Math.max(
    buttonClassMatches?.length || 0,
    (anchorMatches?.length || 0) + (buttonTagMatches?.length || 0),
  )
  return fallbackCount ? Math.min(fallbackCount, 12) : 0
}

const getHtmlButtonStyleValue = (style: Record<string, string>, index: number) => {
  if (index <= 1) return style.htmlButtonLink || ''
  return style[getHtmlButtonStyleKey(index)] || ''
}

const applyHtmlButtonLinks = (code: string, style: Record<string, string>) => {
  let nextImplicitIndex = 1
  return code.replace(/\{\{\s*BUTTON_LINK(?:_(\d+))?\s*\}\}/gi, (_m, idxRaw: string) => {
    const idx = idxRaw ? parseInt(idxRaw, 10) : nextImplicitIndex++
    return getHtmlButtonStyleValue(style, idx)
  })
}

const getHtmlCodeForLanguage = (content: Record<string, string>, lang = 'mn') => {
  const legacyCode = content.code || ''
  const mnCode = content.code_mn || legacyCode
  if (lang === 'mn') return mnCode || content.code_en || ''
  return content.code_en || mnCode || legacyCode
}

const getHtmlCodeVariants = (content: Record<string, string>) => {
  const variants = [content.code_mn || content.code || '', content.code_en || ''].filter(Boolean)
  return variants.length > 0 ? variants : ['']
}

const getSharedHtmlImageSlotCount = (content: Record<string, string>) => (
  Math.max(...getHtmlCodeVariants(content).map(code => getHtmlImageSlotCount(code)))
)

const getSharedHtmlButtonSlotCount = (content: Record<string, string>) => (
  Math.max(...getHtmlCodeVariants(content).map(code => getHtmlButtonSlotCount(code)))
)

const isLikelyDirectImageUrl = (value?: string) => {
  const raw = (value || '').trim()
  if (!raw) return true
  if (raw.startsWith('data:image/')) return true
  const pattern = /\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i
  if (pattern.test(raw)) return true
  try {
    const u = new URL(raw)
    return pattern.test(u.pathname)
  } catch {
    return false
  }
}

const isInteractiveTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  if (!el) return false
  return Boolean(el.closest('a,button,input,textarea,select,label,[contenteditable="true"],[data-no-drag="true"]'))
}

const RESIZE_HANDLES = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] as const

const genId = () => `b_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`

const defaultContent = (type: BlockType): Record<string, unknown> => {
  const map: Record<BlockType, Record<string, unknown>> = {
    heading: { text_mn: '', text_en: '', level: 'h2' },
    text: { text_mn: '', text_en: '' },
    image: { url: '', alt: '', caption_mn: '', caption_en: '' },
    video: { url: '' },
    button: { text_mn: 'Дэлгэрэнгүй', text_en: 'Learn More', url: '', variant: 'primary' },
    spacer: { height: '40' },
    divider: { color: '#e5e7eb', thickness: '1' },
    banner: { imageUrl: '', title_mn: '', title_en: '', subtitle_mn: '', subtitle_en: '', overlayOpacity: '40', height: '400' },
    columns: { count: '2', gap: '24', col1_mn: '', col1_en: '', col2_mn: '', col2_en: '', col3_mn: '', col3_en: '' },
    html: { code: '', code_mn: '', code_en: '' },
    list: { items_mn: '', items_en: '', listType: 'bullet' },
    quote: { text_mn: '', text_en: '', author: '' },
    attachment: { url: '', file_name: '', title_mn: '', title_en: '', description_mn: '', description_en: '', button_mn: 'Файл татах', button_en: 'Download file', openInNewTab: 'true', buttonAction: 'download', icon_url: '', buttonPosition: 'left' },
    filelink: { url: '', file_name: '' },
  }
  return map[type] || {}
}

const defaultLayout = (): LayoutSettings => ({
  maxWidth: '1200', fullWidth: false,
  pagePaddingTop: '0', pagePaddingBottom: '0',
  pagePaddingLeft: '0', pagePaddingRight: '0',
})

const uploadFile = async (file: File, pageUrl?: string): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  if (pageUrl?.trim()) {
    formData.append('page_slug', pageUrl.trim())
  }
  try {
    const res = await fetch('/api/proxy/upload/', { method: 'POST', body: formData })
    if (res.ok) {
      const data = await res.json()
      return data.url || data.file_url || ''
    }
  } catch (e) { console.warn('Upload error:', e) }
  return ''
}

interface PageImage {
  blockId: string
  blockType: string
  field: string
  url: string
  displayName?: string
}

const getAllBlockImages = (blocks: Block[]): PageImage[] => {
  const images: PageImage[] = []
  blocks.forEach(block => {
    const c = block.content as Record<string, any>
    switch (block.type) {
      case 'image':
        if (c.url) images.push({ blockId: block.id, blockType: 'image', field: 'Image', url: c.url })
        break
      case 'banner':
        if (c.imageUrl) images.push({ blockId: block.id, blockType: 'banner', field: 'Banner Image', url: c.imageUrl })
        break
      case 'attachment':
        if (c.url) images.push({ blockId: block.id, blockType: 'attachment', field: 'Attachment File', url: c.url, displayName: c.file_name })
        if (c.icon_url) images.push({ blockId: block.id, blockType: 'attachment', field: 'Attachment Icon', url: c.icon_url })
        break
      case 'html':
        const style = block.style as Record<string, string>
        const slotCount = getSharedHtmlImageSlotCount(c)
        for (let i = 1; i <= slotCount; i += 1) {
          const key = getHtmlImageStyleKey(i)
          const url = (style[key] || '').trim()
          if (url) images.push({ blockId: block.id, blockType: 'html', field: `HTML Image ${i}`, url })
        }
        break
    }
  })
  return images
}

const deleteImage = async (blockId: string, field: string, blocks: Block[], setBlocks: (b: Block[]) => void) => {
  const block = blocks.find(b => b.id === blockId)
  if (!block) return
  
  const c = block.content as Record<string, any>
  let updated = false
  
  if (block.type === 'image' && field === 'Image') {
    c.url = ''
    updated = true
  } else if (block.type === 'banner' && field === 'Banner Image') {
    c.imageUrl = ''
    updated = true
  } else if (block.type === 'attachment' && field === 'Attachment File') {
    c.url = ''
    updated = true
  } else if (block.type === 'attachment' && field === 'Attachment Icon') {
    c.icon_url = ''
    updated = true
  } else if (block.type === 'html' && field.startsWith('HTML Image')) {
    const s = block.style as Record<string, string>
    const idx = parseInt(field.replace('HTML Image ', ''), 10)
    const key = getHtmlImageStyleKey(idx)
    s[key] = ''
    updated = true
  }
  
  if (updated) {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, content: c } : b))
  }
}

const defaultStyle = (): Record<string, string> => ({
  textAlign: 'left', backgroundColor: '', textColor: '',
  paddingTop: '16', paddingBottom: '16', paddingLeft: '0', paddingRight: '0',
  borderRadius: '0', fontSize: '', fontFamily: '', fontWeight: '',
  posX: '50', posY: '50', width: '600', height: '', zIndex: '1',
})

const getTrans = (t: ApiTranslation[], lang: number) => t.find(x => x.language === lang) || { language: lang, label: '' }

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE SETTING FIELDS
// ═══════════════════════════════════════════════════════════════════════════════

function SInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-300" />
    </div>
  )
}

function STextarea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide">{label}</label>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all resize-none placeholder:text-slate-300" />
    </div>
  )
}

function SSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide">{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCK PREVIEW RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

function RenderBlock({ block, lang = 'mn' }: { block: Block; lang?: string }) {
  const c = block.content as Record<string, string>
  const s = block.style
  const wrap: React.CSSProperties = {
    textAlign: (s.textAlign as React.CSSProperties['textAlign']) || 'left',
    backgroundColor: s.backgroundColor || undefined,
    color: s.textColor || undefined,
    paddingTop: `${s.paddingTop || 16}px`, paddingBottom: `${s.paddingBottom || 16}px`,
    paddingLeft: `${s.paddingLeft || 0}px`, paddingRight: `${s.paddingRight || 0}px`,
    borderRadius: `${s.borderRadius || 0}px`,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    ...getFontStyle(s.fontFamily),
    fontWeight: (s.fontWeight as React.CSSProperties['fontWeight']) || getFontStyle(s.fontFamily).fontWeight || undefined,
  }

  switch (block.type) {
    case 'heading': {
      const text = lang === 'mn' ? c.text_mn : c.text_en
      const sizes: Record<string, string> = { h1: '2.5rem', h2: '2rem', h3: '1.5rem', h4: '1.25rem' }
      return <div style={wrap}><div style={{ fontSize: sizes[c.level] || '2rem', fontWeight: 'bold', lineHeight: 1.2 }}>{text || `[${(c.level || 'h2').toUpperCase()} гарчиг]`}</div></div>
    }
    case 'text': {
      const text = lang === 'mn' ? c.text_mn : c.text_en
      return <div style={wrap}><div className="whitespace-pre-wrap leading-relaxed">{text || '[Текст оруулна уу]'}</div></div>
    }
    case 'image':
      return (
        <div style={wrap}>
          {c.url ? (
            <div>
              <img src={c.url} alt={c.alt || ''} className="max-w-full h-auto rounded-lg" />
              {(lang === 'mn' ? c.caption_mn : c.caption_en) && <p className="text-sm text-gray-500 mt-2 text-center">{lang === 'mn' ? c.caption_mn : c.caption_en}</p>}
            </div>
          ) : (
            <div className="bg-linear-to-br from-slate-50 to-slate-100 h-48 rounded-xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
              <PhotoIcon className="h-10 w-10 mb-2 opacity-40" />
              <span className="text-sm">Зургийн URL оруулна уу</span>
            </div>
          )}
        </div>
      )
    case 'video': {
      const match = (c.url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
      const ytId = match ? match[1] : null
      const isFile = c._isFile || (c.url && !c.url.includes('youtube') && !c.url.includes('youtu.be'))
      return (
        <div style={wrap}>
          {ytId ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe src={`https://www.youtube.com/embed/${ytId}`} className="absolute inset-0 w-full h-full rounded-xl" allowFullScreen />
            </div>
          ) : isFile && c.url ? (
            <video src={c.url} controls className="w-full rounded-xl" style={{ maxHeight: '400px' }} />
          ) : (
            <div className="bg-linear-to-br from-slate-50 to-slate-100 h-48 rounded-xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
              <VideoCameraIcon className="h-10 w-10 mb-2 opacity-40" />
              <span className="text-sm">Видео URL эсвэл файл оруулна уу</span>
            </div>
          )}
        </div>
      )
    }
    case 'button': {
      const text = lang === 'mn' ? c.text_mn : c.text_en
      const variants: Record<string, string> = {
        primary: 'bg-blue-600 text-white shadow-lg shadow-blue-200',
        secondary: 'bg-slate-100 text-slate-800',
        outline: 'border-2 border-blue-600 text-blue-600',
      }
      return <div style={wrap}><span className={`inline-block px-6 py-3 rounded-xl font-semibold text-sm ${variants[c.variant] || variants.primary}`}>{text || 'Товч'}</span></div>
    }
    case 'spacer':
      return <div style={{ height: `${c.height || 40}px` }} className="flex items-center justify-center"><div className="w-24 border-t-2 border-dashed border-slate-200" /></div>
    case 'divider':
      return <div style={wrap}><hr style={{ border: 'none', borderTop: `${c.thickness || 1}px solid ${c.color || '#e5e7eb'}`, margin: 0 }} /></div>
    case 'banner':
      return (
        <div style={{ ...wrap, position: 'relative', height: `${c.height || 400}px`, overflow: 'hidden', borderRadius: `${s.borderRadius || 12}px` }}>
          {c.imageUrl ? <img src={c.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700" />}
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(parseInt(c.overlayOpacity) || 40) / 100})` }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{(lang === 'mn' ? c.title_mn : c.title_en) || '[Баннер гарчиг]'}</h2>
            {(lang === 'mn' ? c.subtitle_mn : c.subtitle_en) && <p className="text-lg md:text-xl opacity-90">{lang === 'mn' ? c.subtitle_mn : c.subtitle_en}</p>}
          </div>
        </div>
      )
    case 'columns': {
      const n = parseInt(c.count) || 2
      const cols = n >= 3
        ? [c.col1_mn || c.col1_en, c.col2_mn || c.col2_en, c.col3_mn || c.col3_en]
        : [c.col1_mn || c.col1_en, c.col2_mn || c.col2_en]
      return (
        <div style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: `${c.gap || 24}px` }}>
            {cols.map((col, i) => <div key={i} className="whitespace-pre-wrap p-4 bg-slate-50 rounded-lg min-h-[60px]">{col || `[Багана ${i + 1}]`}</div>)}
          </div>
        </div>
      )
    }
    case 'html': {
      const rawHtmlCode = getHtmlCodeForLanguage(c, lang)
      if (!rawHtmlCode) {
        return <div style={wrap} dangerouslySetInnerHTML={{ __html: '<p style="color:#94a3b8;text-align:center">[HTML код оруулна уу]</p>' }} />
      }
      const iframeHeight = Math.max(parseInt(s.height || c.height || '0') || 0, 260)
      let htmlCode = applyHtmlTemplate(rawHtmlCode, s)
      htmlCode = applyHtmlButtonLinks(htmlCode, s)
      const extraCss = buildHtmlImageOverrideCssByCode(htmlCode, s)
      return (
        <div style={wrap}>
          <iframe
            title="HTML preview"
            srcDoc={buildHtmlSrcDoc(htmlCode, extraCss)}
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation"
            className="w-full rounded-lg border border-slate-200 bg-white"
            style={{ height: `${iframeHeight}px`, display: 'block' }}
          />
        </div>
      )
    }
    case 'list': {
      const items = ((lang === 'mn' ? c.items_mn : c.items_en) || '').split('\n').filter(Boolean)
      const Tag = c.listType === 'numbered' ? 'ol' : 'ul'
      return (
        <div style={wrap}>
          <Tag className={c.listType === 'numbered' ? 'list-decimal pl-6 space-y-1.5' : 'list-disc pl-6 space-y-1.5'}>
            {items.length > 0 ? items.map((x: string, i: number) => <li key={i}>{x}</li>) : <li className="text-slate-400">[Жагсаалт оруулна уу]</li>}
          </Tag>
        </div>
      )
    }
    case 'quote': {
      const text = lang === 'mn' ? c.text_mn : c.text_en
      return (
        <div style={wrap}>
          <blockquote className="border-l-4 border-blue-500 pl-6 py-3 italic text-lg text-slate-600 bg-blue-50/50 rounded-r-lg">
            <p>&ldquo;{text || 'Ишлэл оруулна уу'}&rdquo;</p>
            {c.author && <footer className="mt-3 text-sm font-semibold text-slate-500 not-italic">— {c.author}</footer>}
          </blockquote>
        </div>
      )
    }
    case 'attachment': {
      const title = lang === 'mn' ? c.title_mn : c.title_en
      const description = lang === 'mn' ? c.description_mn : c.description_en
      const button = lang === 'mn' ? c.button_mn : c.button_en
      const fileUrl = resolvePageAssetUrl(c.url)
      const fileName = getFileDisplayName(c.url, c.file_name)
      const btnPos = c.buttonPosition || 'left'
      const btnJustify = btnPos === 'center' ? 'justify-center' : btnPos === 'right' ? 'justify-end' : 'justify-start'
      const isView = c.buttonAction === 'view'
      const openNew = (c.openInNewTab || 'true') === 'true'
      const iconWrapClass = c.icon_url ? 'h-20 w-20 rounded-2xl' : 'h-12 w-12 rounded-xl'
      return (
        <div style={wrap}>
          <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 to-white p-5">
            <div className="flex items-start gap-4">
              <div className={`flex shrink-0 items-center justify-center bg-sky-100 text-sky-600 overflow-hidden ${iconWrapClass}`}>
                {c.icon_url
                  ? <img src={c.icon_url} alt="" className="h-full w-full object-cover" />
                  : <PaperClipIcon className="h-6 w-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold text-slate-900">{title || fileName || 'Файл хавсралт'}</div>
                {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
                <div className={`mt-4 flex ${btnJustify}`}>
                  {fileUrl ? (
                    isView ? (
                      <button
                        type="button"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={async e => {
                          e.stopPropagation()
                          await openFileForView(fileUrl)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                        {button || 'Файл үзэх'}
                      </button>
                    ) : (
                      <a
                        href={fileUrl}
                        target={openNew ? '_blank' : undefined}
                        rel={openNew ? 'noreferrer' : undefined}
                        download={c.file_name || true}
                        onMouseDown={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        {button || 'Файл татах'}
                      </a>
                    )
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-400 px-4 py-2 text-sm font-semibold text-white opacity-80">{button || 'Файл татах'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
    case 'filelink': {
      const fileUrl = resolvePageAssetUrl(c.url)
      const fileName = getFileDisplayName(c.url, c.file_name)
      return (
        <div style={wrap}>
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-3 flex items-center gap-3">
            <EyeSlashIcon className="h-5 w-5 text-rose-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-rose-600">Файл-линк блок (хэрэглэгчид харагдахгүй)</p>
              {fileUrl ? (
                <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">{fileName || fileUrl}</p>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">Файл сонгоогүй байна</p>
              )}
            </div>
          </div>
        </div>
      )
    }
    default:
      return <div style={wrap} className="text-slate-400">[Тодорхойгүй блок: {block.type}]</div>
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTML BLOCK CONTENT EDITOR (with device preview)
// ═══════════════════════════════════════════════════════════════════════════════

function HtmlBlockContentEditor({ block, onChange }: { block: Block; onChange: (u: Record<string, unknown>) => void }) {
  const c = block.content as Record<string, string>
  const s = block.style as Record<string, string>
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewLang, setPreviewLang] = useState<'mn' | 'en'>('mn')
  const [showLivePreview, setShowLivePreview] = useState(false)

  const deviceWidth = device === 'mobile' ? 390 : device === 'tablet' ? 768 : undefined
  const iframeHeight = Math.max(parseInt(s.height || c.height || '0') || 0, 260)
  const mnCode = c.code_mn || c.code || ''
  const enCode = c.code_en || ''
  let htmlCode = applyHtmlTemplate(getHtmlCodeForLanguage(c, previewLang), s)
  htmlCode = applyHtmlButtonLinks(htmlCode, s)
  const extraCss = buildHtmlImageOverrideCssByCode(htmlCode, s)
  const srcDoc = buildHtmlSrcDoc(htmlCode, extraCss)

  return (
    <div className="space-y-3">
      <STextarea label="HTML код (MN)" value={mnCode} onChange={v => onChange({ code_mn: v, code: v })} placeholder="<div>...</div>" rows={8} />
      <STextarea label="HTML code (EN)" value={enCode} onChange={v => onChange({ code_en: v })} placeholder="<div>English HTML...</div>" rows={8} />
      <p className="text-[11px] text-slate-500">Зураг болон товчны placeholder тохиргоо нь MN/EN HTML-д нэг shared байдлаар ашиглагдана.</p>

      {/* Live preview toggle */}
      <button
        type="button"
        onClick={() => setShowLivePreview(p => !p)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${showLivePreview ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
      >
        <span>{showLivePreview ? 'Preview нуух' : 'Device Preview харах'}</span>
        {showLivePreview ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
      </button>

      {showLivePreview && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {/* Device toggle bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200">
            <div className="flex gap-0.5 p-0.5 bg-white rounded-lg shadow-sm">
              <button type="button" onClick={() => setDevice('desktop')}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-all ${device === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                Desktop
              </button>
              <button type="button" onClick={() => setDevice('tablet')}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-all ${device === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>
                Tablet
              </button>
              <button type="button" onClick={() => setDevice('mobile')}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-all ${device === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>
                Утас
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 p-0.5 bg-white rounded-lg shadow-sm">
                <button type="button" onClick={() => setPreviewLang('mn')}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all ${previewLang === 'mn' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                  MN
                </button>
                <button type="button" onClick={() => setPreviewLang('en')}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all ${previewLang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                  EN
                </button>
              </div>
              <span className="text-[10px] text-slate-400">
                {device === 'mobile' ? '390px' : device === 'tablet' ? '768px' : 'Бүтэн'}
              </span>
            </div>
          </div>

          {/* Iframe preview with device constraint */}
          <div className="bg-slate-50 p-3 overflow-auto">
            <div
              className="mx-auto bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300"
              style={deviceWidth ? { width: `${deviceWidth}px` } : { width: '100%' }}
            >
              <iframe
                title="HTML device preview"
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation"
                className="w-full block"
                style={{ height: `${iframeHeight}px` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCK CONTENT EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

function BlockContentEditor({ block, onChange, pageUrl }: { block: Block; onChange: (u: Record<string, unknown>) => void; pageUrl?: string }) {
  const c = block.content as Record<string, string>
  const u = onChange
  const fileUploadBox = (accept: string, onFile: (f: File) => void, label: string) => (
    <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group">
      <input type="file" accept={accept} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      <CloudArrowUpIcon className="h-8 w-8 text-slate-300 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
      <p className="text-xs text-slate-400 group-hover:text-blue-500">{label}</p>
    </div>
  )
  const modeToggle = (current: string, modes: { v: string; l: string }[], key = '_inputMode') => (
    <div className="flex gap-1 mb-3 p-0.5 bg-slate-100 rounded-lg">
      {modes.map(t => (
        <button type="button" key={t.v} onClick={() => u({ [key]: t.v })}
          className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all ${(current || modes[0].v) === t.v ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          {t.l}
        </button>
      ))}
    </div>
  )

  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-3">
          <SSelect label="Түвшин" value={c.level} options={[{ value: 'h1', label: 'H1 — Том гарчиг' }, { value: 'h2', label: 'H2 — Дунд гарчиг' }, { value: 'h3', label: 'H3 — Жижиг гарчиг' }, { value: 'h4', label: 'H4 — Дэд гарчиг' }]} onChange={v => u({ level: v })} />
          <SInput label="🇲🇳 Гарчиг (MN)" value={c.text_mn} onChange={v => u({ text_mn: v })} placeholder="Монгол гарчиг" />
          <SInput label="🇺🇸 Heading (EN)" value={c.text_en} onChange={v => u({ text_en: v })} placeholder="English heading" />
        </div>
      )
    case 'text':
      return (
        <div className="space-y-3">
          <STextarea label="🇲🇳 Текст (MN)" value={c.text_mn} onChange={v => u({ text_mn: v })} placeholder="Монгол текст..." rows={5} />
          <STextarea label="🇺🇸 Text (EN)" value={c.text_en} onChange={v => u({ text_en: v })} placeholder="English text..." rows={5} />
        </div>
      )
    case 'image':
      return (
        <div className="space-y-3">
          {modeToggle(c._inputMode, [{ v: 'url', l: 'URL оруулах' }, { v: 'upload', l: 'Файл оруулах' }])}
          {(c._inputMode || 'url') === 'url'
            ? <SInput label="Зургийн URL" value={c.url} onChange={v => u({ url: v })} placeholder="https://..." />
            : fileUploadBox('image/*', async f => { const url = await uploadFile(f, pageUrl); u({ url }) }, 'Зураг чирж тавих')
          }
          <SInput label="Alt текст" value={c.alt} onChange={v => u({ alt: v })} placeholder="Зургийн тайлбар" />
          <SInput label="🇲🇳 Тайлбар (MN)" value={c.caption_mn} onChange={v => u({ caption_mn: v })} />
          <SInput label="🇺🇸 Caption (EN)" value={c.caption_en} onChange={v => u({ caption_en: v })} />
          {c.url && <img src={c.url} alt={c.alt} className="w-full h-28 object-cover rounded-lg border border-slate-200" />}
        </div>
      )
    case 'video':
      return (
        <div className="space-y-3">
          {modeToggle(c._inputMode, [{ v: 'url', l: 'YouTube URL' }, { v: 'upload', l: 'Файл оруулах' }])}
          {(c._inputMode || 'url') === 'url'
            ? <SInput label="YouTube URL" value={c.url} onChange={v => u({ url: v })} placeholder="https://youtube.com/watch?v=..." />
            : fileUploadBox('video/*', async f => { const url = await uploadFile(f, pageUrl); u({ url, _isFile: true }) }, 'Видео файл сонгох')
          }
          {c.url && c._isFile && <p className="text-xs text-emerald-600 font-medium">✓ Видео файл оруулсан</p>}
        </div>
      )
    case 'button':
      return (
        <div className="space-y-3">
          <SInput label="🇲🇳 Товч текст (MN)" value={c.text_mn} onChange={v => u({ text_mn: v })} placeholder="Дэлгэрэнгүй" />
          <SInput label="🇺🇸 Button text (EN)" value={c.text_en} onChange={v => u({ text_en: v })} placeholder="Learn More" />
          <SInput label="Холбоос URL" value={c.url} onChange={v => u({ url: v })} placeholder="https://..." />
          <SSelect label="Хэв маяг" value={c.variant} options={[{ value: 'primary', label: 'Primary (Үндсэн)' }, { value: 'secondary', label: 'Secondary (Дэд)' }, { value: 'outline', label: 'Outline (Хүрээтэй)' }]} onChange={v => u({ variant: v })} />
        </div>
      )
    case 'spacer':
      return (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2">Өндөр ({c.height || 40}px)</label>
          <input type="range" min="10" max="200" value={c.height || 40} onChange={e => u({ height: e.target.value })} className="w-full accent-blue-600" />
        </div>
      )
    case 'divider':
      return (
        <div className="space-y-3">
          <SInput label="Өнгө" value={c.color} onChange={v => u({ color: v })} placeholder="#e5e7eb" />
          <SSelect label="Зузаан" value={c.thickness} options={[{ value: '1', label: '1px' }, { value: '2', label: '2px' }, { value: '3', label: '3px' }, { value: '4', label: '4px' }]} onChange={v => u({ thickness: v })} />
        </div>
      )
    case 'banner':
      return (
        <div className="space-y-3">
          {modeToggle(c._inputMode, [{ v: 'url', l: 'URL оруулах' }, { v: 'upload', l: 'Файл оруулах' }])}
          {(c._inputMode || 'url') === 'url'
            ? <SInput label="Зургийн URL" value={c.imageUrl} onChange={v => u({ imageUrl: v })} placeholder="https://..." />
            : fileUploadBox('image/*', async f => { const url = await uploadFile(f, pageUrl); u({ imageUrl: url }) }, 'Баннер зураг сонгох')
          }
          {c.imageUrl && <img src={c.imageUrl} alt="" className="w-full h-20 object-cover rounded-lg border border-slate-200" />}
          <SInput label="🇲🇳 Гарчиг (MN)" value={c.title_mn} onChange={v => u({ title_mn: v })} />
          <SInput label="🇺🇸 Title (EN)" value={c.title_en} onChange={v => u({ title_en: v })} />
          <SInput label="🇲🇳 Дэд гарчиг (MN)" value={c.subtitle_mn} onChange={v => u({ subtitle_mn: v })} />
          <SInput label="🇺🇸 Subtitle (EN)" value={c.subtitle_en} onChange={v => u({ subtitle_en: v })} />
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Бүдгэрэлт ({c.overlayOpacity || 40}%)</label>
            <input type="range" min="0" max="100" value={c.overlayOpacity || 40} onChange={e => u({ overlayOpacity: e.target.value })} className="w-full accent-blue-600" />
          </div>
          <SInput label="Өндөр (px)" value={c.height} onChange={v => u({ height: v })} placeholder="400" />
        </div>
      )
    case 'columns':
      return (
        <div className="space-y-3">
          <SSelect label="Баганы тоо" value={c.count} options={[{ value: '2', label: '2 багана' }, { value: '3', label: '3 багана' }]} onChange={v => u({ count: v })} />
          <SInput label="Зай (px)" value={c.gap} onChange={v => u({ gap: v })} placeholder="24" />
          <STextarea label="🇲🇳 Багана 1 (MN)" value={c.col1_mn} onChange={v => u({ col1_mn: v })} rows={3} />
          <STextarea label="🇲🇳 Багана 2 (MN)" value={c.col2_mn} onChange={v => u({ col2_mn: v })} rows={3} />
          {parseInt(c.count) >= 3 && <STextarea label="🇲🇳 Багана 3 (MN)" value={c.col3_mn} onChange={v => u({ col3_mn: v })} rows={3} />}
          <STextarea label="🇺🇸 Column 1 (EN)" value={c.col1_en} onChange={v => u({ col1_en: v })} rows={3} />
          <STextarea label="🇺🇸 Column 2 (EN)" value={c.col2_en} onChange={v => u({ col2_en: v })} rows={3} />
          {parseInt(c.count) >= 3 && <STextarea label="🇺🇸 Column 3 (EN)" value={c.col3_en} onChange={v => u({ col3_en: v })} rows={3} />}
        </div>
      )
    case 'html':
      return <HtmlBlockContentEditor block={block} onChange={u} />
    case 'list':
      return (
        <div className="space-y-3">
          <SSelect label="Төрөл" value={c.listType} options={[{ value: 'bullet', label: '● Цэгтэй' }, { value: 'numbered', label: '1. Дугаартай' }]} onChange={v => u({ listType: v })} />
          <STextarea label="🇲🇳 Жагсаалт (MN)" value={c.items_mn} onChange={v => u({ items_mn: v })} placeholder="Мөр бүрт нэг зүйл..." rows={5} />
          <STextarea label="🇺🇸 List items (EN)" value={c.items_en} onChange={v => u({ items_en: v })} placeholder="One item per line..." rows={5} />
        </div>
      )
    case 'quote':
      return (
        <div className="space-y-3">
          <STextarea label="🇲🇳 Ишлэл (MN)" value={c.text_mn} onChange={v => u({ text_mn: v })} rows={3} />
          <STextarea label="🇺🇸 Quote (EN)" value={c.text_en} onChange={v => u({ text_en: v })} rows={3} />
          <SInput label="Зохиогч" value={c.author} onChange={v => u({ author: v })} placeholder="Нэр" />
        </div>
      )
    case 'attachment':
      return (
        <div className="space-y-3">
          {/* File upload */}
          {modeToggle(c._inputMode, [{ v: 'url', l: 'URL оруулах' }, { v: 'upload', l: 'Файл оруулах' }])}
          {(c._inputMode || 'upload') === 'url'
            ? <SInput label="Файлын URL" value={c.url} onChange={v => u({ url: v, file_name: getFileDisplayName(v, c.file_name) })} placeholder="https://.../document.pdf" />
            : fileUploadBox('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,image/*,video/*,audio/*,application/*', async f => {
              const url = await uploadFile(f, pageUrl)
              if (!url) {
                alert('Файл upload амжилтгүй боллоо. Backend upload API-г шалгаад дахин оролдоно уу.')
                return
              }
              u({ url, file_name: f.name })
            }, 'Файл сонгох эсвэл чирж оруулах')
          }
          <SInput label="Файлын нэр" value={c.file_name} onChange={v => u({ file_name: v })} placeholder="Жишээ: Танилцуулга.pdf" />
          {/* Icon image */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide">Зургийн дүрс (Icon)</label>
            {modeToggle(c._iconMode, [{ v: 'none', l: 'Icon (өгөгдмөл)' }, { v: 'url', l: 'URL' }, { v: 'upload', l: 'Зураг оруулах' }], '_iconMode')}
            {(c._iconMode || 'none') === 'url' && (
              <SInput label="Зургийн URL" value={c.icon_url} onChange={v => u({ icon_url: v })} placeholder="https://.../icon.png" />
            )}
            {(c._iconMode || 'none') === 'upload' && (
              fileUploadBox('image/*', async f => {
                const url = await uploadFile(f, pageUrl)
                if (!url) {
                  alert('Icon зураг upload амжилтгүй боллоо. Дахин оролдоно уу.')
                  return
                }
                u({ icon_url: url })
              }, 'Зураг сонгох (PNG, JPG, SVG...)')
            )}
            {c.icon_url && <div className="mt-2 flex items-center gap-2"><img src={c.icon_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-slate-200" /><button type="button" onClick={() => u({ icon_url: '', _iconMode: 'none' })} className="text-xs text-red-500 hover:underline">Устгах</button></div>}
          </div>
          {/* Titles & description */}
          <SInput label="🇲🇳 Гарчиг (MN)" value={c.title_mn} onChange={v => u({ title_mn: v })} placeholder="Файлын гарчиг" />
          <SInput label="🇺🇸 Title (EN)" value={c.title_en} onChange={v => u({ title_en: v })} placeholder="Attachment title" />
          <STextarea label="🇲🇳 Тайлбар (MN)" value={c.description_mn} onChange={v => u({ description_mn: v })} placeholder="Файлын тайлбар" rows={3} />
          <STextarea label="🇺🇸 Description (EN)" value={c.description_en} onChange={v => u({ description_en: v })} placeholder="Attachment description" rows={3} />
          {/* Button settings */}
          <SInput label="🇲🇳 Товчны текст" value={c.button_mn} onChange={v => u({ button_mn: v })} placeholder="Файл татах" />
          <SInput label="🇺🇸 Button text" value={c.button_en} onChange={v => u({ button_en: v })} placeholder="Download file" />
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide">Товчны үйлдэл</label>
            {modeToggle(c.buttonAction || 'download', [{ v: 'download', l: '⬇️ Татах' }, { v: 'view', l: '👁️ Үзэх' }], 'buttonAction')}
            <p className="text-[10px] text-slate-400 -mt-1">&quot;Үзэх&quot; сонгосон үед браузер дотор нээгдэнэ (PDF, зураг гэх мэт)</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide">Товчны байршил</label>
            {modeToggle(c.buttonPosition || 'left', [{ v: 'left', l: 'Зүүн' }, { v: 'center', l: 'Дунд' }, { v: 'right', l: 'Баруун' }], 'buttonPosition')}
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input type="checkbox" checked={(c.openInNewTab || 'true') === 'true'} onChange={e => u({ openInNewTab: String(e.target.checked) })} className="rounded text-blue-600 focus:ring-blue-500" />
            <div>
              <span className="text-sm font-semibold text-slate-700">Шинэ tab дээр нээх</span>
              <p className="text-[10px] text-slate-400">Файл дээр дарахад шинэ tab дээр нээгдэнэ</p>
            </div>
          </div>
          {c.url ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">✓ {getFileDisplayName(c.url, c.file_name) || 'Файл хавсарсан'}</div> : null}
        </div>
      )
    case 'filelink':
      return (
        <div className="space-y-3">
          {modeToggle(c._inputMode, [{ v: 'url', l: 'URL оруулах' }, { v: 'upload', l: 'Файл оруулах' }])}
          {(c._inputMode || 'upload') === 'url'
            ? <SInput label="Файлын URL" value={c.url} onChange={v => u({ url: v, file_name: getFileDisplayName(v, c.file_name) })} placeholder="https://.../document.pdf" />
            : fileUploadBox('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,image/*,video/*,audio/*,application/*', async f => {
              const url = await uploadFile(f, pageUrl)
              if (!url) {
                alert('Файл upload амжилтгүй боллоо. Backend upload API-г шалгаад дахин оролдоно уу.')
                return
              }
              u({ url, file_name: f.name })
            }, 'Файл сонгох эсвэл чирж оруулах')
          }
          <SInput label="Файлын нэр" value={c.file_name} onChange={v => u({ file_name: v })} placeholder="Жишээ: Танилцуулга.pdf" />
          {c.url ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">✓ {getFileDisplayName(c.url, c.file_name) || 'Файл хавсарсан'}</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] text-slate-400 mb-1">Файлын URL (HTML товчинд ашиглах)</p>
                <span className="text-xs font-mono text-slate-700 break-all select-all">{c.url}</span>
              </div>
            </div>
          ) : null}
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            ℹ️ Энэ блок хэрэглэгчид харагдахгүй. HTML блокийн товчны холбоонд ашиглана.
          </div>
        </div>
      )
    default: return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCK STYLE EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

function BlockStyleEditor({ block, onChange, blocks, pageUrl }: { block: Block; onChange: (u: Record<string, string>) => void; blocks?: Block[]; pageUrl?: string }) {
  const s = block.style
  const u = onChange
  // useState must run on every render regardless of block.type — calling it
  // after an early return violates the Rules of Hooks and can throw
  // "Rendered fewer hooks than expected" if the same component instance
  // switches between a spacer block and any other block type.
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    htmlImages: true,
    htmlButtons: true,
  })
  if (block.type === 'spacer') return null

  const uploadHtmlPlaceholderImage = async (key: string, file?: File) => {
    if (!file) return
    const url = await uploadFile(file, pageUrl)
    if (!url) {
      alert('Зураг upload амжилтгүй боллоо. Дахин оролдоно уу.')
      return
    }
    u({ [key]: url })
  }

  return (
    <div className="space-y-4">
      {/* Font Controls */}
      {['heading', 'text', 'button', 'list', 'quote', 'columns'].includes(block.type) && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 tracking-wide">Фонт</label>
          <select value={s.fontFamily || ''} onChange={e => u({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            {FONT_OPTIONS.map(f => <option key={f.value} value={f.value} style={{ fontFamily: f.family, fontWeight: f.weight }}>{f.label}</option>)}
          </select>
          {s.fontFamily && <p className="text-xs text-slate-400 mt-1" style={getFontStyle(s.fontFamily)}>Жишээ текст — Preview</p>}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block text-[10px] text-slate-400 mb-1">Хэмжээ (px)</span>
              <input type="number" value={s.fontSize || ''} onChange={e => u({ fontSize: e.target.value })} placeholder="авто" min="8" max="200"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 mb-1">Жин</span>
              <select value={s.fontWeight || ''} onChange={e => u({ fontWeight: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                <option value="">Авто</option>
                <option value="300">Нарийн</option><option value="400">Хэвийн</option><option value="500">Дунд</option>
                <option value="600">Зузаан</option><option value="700">Тод</option><option value="900">Хар</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {block.type === 'html' && (
        <div className="space-y-2">
          {/* HTML Placeholder зураг section */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
            <button
              type="button"
              onClick={() => setExpandedSections(p => ({ ...p, htmlImages: !p.htmlImages }))}
              className="w-full flex items-center justify-between gap-2 pb-2 hover:opacity-70 transition-opacity"
            >
              <label className="text-xs font-semibold text-slate-600 tracking-wide cursor-pointer">HTML Placeholder зураг</label>
              {expandedSections.htmlImages ? <ChevronUpIcon className="h-4 w-4 text-slate-500" /> : <ChevronDownIcon className="h-4 w-4 text-slate-500" />}
            </button>
            {expandedSections.htmlImages && (
              <>
                <p className="text-[11px] text-slate-500 mb-2">HTML доторх placeholder эсвэл `.icon` элементийн тоогоор зурагны талбар автоматаар гарна. Placeholder жишээ: <strong>{'{{IMAGE_URL}}'}</strong>, <strong>{'{{IMAGE_URL_2}}'}</strong> ...</p>
                {(() => {
                  const c = block.content as Record<string, string>
                  const slotCount = getSharedHtmlImageSlotCount(c)
                  return slotCount === 0 ? (
                    <p className="text-[11px] text-amber-600">Зурагны slot илрээгүй байна. HTML коддоо <strong>{'{{IMAGE_URL}}'}</strong> placeholder эсвэл `.icon` class нэмнэ үү.</p>
                  ) : Array.from({ length: slotCount }).map((_, i) => {
                    const idx = i + 1
                    const key = getHtmlImageStyleKey(idx)
                    const value = getHtmlImageStyleValue(s, idx)
                    const label = idx === 1 ? 'IMAGE_URL' : `IMAGE_URL_${idx}`
                    return (
                      <div key={key} className="space-y-1.5 rounded-lg border border-sky-200/70 bg-white/70 p-2.5 mt-2">
                        <SInput label={label} value={value} onChange={v => u({ [key]: v })} placeholder={`https://.../image${idx}.jpg`} />
                        <div className="relative border border-dashed border-slate-300 rounded-lg p-2 text-center hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer group">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={async e => {
                              const inputEl = e.currentTarget
                              const file = inputEl.files?.[0]
                              inputEl.value = ''
                              await uploadHtmlPlaceholderImage(key, file)
                            }}
                          />
                          <p className="text-[11px] text-slate-500 group-hover:text-blue-600">Зураг файл оруулах (storage руу хадгална)</p>
                        </div>
                        {!isLikelyDirectImageUrl(value) && <p className="text-[11px] text-amber-600">Энэ линк зураг файл биш байна. `.jpg/.png/.webp...` төгсгөлтэй direct image URL оруулна уу.</p>}
                      </div>
                    )
                  })
                })()}
              </>
            )}
          </div>

          {/* HTML Placeholder товч холбоо section */}
          <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3">
            <button
              type="button"
              onClick={() => setExpandedSections(p => ({ ...p, htmlButtons: !p.htmlButtons }))}
              className="w-full flex items-center justify-between gap-2 pb-2 hover:opacity-70 transition-opacity"
            >
              <label className="text-xs font-semibold text-slate-600 tracking-wide cursor-pointer">HTML Placeholder товч холбоо</label>
              {expandedSections.htmlButtons ? <ChevronUpIcon className="h-4 w-4 text-slate-500" /> : <ChevronDownIcon className="h-4 w-4 text-slate-500" />}
            </button>
            {expandedSections.htmlButtons && (
              <>
                <p className="text-[11px] text-slate-500 mb-2">HTML доторх placeholder эсвэл `.btn` `.button` элементийн тоогоор холбоо талбар автоматаар гарна. Placeholder жишээ: <strong>{'{{BUTTON_LINK}}'}</strong>, <strong>{'{{BUTTON_LINK_2}}'}</strong> ...</p>
                {(() => {
                  const c = block.content as Record<string, string>
                  const buttonSlotCount = getSharedHtmlButtonSlotCount(c)
                  return buttonSlotCount === 0 ? (
                    <p className="text-[11px] text-amber-600">Товчны slot илрээгүй байна. HTML коддоо <strong>{'{{BUTTON_LINK}}'}</strong> placeholder эсвэл `.btn` `.button` class нэмнэ үү.</p>
                  ) : Array.from({ length: buttonSlotCount }).map((_, i) => {
                    const idx = i + 1
                    const key = getHtmlButtonStyleKey(idx)
                    const value = getHtmlButtonStyleValue(s, idx)
                    const label = idx === 1 ? 'BUTTON_LINK' : `BUTTON_LINK_${idx}`
                    return (
                      <div key={key} className="space-y-1.5 rounded-lg border border-orange-200/70 bg-white/70 p-2.5 mt-2">
                        <SInput label={label} value={value} onChange={v => u({ [key]: v })} placeholder="https://example.com/page" />
                        <p className="text-[10px] text-slate-400">Товчны #{idx} холбоо URL. Жишээ: https://example.com, /page, #section</p>
                        {(() => {
                          const fileLinkBlocks = (blocks || []).filter(b => b.type === 'filelink' && (b.content as Record<string, string>).url)
                          if (!fileLinkBlocks.length) return null
                          return (
                            <div className="mt-1 p-2 bg-rose-50/70 border border-rose-200/60 rounded-lg">
                              <p className="text-[10px] text-rose-600 font-semibold mb-1.5">Файл-линк блокоос сонгох</p>
                              <div className="flex flex-col gap-1">
                                {fileLinkBlocks.map(fb => {
                                  const fc = fb.content as Record<string, string>
                                  const name = getFileDisplayName(fc.url, fc.file_name) || fc.url
                                  return (
                                    <button
                                      type="button"
                                      key={fb.id}
                                      onClick={() => u({ [key]: fc.url })}
                                      className="text-left text-xs py-1 px-2 rounded bg-white border border-rose-200 hover:bg-rose-50 text-slate-700 truncate"
                                    >
                                      {name}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* Alignment */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-wide">Зэрэгцүүлэлт</label>
        <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
          {[{ v: 'left', l: 'Зүүн' }, { v: 'center', l: 'Төв' }, { v: 'right', l: 'Баруун' }].map(a => (
            <button type="button" key={a.v} onClick={() => u({ textAlign: a.v })}
              className={`flex-1 py-2 text-xs rounded-md font-medium transition-all ${s.textAlign === a.v ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {a.l}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        {[{ key: 'backgroundColor', label: 'Дэвсгэр', def: '#ffffff' }, { key: 'textColor', label: 'Текст', def: '#000000' }].map(({ key, label, def }) => (
          <div key={key}>
            <span className="block text-[10px] text-slate-400 mb-1">{label} өнгө</span>
            <div className="flex items-center gap-1.5">
              <input type="color" value={s[key] || def} onChange={e => u({ [key]: e.target.value })} className="w-7 h-7 rounded-md border border-slate-200 cursor-pointer" />
              <input type="text" value={s[key] || ''} onChange={e => u({ [key]: e.target.value })} placeholder="авто"
                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs min-w-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Padding */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-wide">Дотоод зай (px)</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[{ key: 'paddingTop', l: '↑' }, { key: 'paddingRight', l: '→' }, { key: 'paddingBottom', l: '↓' }, { key: 'paddingLeft', l: '←' }].map(p => (
            <div key={p.key} className="text-center">
              <span className="block text-[10px] text-slate-400 mb-0.5">{p.l}</span>
              <input type="number" value={s[p.key] || '0'} onChange={e => u({ [p.key]: e.target.value })}
                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-center" />
            </div>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide">Булангийн радиус ({s.borderRadius || 0}px)</label>
        <input type="range" min="0" max="32" value={s.borderRadius || 0} onChange={e => u({ borderRadius: e.target.value })} className="w-full accent-blue-600" />
      </div>

      {/* Dimensions */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-wide">Хэмжээ (px)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="block text-[10px] text-slate-400 mb-0.5">Өргөн</span>
            <input type="number" value={s.width || ''} onChange={e => u({ width: e.target.value })} placeholder="авто" min="50"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 mb-0.5">Өндөр</span>
            <input type="number" value={s.height || ''} onChange={e => u({ height: e.target.value })} placeholder="авто" min="30"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-wide">Байршил (px)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="block text-[10px] text-slate-400 mb-0.5">X (зүүнээс)</span>
            <input type="number" value={s.posX || '0'} onChange={e => u({ posX: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 mb-0.5">Y (дээрээс)</span>
            <input type="number" value={s.posY || '0'} onChange={e => u({ posY: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {/* Z-index */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-wide">Давхарга (z-index)</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => u({ zIndex: String(Math.max(1, parseInt(s.zIndex || '1') - 1)) })}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors">← Ард</button>
          <span className="text-sm font-mono text-slate-600 w-10 text-center font-bold">{s.zIndex || '1'}</span>
          <button type="button" onClick={() => u({ zIndex: String(parseInt(s.zIndex || '1') + 1) })}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors">Өмнө →</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PageBuilder() {
  // State
  const [mode, setMode] = useState<'list' | 'editor'>('list')
  const [pages, setPages] = useState<ApiPage[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [pageSettings, setPageSettings] = useState<PageSettings>({ url: '', title_mn: '', title_en: '', description_mn: '', description_en: '', active: true, image: '' })
  const [editingPageId, setEditingPageId] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showBlockPalette, setShowBlockPalette] = useState(false)
  const [rightTab, setRightTab] = useState<'content' | 'style' | 'page'>('page')
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(defaultLayout())
  const [previewLang, setPreviewLang] = useState<'mn' | 'en'>('mn')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [expandedSection, setExpandedSection] = useState<string | null>('layout')

  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragInfo, setDragInfo] = useState<{ blockId: string; offsetX: number; offsetY: number } | null>(null)
  const [resizeInfo, setResizeInfo] = useState<{ blockId: string; handle: string; startX: number; startY: number; startPosX: number; startPosY: number; startW: number; startH: number } | null>(null)

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null

  useEffect(() => { loadPages() }, [])

  // ── API ──────────────────────────────────────────────────────────────────────

  const loadPages = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get<ApiPage[]>('/page/')
      const d = res.data as unknown as (ApiPage[] | { results: ApiPage[] })
      setPages(Array.isArray(d) ? d : ((d as { results: ApiPage[] })?.results ?? []))
    } catch (e) { console.error('Failed to load pages:', e) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!pageSettings.title_mn) { alert('Хуудасны нэр оруулна уу'); return }
    if (!pageSettings.url) { alert('URL хаяг оруулна уу'); return }
    setSaving(true)
    try {
      const payload = {
        url: pageSettings.url,
        active: pageSettings.active,
        image: pageSettings.image || null,
        content_blocks: JSON.stringify({ layout: layoutSettings, blocks }),
        title_translations: [
          { language: 1, label: pageSettings.title_mn },
          { language: 2, label: pageSettings.title_en },
        ],
        description_translations: [
          { language: 1, label: pageSettings.description_mn },
          { language: 2, label: pageSettings.description_en },
        ],
      }
      if (editingPageId) {
        await axiosInstance.put(`/page/${editingPageId}/`, payload)
      } else {
        const res = await axiosInstance.post('/page/', payload)
        setEditingPageId(res.data.id)
      }
      await loadPages()
      alert('✅ Хуудас амжилттай хадгалагдлаа!')
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      alert(`Хадгалахад алдаа: ${detail || errMsg}`)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Энэ хуудсыг устгах уу?')) return
    try {
      await axiosInstance.delete(`/page/${id}/`)
      await loadPages()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      alert(`Устгахад алдаа: ${detail || (e instanceof Error ? e.message : '')}`)
    }
  }

  const buildDuplicateUrl = (sourceUrl: string) => {
    const baseUrl = (sourceUrl || '/new-page').trim() || '/new-page'
    const normalized = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`
    let candidate = `${normalized}-copy`
    let counter = 2
    const used = new Set(pages.map(page => (page.url || '').trim().toLowerCase()))
    while (used.has(candidate.toLowerCase())) {
      candidate = `${normalized}-copy-${counter}`
      counter += 1
    }
    return candidate
  }

  const handleDuplicatePage = async (page: ApiPage) => {
    try {
      const tmn = getTrans(page.title_translations, 1)
      const ten = getTrans(page.title_translations, 2)
      const dmn = getTrans(page.description_translations, 1)
      const den = getTrans(page.description_translations, 2)
      const payload = {
        url: buildDuplicateUrl(page.url || ''),
        active: false,
        image: page.image || null,
        content_blocks: page.content_blocks || JSON.stringify({ layout: defaultLayout(), blocks: [] }),
        title_translations: [
          { language: 1, label: tmn.label ? `${tmn.label} (Хуулбар)` : 'Хуулбар', font: tmn.font || '', family: tmn.family || '', weight: tmn.weight || '', size: tmn.size || '' },
          { language: 2, label: ten.label ? `${ten.label} (Copy)` : 'Copy', font: ten.font || '', family: ten.family || '', weight: ten.weight || '', size: ten.size || '' },
        ],
        description_translations: [
          { language: 1, label: dmn.label || '', font: dmn.font || '', family: dmn.family || '', weight: dmn.weight || '', size: dmn.size || '' },
          { language: 2, label: den.label || '', font: den.font || '', family: den.family || '', weight: den.weight || '', size: den.size || '' },
        ],
      }
      await axiosInstance.post('/page/', payload)
      await loadPages()
      alert('✅ Хуудасны хуулбар үүсгэлээ')
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      alert(`Хуулахад алдаа: ${detail || (e instanceof Error ? e.message : '')}`)
    }
  }

  const handleCopyUrl = async (url: string) => {
    const value = url || '/'
    try {
      await navigator.clipboard.writeText(value)
      alert('✅ URL хууллаа')
    } catch {
      alert(`URL: ${value}`)
    }
  }

  const handleEditPage = (page: ApiPage) => {
    setEditingPageId(page.id)
    const tmn = getTrans(page.title_translations, 1)
    const ten = getTrans(page.title_translations, 2)
    setPageSettings({
      url: page.url || '',
      title_mn: tmn.label,
      title_en: ten.label,
      description_mn: getTrans(page.description_translations, 1).label,
      description_en: getTrans(page.description_translations, 2).label,
      active: page.active ?? true,
      image: page.image || '',
    })

    let parsed: Block[] = []
    let parsedLayout: LayoutSettings = defaultLayout()
    try {
      const raw = page.content_blocks ? JSON.parse(page.content_blocks) : []
      if (Array.isArray(raw)) { parsed = raw }
      else if (raw?.blocks) { parsed = raw.blocks || []; parsedLayout = { ...defaultLayout(), ...(raw.layout || {}) } }
    } catch { parsed = [] }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      const autoBlocks: Block[] = []
      const dmn = getTrans(page.description_translations, 1)
      if (dmn.label) {
        autoBlocks.push({ id: genId(), type: 'text', content: { text_mn: dmn.label, text_en: getTrans(page.description_translations, 2).label }, style: defaultStyle() })
      }
      parsed = autoBlocks
    }

    setBlocks(parsed.map((block, idx) => ({
      ...block,
      style: {
        ...defaultStyle(), ...block.style,
        posX: block.style?.posX || '50',
        posY: block.style?.posY || String(idx * 200 + 50),
        width: block.style?.width || String(DEFAULT_BLOCK_WIDTH[block.type as BlockType] || 600),
        zIndex: block.style?.zIndex || String(idx + 1),
      },
    })))
    setLayoutSettings(parsedLayout)
    setSelectedBlockId(null)
    setShowPreview(false)
    setRightTab('page')
    setMode('editor')
  }

  const handleNewPage = () => {
    setEditingPageId(null)
    setPageSettings({ url: '', title_mn: '', title_en: '', description_mn: '', description_en: '', active: true, image: '' })
    setBlocks([])
    setLayoutSettings(defaultLayout())
    setSelectedBlockId(null)
    setShowPreview(false)
    setRightTab('page')
    setMode('editor')
  }

  // ── Block Operations ────────────────────────────────────────────────────────

  const addBlock = (type: BlockType) => {
    const maxBottom = blocks.reduce((max, b) => Math.max(max, parseInt(b.style?.posY || '0') + parseInt(b.style?.height || '150')), 0)
    const newBlock: Block = {
      id: genId(), type,
      content: defaultContent(type),
      style: { ...defaultStyle(), posX: '50', posY: String(maxBottom + 30), width: String(DEFAULT_BLOCK_WIDTH[type] || 600), zIndex: String(blocks.length + 1) },
    }
    setBlocks(prev => [...prev, newBlock])
    setSelectedBlockId(newBlock.id)
    setRightTab('content')
    setShowBlockPalette(false)
  }

  const updateBlockContent = (id: string, content: Record<string, unknown>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: { ...b.content, ...content } } : b))
  }

  const updateBlockStyle = (id: string, style: Record<string, string>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, style: { ...b.style, ...style } } : b))
  }

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (selectedBlockId === id) { setSelectedBlockId(null); setRightTab('page') }
  }

  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx === -1) return
    const clone: Block = { ...JSON.parse(JSON.stringify(blocks[idx])), id: genId() }
    clone.style.posY = String(parseInt(clone.style.posY || '0') + 30)
    clone.style.posX = String(parseInt(clone.style.posX || '0') + 30)
    const nb = [...blocks]
    nb.splice(idx + 1, 0, clone)
    setBlocks(nb)
    setSelectedBlockId(clone.id)
  }

  // ── Canvas mouse/touch handlers ────────────────────────────────────────────

  const handleBlockMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    if ((e.target as HTMLElement).dataset.resizeHandle) return
    if (isInteractiveTarget(e.target)) return
    e.preventDefault(); e.stopPropagation()
    const cr = canvasRef.current?.getBoundingClientRect()
    if (!cr) return
    setBlocks(prev => {
      const block = prev.find(b => b.id === blockId)
      if (!block) return prev
      setDragInfo({ blockId, offsetX: e.clientX - cr.left - parseInt(block.style.posX || '0') + canvasRef.current!.scrollLeft, offsetY: e.clientY - cr.top - parseInt(block.style.posY || '0') + canvasRef.current!.scrollTop })
      return prev
    })
    setSelectedBlockId(blockId)
    setRightTab('content')
  }, [])

  const handleBlockTouchStart = useCallback((e: React.TouchEvent, blockId: string) => {
    if ((e.target as HTMLElement).dataset.resizeHandle) return
    if (isInteractiveTarget(e.target)) return
    const touch = e.touches[0]
    const cr = canvasRef.current?.getBoundingClientRect()
    if (!cr) return
    setBlocks(prev => {
      const block = prev.find(b => b.id === blockId)
      if (!block) return prev
      setDragInfo({ blockId, offsetX: touch.clientX - cr.left - parseInt(block.style.posX || '0') + canvasRef.current!.scrollLeft, offsetY: touch.clientY - cr.top - parseInt(block.style.posY || '0') + canvasRef.current!.scrollTop })
      return prev
    })
    setSelectedBlockId(blockId)
    setRightTab('content')
  }, [])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, blockId: string, handle: string) => {
    e.preventDefault(); e.stopPropagation()
    setBlocks(prev => {
      const block = prev.find(b => b.id === blockId)
      if (!block) return prev
      const el = document.getElementById(`block-${blockId}`)
      const rect = el?.getBoundingClientRect()
      setResizeInfo({ blockId, handle, startX: e.clientX, startY: e.clientY, startPosX: parseInt(block.style.posX || '0'), startPosY: parseInt(block.style.posY || '0'), startW: rect?.width || parseInt(block.style.width || '400'), startH: rect?.height || parseInt(block.style.height || '200') })
      return prev
    })
  }, [])

  useEffect(() => {
    if (!dragInfo && !resizeInfo) return
    const handleMouseMove = (e: MouseEvent) => {
      if (dragInfo) {
        const cr = canvasRef.current?.getBoundingClientRect()
        if (!cr) return
        const sl = canvasRef.current!.scrollLeft, st = canvasRef.current!.scrollTop
        const newX = Math.max(0, Math.round(e.clientX - cr.left + sl - dragInfo.offsetX))
        const newY = Math.max(0, Math.round(e.clientY - cr.top + st - dragInfo.offsetY))
        setBlocks(prev => prev.map(b => b.id === dragInfo.blockId ? { ...b, style: { ...b.style, posX: String(newX), posY: String(newY) } } : b))
      }
      if (resizeInfo) {
        const dx = e.clientX - resizeInfo.startX, dy = e.clientY - resizeInfo.startY
        const h = resizeInfo.handle
        let w = resizeInfo.startW, ht = resizeInfo.startH, px = resizeInfo.startPosX, py = resizeInfo.startPosY
        if (h.includes('e')) w = Math.max(50, resizeInfo.startW + dx)
        if (h.includes('w')) { w = Math.max(50, resizeInfo.startW - dx); px = resizeInfo.startPosX + resizeInfo.startW - w }
        if (h.includes('s')) ht = Math.max(30, resizeInfo.startH + dy)
        if (h.includes('n')) { ht = Math.max(30, resizeInfo.startH - dy); py = resizeInfo.startPosY + resizeInfo.startH - ht }
        setBlocks(prev => prev.map(b => b.id === resizeInfo.blockId ? { ...b, style: { ...b.style, width: String(Math.round(w)), height: String(Math.round(ht)), posX: String(Math.round(px)), posY: String(Math.round(py)) } } : b))
      }
    }
    const handleMouseUp = () => { setDragInfo(null); setResizeInfo(null) }
    const handleTouchMove = (e: TouchEvent) => {
      if (!dragInfo) return
      e.preventDefault()
      const touch = e.touches[0]
      const cr = canvasRef.current?.getBoundingClientRect()
      if (!cr) return
      const sl = canvasRef.current!.scrollLeft, st = canvasRef.current!.scrollTop
      setBlocks(prev => prev.map(b => b.id === dragInfo.blockId ? { ...b, style: { ...b.style, posX: String(Math.max(0, Math.round(touch.clientX - cr.left + sl - dragInfo.offsetX))), posY: String(Math.max(0, Math.round(touch.clientY - cr.top + st - dragInfo.offsetY))) } } : b))
    }
    const handleTouchEnd = () => { setDragInfo(null); setResizeInfo(null) }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); document.removeEventListener('touchmove', handleTouchMove); document.removeEventListener('touchend', handleTouchEnd) }
  }, [dragInfo, resizeInfo])

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (mode === 'list') {
    const filteredPages = pages.filter(p => {
      const tmn = getTrans(p.title_translations, 1).label.toLowerCase()
      const ten = getTrans(p.title_translations, 2).label.toLowerCase()
      const q = search.toLowerCase()
      const matchesSearch = !search || tmn.includes(q) || ten.includes(q) || (p.url || '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? !!p.active : !p.active)
      return matchesSearch && matchesStatus
    })

    return (
      <AdminLayout title="Хуудас удирдах">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Хуудас удирдах</h1>
              <p className="text-sm text-slate-500 mt-1">Хүссэн дизайнтай хуудсуудаа чөлөөтэй үүсгэж засна</p>
            </div>
            <button onClick={handleNewPage}
              className="group flex items-center gap-2.5 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg shadow-blue-200 hover:shadow-blue-300 w-full sm:w-auto justify-center">
              <PlusIcon className="h-5 w-5 group-hover:rotate-90 transition-transform" />
              Шинэ хуудас
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Нийт хуудас', value: pages.length, icon: Squares2X2Icon, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
              { label: 'Идэвхтэй', value: pages.filter(p => p.active).length, icon: EyeIcon, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Идэвхгүй', value: pages.filter(p => !p.active).length, icon: EyeSlashIcon, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-white/60 relative overflow-hidden`}>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 bg-linear-to-br ${s.gradient} rounded-lg flex items-center justify-center`}>
                      <s.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">{s.label}</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          {pages.length > 0 && (
            <div className="mb-6 space-y-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Хуудас хайх..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all' as const, label: 'Бүгд' },
                  { key: 'active' as const, label: 'Идэвхтэй' },
                  { key: 'inactive' as const, label: 'Идэвхгүй' },
                ].map(item => (
                  <button key={item.key} onClick={() => setStatusFilter(item.key)} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${statusFilter === item.key ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-200 hover:text-blue-600'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pages Grid */}
          {loading ? (
            <div className="text-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-blue-600 border-t-transparent mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Уншиж байна...</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <DocumentDuplicateIcon className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">{search ? 'Хайлтад тохирох хуудас олдсонгүй' : 'Хуудас байхгүй'}</h3>
              <p className="text-slate-500 mb-6">{search ? 'Өөр түлхүүр үгээр хайна уу' : 'Эхний хуудсаа үүсгээрэй'}</p>
              {!search && (
                <button onClick={handleNewPage} className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg">
                  <PlusIcon className="h-5 w-5" />Шинэ хуудас
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredPages.map(page => {
                const tmn = getTrans(page.title_translations, 1)
                const ten = getTrans(page.title_translations, 2)
                let blockCount = 0
                try { const p = page.content_blocks ? JSON.parse(page.content_blocks) : []; blockCount = Array.isArray(p) ? p.length : (p?.blocks?.length || 0) } catch { /* empty */ }
                return (
                  <div key={page.id}
                    className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all cursor-pointer"
                    onClick={() => handleEditPage(page)}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${page.active ? 'bg-linear-to-br from-blue-500 to-indigo-500' : 'bg-slate-100'}`}>
                          <DocumentTextIcon className={`h-6 w-6 ${page.active ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 mb-1">
                            <h3 className="font-bold text-slate-900 truncate">{tmn.label || 'Нэргүй'}</h3>
                            <span className={`px-2.5 py-0.5 text-[11px] rounded-full font-semibold tracking-wide ${page.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {page.active ? 'ИДЭВХТЭЙ' : 'ИДЭВХГҮЙ'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" />{page.url || '/'}</span>
                            <span>·</span>
                            <span className="text-slate-500 font-medium">{blockCount} блок</span>
                            {ten.label && <><span>·</span><span className="text-slate-400 truncate max-w-[200px]">{ten.label}</span></>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleCopyUrl(page.url || '/')} className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors" title="URL хуулах">
                          <LinkIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDuplicatePage(page)} className="p-2.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors" title="Хуулах">
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleEditPage(page)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Засах">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDelete(page.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Устгах">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </AdminLayout>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EDITOR VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  const SettingsSection = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {expandedSection === id ? <ChevronUpIcon className="h-4 w-4 text-slate-400" /> : <ChevronDownIcon className="h-4 w-4 text-slate-400" />}
      </button>
      {expandedSection === id && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )

  return (
    <AdminLayout title={pageSettings.title_mn || 'Шинэ хуудас'}>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* ── Top Toolbar ──────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('list')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors" title="Буцах">
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex flex-col">
              <input type="text" value={pageSettings.title_mn}
                onChange={e => setPageSettings(s => ({ ...s, title_mn: e.target.value }))}
                placeholder="Хуудасны нэр..."
                className="text-base font-bold border-none focus:ring-0 focus:outline-none bg-transparent w-52 placeholder:text-slate-300" />
              <div className="flex items-center gap-1.5 -mt-0.5">
                <LinkIcon className="h-3 w-3 text-slate-400" />
                <input type="text" value={pageSettings.url}
                  onChange={e => setPageSettings(s => ({ ...s, url: e.target.value }))}
                  placeholder="/url"
                  className="text-xs text-slate-400 border-none focus:ring-0 focus:outline-none bg-transparent w-36 placeholder:text-slate-300" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            {showPreview && (
              <div className="flex gap-0.5 p-0.5 bg-slate-100 rounded-lg mr-2">
                <button onClick={() => setPreviewLang('mn')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${previewLang === 'mn' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}>🇲🇳 MN</button>
                <button onClick={() => setPreviewLang('en')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${previewLang === 'en' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}>🇺🇸 EN</button>
              </div>
            )}

            {showPreview && (
              <div className="flex gap-0.5 p-0.5 bg-slate-100 rounded-lg mr-2">
                <button title="Desktop" onClick={() => setPreviewDevice('desktop')} className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                  Desktop
                </button>
                <button title="Tablet" onClick={() => setPreviewDevice('tablet')} className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${previewDevice === 'tablet' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>
                  Tablet
                </button>
                <button title="Гар утас" onClick={() => setPreviewDevice('mobile')} className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>
                  Утас
                </button>
              </div>
            )}

            <label className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors">
              <input type="checkbox" checked={pageSettings.active}
                onChange={e => setPageSettings(s => ({ ...s, active: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-500" />
              <span className="text-xs font-medium">Идэвхтэй</span>
            </label>

            <button onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${showPreview ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {showPreview ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              {showPreview ? 'Засварлах' : 'Урьдчилал'}
            </button>

            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-semibold text-xs shadow-lg shadow-blue-200 transition-all">
              {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>

            {!showPreview && (
              <button onClick={() => setShowBlockPalette(true)}
                className="lg:hidden flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-semibold text-xs">
                <PlusIcon className="h-4 w-4" />Блок
              </button>
            )}
          </div>
        </div>

        {/* ── Editor Body ──────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left: Block Palette ── */}
          {!showPreview && (
            <div className="hidden lg:flex w-56 bg-slate-50/80 border-r border-slate-200 overflow-y-auto shrink-0 flex-col">
              <div className="p-3 border-b border-slate-200 bg-white/60">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Блок нэмэх</h3>
              </div>
              <div className="p-2.5 grid grid-cols-2 gap-1.5">
                {BLOCK_DEFS.map(bt => {
                  const Icon = bt.icon
                  const colorParts = bt.color.split(' ')
                  return (
                    <button key={bt.type} onClick={() => addBlock(bt.type)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${colorParts[1]} ${colorParts[2]} hover:scale-[1.02]`}>
                      <Icon className={`h-5 w-5 ${colorParts[0]}`} />
                      <span className={`text-[11px] font-semibold ${colorParts[0]}`}>{bt.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Block layers list */}
              {blocks.length > 0 && (
                <div className="mt-auto border-t border-slate-200 bg-white/60">
                  <div className="p-3">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Давхаргууд ({blocks.length})</h3>
                  </div>
                  <div className="max-h-48 overflow-y-auto px-2 pb-2 space-y-0.5">
                    {blocks.map(b => {
                      const def = BLOCK_DEFS.find(d => d.type === b.type)
                      const Icon = def?.icon || DocumentTextIcon
                      const isSelected = selectedBlockId === b.id
                      return (
                        <button key={b.id}
                          onClick={() => { setSelectedBlockId(b.id); setRightTab('content') }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-all ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}>
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{def?.label}</span>
                          <span className="ml-auto text-[10px] text-slate-400">z{b.style.zIndex || 1}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Center: Canvas ── */}
          <div className="flex-1 overflow-auto bg-slate-100" onClick={() => { setSelectedBlockId(null); setRightTab('page') }}>
            {showPreview ? (
              <div className="p-8 flex justify-center">
                {(() => {
                  const deviceWidth = previewDevice === 'mobile' ? 390 : previewDevice === 'tablet' ? 768 : undefined
                  const deviceLabel = previewDevice === 'mobile' ? 'Гар утас (390px)' : previewDevice === 'tablet' ? 'Tablet (768px)' : 'Desktop'
                  const outer = deviceWidth
                    ? { width: `${deviceWidth}px`, minWidth: `${deviceWidth}px`, maxWidth: `${deviceWidth}px` }
                    : { width: '100%', maxWidth: `${layoutSettings.fullWidth ? '100%' : `${layoutSettings.maxWidth || 1200}px`}` }
                  return (
                    <div style={outer}>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{deviceLabel}</span>
                      </div>
                      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                        <div className="bg-linear-to-r from-slate-800 to-slate-900 px-8 py-5 text-white">
                          <div className="flex items-center gap-2 text-sm opacity-60 mb-1">
                            <LinkIcon className="h-3.5 w-3.5" />{pageSettings.url || '/'}
                          </div>
                          <h1 className="text-2xl font-bold">{(previewLang === 'mn' ? pageSettings.title_mn : pageSettings.title_en) || 'Нэргүй хуудас'}</h1>
                        </div>
                        <div style={{
                          position: 'relative',
                          minHeight: `${Math.max(600, blocks.reduce((max, b) => Math.max(max, parseInt(b.style.posY || '0') + parseInt(b.style.height || '200')), 0) + 100)}px`,
                          paddingTop: `${layoutSettings.pagePaddingTop || 32}px`, paddingBottom: `${layoutSettings.pagePaddingBottom || 32}px`,
                          paddingLeft: `${layoutSettings.pagePaddingLeft || 32}px`, paddingRight: `${layoutSettings.pagePaddingRight || 32}px`,
                        }}>
                          {blocks.length === 0 ? (
                            <p className="text-center text-slate-400 py-20">Блок нэмж хуудасаа бүрдүүлнэ үү</p>
                          ) : blocks.map(block => (
                            <div key={block.id} style={block.type === 'html' ? {
                              position: 'absolute',
                              left: 0, right: 0,
                              top: `${block.style.posY || 0}px`,
                              height: block.style.height ? `${block.style.height}px` : 'auto',
                              zIndex: parseInt(block.style.zIndex || '1'), overflow: 'hidden',
                            } : {
                              position: 'absolute',
                              left: `${block.style.posX || 0}px`, top: `${block.style.posY || 0}px`,
                        width: block.style.width ? `${block.style.width}px` : 'auto',
                        height: block.style.height ? `${block.style.height}px` : 'auto',
                        zIndex: parseInt(block.style.zIndex || '1'), overflow: 'hidden',
                      }}>
                      <RenderBlock block={block} lang={previewLang} />
                      </div>
                    ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              /* ── Free-form Edit Canvas ── */
              <div ref={canvasRef} className="relative bg-white"
                style={{
                  width: `${Math.max(1400, blocks.reduce((max, b) => Math.max(max, parseInt(b.style?.posX || '0') + parseInt(b.style?.width || '600') + 200), 0))}px`,
                  height: `${Math.max(2000, blocks.reduce((max, b) => Math.max(max, parseInt(b.style?.posY || '0') + parseInt(b.style?.height || '200') + 300), 0))}px`,
                  backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                  cursor: dragInfo ? 'grabbing' : 'default',
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedBlockId(null); setRightTab('page') }}
              >
                {blocks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center py-16 px-16 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/60">
                      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Squares2X2Icon className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-500 mb-2">Хоосон хуудас</h3>
                      <p className="text-slate-400 mb-6 text-sm">Зүүн талаас блок сонгож нэмнэ үү</p>
                      <button onClick={(e) => { e.stopPropagation(); setShowBlockPalette(true) }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg">
                        <PlusIcon className="h-5 w-5" />Блок нэмэх
                      </button>
                    </div>
                  </div>
                )}

                {blocks.map(block => {
                  const blockDef = BLOCK_DEFS.find(bt => bt.type === block.type)
                  const Icon = blockDef?.icon || DocumentTextIcon
                  const isSelected = selectedBlockId === block.id
                  const bs = block.style
                  const colorParts = (blockDef?.color || '').split(' ')

                  return (
                    <div key={block.id} id={`block-${block.id}`}
                      onMouseDown={e => handleBlockMouseDown(e, block.id)}
                      onTouchStart={e => handleBlockTouchStart(e, block.id)}
                      onClick={e => { e.stopPropagation(); setSelectedBlockId(block.id); setRightTab('content') }}
                      className={`group absolute ${dragInfo?.blockId === block.id ? 'cursor-grabbing' : 'cursor-grab'} touch-none`}
                      style={{
                        left: `${bs.posX || 0}px`, top: `${bs.posY || 0}px`,
                        width: bs.width ? `${bs.width}px` : 'auto',
                        height: bs.height ? `${bs.height}px` : 'auto',
                        zIndex: parseInt(bs.zIndex || '1'),
                        minWidth: '50px', minHeight: '30px',
                        outline: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
                        outlineOffset: '2px',
                        boxShadow: isSelected ? '0 0 0 4px rgba(59,130,246,0.1), 0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.06)',
                        borderRadius: '8px',
                        transition: (dragInfo?.blockId === block.id || resizeInfo?.blockId === block.id) ? 'none' : 'box-shadow 0.15s, outline 0.15s',
                      }}>

                      {/* Block type badge */}
                      <div className={`absolute -top-7 left-0 z-30 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md font-bold shadow-sm border ${blockDef?.color || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          <Icon className="h-3 w-3" />
                          {blockDef?.label}
                        </span>
                      </div>

                      {/* Block toolbar */}
                      <div className={`absolute -top-7 right-0 flex items-center gap-0.5 z-30 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); duplicateBlock(block.id) }}
                          className="p-1 bg-white border border-slate-200 rounded-md hover:bg-blue-50 hover:border-blue-200 shadow-sm transition-colors" title="Хуулах">
                          <DocumentDuplicateIcon className="h-3 w-3 text-slate-500" />
                        </button>
                        <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); deleteBlock(block.id) }}
                          className="p-1 bg-white border border-red-200 rounded-md hover:bg-red-50 shadow-sm transition-colors" title="Устгах">
                          <TrashIcon className="h-3 w-3 text-red-500" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="w-full h-full overflow-hidden bg-white rounded-lg" style={{ pointerEvents: dragInfo || block.type === 'html' ? 'none' : 'auto' }}>
                        <RenderBlock block={block} lang="mn" />
                      </div>

                      {/* Resize Handles */}
                      {isSelected && RESIZE_HANDLES.map(handle => {
                        const pos: React.CSSProperties = {}
                        if (handle.includes('n')) pos.top = -4
                        if (handle.includes('s')) pos.bottom = -4
                        if (handle.includes('w')) pos.left = -4
                        if (handle.includes('e')) pos.right = -4
                        if (handle === 'n' || handle === 's') { pos.left = '50%'; pos.marginLeft = -4 }
                        if (handle === 'w' || handle === 'e') { pos.top = '50%'; pos.marginTop = -4 }
                        const cursorMap: Record<string, string> = { nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', w: 'w-resize', e: 'e-resize', sw: 'sw-resize', s: 's-resize', se: 'se-resize' }
                        return (
                          <div key={handle} data-resize-handle="true"
                            onMouseDown={e => handleResizeMouseDown(e, block.id, handle)}
                            className="absolute z-40 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white shadow-sm hover:bg-blue-600 hover:scale-125 transition-transform"
                            style={{ ...pos, cursor: cursorMap[handle] }} />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Right: Settings Panel ── */}
          {!showPreview && (
            <div className="hidden lg:flex w-80 bg-white border-l border-slate-200 overflow-y-auto shrink-0 flex-col">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 shrink-0 bg-slate-50/50">
                {[
                  { key: 'content' as const, label: 'Агуулга', disabled: !selectedBlock },
                  { key: 'style' as const, label: 'Загвар', disabled: !selectedBlock },
                  { key: 'page' as const, label: 'Хуудас', disabled: false },
                ].map(tab => (
                  <button key={tab.key} onClick={() => !tab.disabled && setRightTab(tab.key)}
                    className={`flex-1 py-3 text-xs font-bold tracking-wide uppercase transition-all ${rightTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600'} ${tab.disabled ? 'opacity-30 cursor-default' : ''}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                {rightTab === 'content' && selectedBlock ? (
                  <div className="p-4">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 border ${BLOCK_DEFS.find(d => d.type === selectedBlock.type)?.color || 'bg-slate-50 border-slate-200'}`}>
                      {(() => { const def = BLOCK_DEFS.find(d => d.type === selectedBlock.type); const Ic = def?.icon || DocumentTextIcon; return <Ic className="h-4 w-4" /> })()}
                      <span className="text-sm font-bold">{BLOCK_DEFS.find(d => d.type === selectedBlock.type)?.label || selectedBlock.type}</span>
                    </div>
                    <BlockContentEditor block={selectedBlock} onChange={u => updateBlockContent(selectedBlock.id, u)} pageUrl={pageSettings.url} />
                  </div>
                ) : rightTab === 'style' && selectedBlock ? (
                  <div className="p-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl mb-4 border border-slate-200">
                      <span className="text-sm font-bold text-slate-600">Загвар тохиргоо</span>
                    </div>
                    <BlockStyleEditor block={selectedBlock} onChange={u => updateBlockStyle(selectedBlock.id, u)} blocks={blocks} pageUrl={pageSettings.url} />
                  </div>
                ) : (
                  <div>
                    <SettingsSection id="general" title="Ерөнхий">
                      <SInput label="🇲🇳 Гарчиг (MN)" value={pageSettings.title_mn} onChange={v => setPageSettings(s => ({ ...s, title_mn: v }))} placeholder="Хуудасны нэр" />
                      <SInput label="🇺🇸 Title (EN)" value={pageSettings.title_en} onChange={v => setPageSettings(s => ({ ...s, title_en: v }))} placeholder="Page title" />
                      <STextarea label="🇲🇳 Тайлбар (MN)" value={pageSettings.description_mn} onChange={v => setPageSettings(s => ({ ...s, description_mn: v }))} placeholder="Хуудасны товч тайлбар" rows={3} />
                      <STextarea label="🇺🇸 Description (EN)" value={pageSettings.description_en} onChange={v => setPageSettings(s => ({ ...s, description_en: v }))} placeholder="Short page description" rows={3} />
                      <div>
                        <SInput label="URL хаяг" value={pageSettings.url} onChange={v => setPageSettings(s => ({ ...s, url: v }))} placeholder="/about-us" />
                        <p className="text-[10px] text-slate-400 mt-1">Жишээ: /about-us, /services/loan</p>
                      </div>
                      <SInput label="Зураг URL" value={pageSettings.image} onChange={v => setPageSettings(s => ({ ...s, image: v }))} placeholder="https://..." />
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-500 tracking-wide">Зураг хавсаргах</label>
                        <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group">
                          <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={async e => {
                            const inputEl = e.currentTarget
                            const file = inputEl.files?.[0]
                            inputEl.value = ''
                            if (!file) return
                            const url = await uploadFile(file, pageSettings.url)
                            setPageSettings(s => ({ ...s, image: url }))
                          }} />
                          <CloudArrowUpIcon className="h-7 w-7 text-slate-300 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
                          <p className="text-xs text-slate-400 group-hover:text-blue-500">Cover зураг сонгох</p>
                        </div>
                      </div>
                      {pageSettings.image && <img src={pageSettings.image} alt="Preview" className="w-full h-28 object-cover rounded-xl border border-slate-200" />}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <input type="checkbox" checked={pageSettings.active}
                          onChange={e => setPageSettings(s => ({ ...s, active: e.target.checked }))}
                          className="rounded text-blue-600 focus:ring-blue-500" />
                        <div>
                          <span className="text-sm font-semibold text-slate-700">Идэвхтэй</span>
                          <p className="text-[10px] text-slate-400">Вэбсайтад харагдана</p>
                        </div>
                      </div>
                    </SettingsSection>

                    <SettingsSection id="layout" title="Байршил тохиргоо">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <input type="checkbox" checked={layoutSettings.fullWidth}
                          onChange={e => setLayoutSettings(s => ({ ...s, fullWidth: e.target.checked }))}
                          className="rounded text-blue-600 focus:ring-blue-500" />
                        <div>
                          <span className="text-sm font-semibold text-slate-700">Бүтэн өргөн</span>
                          <p className="text-[10px] text-slate-400">Дэлгэцний бүтэн өргөнөөр</p>
                        </div>
                      </div>
                      {!layoutSettings.fullWidth && (
                        <SInput label="Хамгийн их өргөн (px)" value={layoutSettings.maxWidth}
                          onChange={v => setLayoutSettings(s => ({ ...s, maxWidth: v }))} placeholder="1200" />
                      )}
                      <SInput label="Дээш зай (px)" value={layoutSettings.pagePaddingTop}
                        onChange={v => setLayoutSettings(s => ({ ...s, pagePaddingTop: v }))} placeholder="0" type="number" />
                      <SInput label="Доош зай (px)" value={layoutSettings.pagePaddingBottom}
                        onChange={v => setLayoutSettings(s => ({ ...s, pagePaddingBottom: v }))} placeholder="0" type="number" />
                      <SInput label="Зүүн зай (px)" value={layoutSettings.pagePaddingLeft}
                        onChange={v => setLayoutSettings(s => ({ ...s, pagePaddingLeft: v }))} placeholder="0" type="number" />
                      <SInput label="Баруун зай (px)" value={layoutSettings.pagePaddingRight}
                        onChange={v => setLayoutSettings(s => ({ ...s, pagePaddingRight: v }))} placeholder="0" type="number" />
                    </SettingsSection>

                    <SettingsSection id="images" title="Хуудасны зургууд">
                      {(() => {
                        const pageImages = getAllBlockImages(blocks)
                        return (
                          <div className="space-y-2">
                            {pageImages.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-4">Энэ хуудаст хэрэглэгдсэн зураг байхгүй байна.</p>
                            ) : (
                              pageImages.map((img, idx) => {
                                const blockDef = BLOCK_DEFS.find(d => d.type === img.blockType as BlockType)
                                const fileUrl = img.url.startsWith('/') ? `http://127.0.0.1:8000${img.url}` : img.url
                                return (
                                  <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 hover:border-slate-300 transition-colors">
                                    <div className="flex items-center gap-2.5 mb-2">
                                      {blockDef?.icon && (() => { const Icon = blockDef.icon; return <Icon className="h-3.5 w-3.5 text-slate-400" /> })()}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-700">{img.field}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{img.displayName || img.url.split('/').pop() || img.url}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          deleteImage(img.blockId, img.field, blocks, setBlocks)
                                        }}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                        title="Устгах"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                    {img.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) && (
                                      <img src={fileUrl} alt="" className="w-full h-16 object-cover rounded-lg border border-slate-200" onError={() => {}} />
                                    )}
                                  </div>
                                )
                              })
                            )}
                          </div>
                        )
                      })()}
                    </SettingsSection>



                    <SettingsSection id="blocks" title={`Блокууд (${blocks.length})`}>
                      {blocks.length === 0 ? (
                        <p className="text-sm text-slate-400 py-2">Блок нэмэгдээгүй байна</p>
                      ) : (
                        <div className="space-y-1">
                          {blocks.map(b => {
                            const def = BLOCK_DEFS.find(d => d.type === b.type)
                            const Icon = def?.icon || DocumentTextIcon
                            return (
                              <div key={b.id}
                                onClick={() => { setSelectedBlockId(b.id); setRightTab('content') }}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all ${selectedBlockId === b.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                                <Icon className={`h-4 w-4 shrink-0 ${selectedBlockId === b.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className={`text-xs font-medium flex-1 ${selectedBlockId === b.id ? 'text-blue-700' : 'text-slate-600'}`}>{def?.label}</span>
                                <span className="text-[10px] text-slate-400">{b.style.width || 'auto'}px</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </SettingsSection>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Block Palette Modal ── */}
      {showBlockPalette && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBlockPalette(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Блок нэмэх</h3>
                <button onClick={() => setShowBlockPalette(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {BLOCK_DEFS.map(bt => {
                  const Icon = bt.icon
                  const colorParts = bt.color.split(' ')
                  return (
                    <button key={bt.type} onClick={() => addBlock(bt.type)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${colorParts[1]} ${colorParts[2]}`}>
                      <Icon className={`h-6 w-6 ${colorParts[0]}`} />
                      <span className={`text-xs font-semibold ${colorParts[0]}`}>{bt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
