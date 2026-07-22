'use client'

import { useEffect, useState } from 'react'
import { Input, Button, PageHeader } from '@/components/FormElements'
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, LinkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { axiosInstance } from '@/lib/axios'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import Modal from '@/components/Modal'

interface ApiCategory {
  id: number
  slug: string
  icon: string
  image: string
  page_url?: string
  sort_order: number
  active: boolean
  content: unknown[]
  translations: { id?: number; language: number; label: string; description: string }[]
}

interface ApiPage {
  id: number
  url: string
  active: boolean
  title_translations: { id?: number; language: number; label: string }[]
}

interface CategoryFormData {
  slug: string
  icon: string
  active: boolean
  label_mn: string
  label_en: string
  parent_slug?: string
  page_url?: string
}

const defaultForm: CategoryFormData = {
  slug: '',
  icon: '',
  active: true,
  label_mn: '',
  label_en: '',
  parent_slug: '',
  page_url: '',
}

export default function CategoriesTab() {
  const { language, t } = useLanguage()
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [pages, setPages] = useState<ApiPage[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ApiCategory | null>(null)
  const [form, setForm] = useState<CategoryFormData>(defaultForm)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchPages()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get('/about-category/')
      const raw = res.data
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      setCategories(list.map((cat: ApiCategory) => ({
        ...cat,
        slug: normalizeSlugInput(cat.slug),
        page_url: cat.page_url ? normalizeSlugInput(cat.page_url) : cat.page_url,
      })))
    } catch (err) { console.error(err) }
  }

  const fetchPages = async () => {
    try {
      const res = await axiosInstance.get('/page/')
      const raw = res.data
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
      setPages(list)
    } catch (err) { console.error(err) }
  }

  const getLabel = (cat: ApiCategory) => {
    const langId = language === 'mn' ? 2 : 1
    const tr = cat.translations.find(t => t.language === langId)
    const fallback = cat.translations.find(t => t.language !== langId)
    return tr?.label || fallback?.label || cat.slug
  }

  const getDesc = (cat: ApiCategory) => {
    const langId = language === 'mn' ? 2 : 1
    const tr = cat.translations.find(t => t.language === langId)
    const fallback = cat.translations.find(t => t.language !== langId)
    return tr?.description || fallback?.description || ''
  }

  const getPageLabel = (page: ApiPage) => {
    const langId = language === 'mn' ? 1 : 2
    const tr = page.title_translations?.find(t => t.language === langId)
    const fallback = page.title_translations?.find(t => t.language !== langId)
    return tr?.label || fallback?.label || page.url || 'Untitled page'
  }

  const normalizeSlugInput = (value: string) => {
    let raw = (value || '').trim()
    if (!raw) return ''

    try {
      if (/^https?:\/\//i.test(raw)) {
        raw = new URL(raw).pathname
      }
    } catch {
      // Keep the original value if it is not a valid absolute URL.
    }

    return raw
      .split('?')[0]
      .split('#')[0]
      .replace(/^\/+/, '/')
      .trim()
  }

  const formatSlugPath = (slug: string) => {
    const normalized = normalizeSlugInput(slug)
    if (!normalized) return '/'
    return normalized.startsWith('/') ? normalized : `/${normalized}`
  }

  const formatOptionalSlugPath = (slug?: string) => {
    const normalized = normalizeSlugInput(slug || '')
    if (!normalized) return ''
    return normalized.startsWith('/') ? normalized : `/${normalized}`
  }

  const getMatchingPageUrl = (value?: string) => {
    const normalized = normalizeSlugInput(value || '')
    if (!normalized) return ''

    const normalizedKey = normalized.replace(/^\/+/, '')
    const match = pages.find(page => normalizeSlugInput(page.url).replace(/^\/+/, '') === normalizedKey)
    return match ? formatOptionalSlugPath(match.url) : ''
  }

  const getSelectedPageUrl = () => {
    return getMatchingPageUrl(form.page_url || form.slug)
  }

  const getCategorySubtitle = (cat: ApiCategory) => {
    const description = getDesc(cat).trim()
    if (description && /^\/+/.test(description)) {
      return formatSlugPath(description)
    }
    return description || formatSlugPath(cat.page_url || cat.slug)
  }

  const openAdd = () => {
    setEditing(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (cat: ApiCategory) => {
    setEditing(cat)
    const mn = cat.translations.find(t => t.language === 2)
    const en = cat.translations.find(t => t.language === 1)
    setForm({
      slug: cat.page_url || cat.slug,
      icon: cat.icon || '',
      active: cat.active,
      label_mn: mn?.label || '',
      label_en: en?.label || '',
      parent_slug: cat.page_url || cat.slug,
      page_url: cat.page_url || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(defaultForm)
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u0400-\u04ff\u1800-\u18af]+/g, '-')
      .replace(/^-+|-+$/g, '')
      || 'category'
  }

  const getPreviewUrl = () => {
    const fallbackSlug = generateSlug(form.label_en || form.label_mn)
    const slug = normalizeSlugInput(form.slug || fallbackSlug) || fallbackSlug
    return slug.startsWith('/') ? `/about${slug}` : `/about/${slug}`
  }

  const copyUrlToClipboard = () => {
    const url = getPreviewUrl()
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const fallbackSlug = generateSlug(form.label_en || form.label_mn)
    const slug = normalizeSlugInput(form.slug || fallbackSlug) || fallbackSlug
    const pageUrl = normalizeSlugInput(form.page_url || getMatchingPageUrl(slug))
    const payload = {
      slug,
      icon: form.icon,
      page_url: pageUrl || '',
      active: form.active,
      translations: [
        { language: 1, label: form.label_en, description: '' },
        { language: 2, label: form.label_mn, description: '' },
      ],
    }
    try {
      if (editing) {
        await axiosInstance.put(`/about-category/${editing.id}/`, payload)
      } else {
        await axiosInstance.post('/about-category/', payload)
      }
      await fetchCategories()
      closeModal()
    } catch (err) { console.error(err) }
    finally { setIsSaving(false) }
  }

  const handlePageUrlSelect = (parentSlug: string) => {
    const normalizedUrl = formatOptionalSlugPath(parentSlug)
    setForm(f => ({
      ...f,
      parent_slug: parentSlug,
      slug: normalizedUrl,
      page_url: normalizedUrl,
    }))
  }

  const handlePageSelect = (pageUrl: string) => {
    const normalizedUrl = formatOptionalSlugPath(pageUrl)
    setForm(f => ({
      ...f,
      parent_slug: pageUrl,
      slug: normalizedUrl,
      page_url: normalizedUrl,
    }))
  }

  const handleClearPageUrl = () => {
    setForm(f => ({
      ...f,
      parent_slug: '',
      page_url: '',
    }))
  }

  const handleSlugChange = (value: string) => {
    // Check if the value looks like a URL
    if (!value) {
      setForm(f => ({ ...f, slug: value, page_url: '', parent_slug: '' }))
      return
    }

    const trimmedValue = value.trim()
    const isUrl = /^(https?:\/\/|\/)/i.test(trimmedValue)

    if (isUrl) {
      // Extract the path from the URL and set as page_url
      const normalizedUrl = normalizeSlugInput(trimmedValue)
      const matchedPageUrl = getMatchingPageUrl(normalizedUrl)
      setForm(f => ({
        ...f,
        slug: normalizedUrl,
        parent_slug: matchedPageUrl || normalizedUrl,
        page_url: matchedPageUrl || normalizedUrl,
      }))
    } else {
      // Regular slug input
      const matchedPageUrl = getMatchingPageUrl(trimmedValue)
      setForm(f => ({
        ...f,
        slug: trimmedValue,
        parent_slug: matchedPageUrl,
        page_url: matchedPageUrl,
      }))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('Устгах уу?', 'Are you sure to delete?'))) return
    await axiosInstance.delete(`/about-category/${id}/`)
    fetchCategories()
  }

  const moveItem = async (index: number, dir: -1 | 1) => {
    const newList = [...categories]
    const target = index + dir
    if (target < 0 || target >= newList.length) return
    ;[newList[index], newList[target]] = [newList[target], newList[index]]
    setCategories(newList)
    // Save order
    try {
      await axiosInstance.post('/about-category/reorder/', {
        items: newList.map((c, i) => ({ id: c.id, sort_order: i })),
      })
    } catch (err) { console.error(err) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Бидний тухай ангилал', 'About Categories')}
        description={t('Бидний тухай хуудасны ангилалуудыг удирдах', 'Manage about page categories')}
        action={
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="dark" onClick={openAdd} icon={<PlusIcon className="h-4 w-4" />}>
              {t('Нэмэх', 'Add')}
            </Button>
          </div>
        }
      />

      {/* Category list */}
      <div className="space-y-3">
        {categories.map((cat, idx) => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 group hover:shadow-md transition">
            {/* Sort arrows */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveItem(idx, -1)}
                disabled={idx === 0}
                className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 transition"
              >
                <ChevronUpIcon className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => moveItem(idx, 1)}
                disabled={idx === categories.length - 1}
                className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 transition"
              >
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Image */}
            {cat.image && (
              <img src={cat.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{getLabel(cat)}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {cat.active ? t('Идэвхтэй', 'Active') : t('Идэвхгүй', 'Inactive')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{getCategorySubtitle(cat)}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => openEdit(cat)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                <PencilIcon className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition">
                <TrashIcon className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            {t('Ангилал байхгүй байна', 'No categories yet')}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? t('Ангилал засах', 'Edit Category') : t('Шинэ ангилал', 'Add Category')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {false && !editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Хуудас сонгох', 'Select Page')}
              </label>
              <select
                value={form.parent_slug || ''}
                onChange={(e) => handlePageUrlSelect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">{t('Хуудас сонгоно уу...', 'Select a page...')}</option>
                {pages.map(page => (
                  <option key={page.id} value={formatOptionalSlugPath(page.url)}>
                    {getPageLabel(page)} ({formatOptionalSlugPath(page.url)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t('Хуудас сонгосноор Slug автоматаар дүүрнэ', 'Selecting a page will auto-fill the Slug')}
              </p>
            </div>
          )}

          {/* Linked Page Selector (kept hidden; Slug (URL) below is the single source of truth) */}
          <div className="hidden">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Холбогдох хуудас', 'Link to Page')}
            </label>
            <select
              value={getSelectedPageUrl() || form.page_url || ''}
              onChange={(e) => handlePageSelect(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">{t('Хуудас холбохгүй', 'No page link')}</option>
              {pages.map(page => (
                <option key={page.id} value={formatOptionalSlugPath(page.url)}>
                  {getPageLabel(page)} ({formatOptionalSlugPath(page.url)})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t('Ангилал дээр дарахад энэ хуудас нээгдэнэ', 'When clicking on the category, this page will open')}
            </p>
          </div>

          {form.page_url && (
            <div className="hidden bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">{t('Холбогдсон хуудас', 'Linked Page')}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-blue-900">{formatSlugPath(form.page_url)}</p>
                <button
                  type="button"
                  onClick={handleClearPageUrl}
                  className="text-xs px-2 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300 transition"
                >
                  {t('Холбоо тасрах', 'Unlink')}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('Нэр (Монгол)', 'Name (Mongolian)')}
              value={form.label_mn}
              onChange={e => setForm(f => ({ ...f, label_mn: e.target.value }))}
              required
            />
            <Input
              label={t('Нэр (Англи)', 'Name (English)')}
              value={form.label_en}
              onChange={e => setForm(f => ({ ...f, label_en: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Slug (URL)
            </label>
            <select
              value={getSelectedPageUrl()}
              onChange={(e) => handlePageUrlSelect(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900"
            >
              <option value="">{t('Хуудас удирдахаас URL сонгох...', 'Select URL from Pages...')}</option>
              {pages.map(page => {
                const pageUrl = formatOptionalSlugPath(page.url)
                return (
                  <option key={page.id} value={pageUrl}>
                    {getPageLabel(page)} ({pageUrl})
                  </option>
                )
              })}
            </select>
            <Input
            list="about-category-page-urls"
            value={form.slug}
            onChange={e => handleSlugChange(e.target.value)}
            placeholder={t('Автоматаар үүснэ эсвэл линк оруулна уу', 'Auto-generated or enter URL')}
          />
            <datalist id="about-category-page-urls">
              {pages.map(page => {
                const pageUrl = formatOptionalSlugPath(page.url)
                return (
                  <option key={page.id} value={pageUrl}>
                    {getPageLabel(page)}
                  </option>
                )
              })}
            </datalist>
          <p className="text-xs text-gray-600 mt-1 px-1">
            💡 {t('Slug талбарт линк оруулж болно:', 'You can enter a link in the Slug field:')} 
            <br />
            • <code className="bg-gray-100 px-1 rounded text-xs">/page-slug</code> 
            <br />
            • <code className="bg-gray-100 px-1 rounded text-xs">http://localhost:3000/page</code>
            <br />
            {t('Систем автоматаар линкийг задалж "Холбогдох хуудас" рүү оруулна', 'System will auto-parse and populate the page link')}
          </p>
          </div>

          {form.page_url && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">{t('Хэрэглэгч хэсэгт дуудагдах хуудас', 'Page shown on user site')}</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-mono text-blue-900 truncate">{formatSlugPath(form.page_url)}</p>
                <button
                  type="button"
                  onClick={handleClearPageUrl}
                  className="text-xs px-2 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300 transition shrink-0"
                >
                  {t('Холбоо таслах', 'Unlink')}
                </button>
              </div>
            </div>
          )}

          {/* URL Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <LinkIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-600 font-medium mb-1">{t('Хуудасны URL', 'Page URL')}</p>
                <p className="text-sm font-mono text-blue-900 truncate">{getPreviewUrl()}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={copyUrlToClipboard}
              className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-200 text-green-800'
                  : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
              }`}
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <CheckIcon className="w-4 h-4" />
                  {t('Хуулсан', 'Copied')}
                </span>
              ) : (
                t('Хуулах', 'Copy')
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cat-active"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="cat-active" className="text-sm text-gray-700">{t('Идэвхтэй', 'Active')}</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg text-sm">
              {t('Цуцлах', 'Cancel')}
            </button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {isSaving ? t('Хадгалж байна...', 'Saving...') : editing ? t('Шинэчлэх', 'Update') : t('Нэмэх', 'Add')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
