'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { PageHeader } from '@/components/FormElements'
import { axiosInstance } from '@/lib/axios'
import {
  ArrowTopRightOnSquareIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface Translation {
  id?: number
  language: number
  label: string
}

interface PageItem {
  id: number
  url: string
  active: boolean
  title_translations?: Translation[]
}

interface HomePageLink {
  id?: number
  title: string
  page_url: string
  placement: string
  sort_order: number
  active: boolean
}

const PLACEMENTS = [
  { value: 'before-hero', label: 'Hero banner-ийн өмнө' },
  { value: 'after-hero', label: 'Hero banner-ийн дараа' },
  { value: 'after-cta', label: 'CTA слайдерийн дараа' },
  { value: 'after-stats', label: 'Үзүүлэлтүүдийн дараа' },
  { value: 'after-app-download', label: 'Апп татах хэсгийн дараа' },
  { value: 'after-news', label: 'Мэдээ хэсгийн дараа' },
  { value: 'after-partners', label: 'Хамтрагчдын дараа' },
  { value: 'after-product-tutorials', label: 'Бүтээгдэхүүний зааврын дараа' },
]

const emptyForm: HomePageLink = {
  title: '',
  page_url: '',
  placement: 'after-hero',
  sort_order: 0,
  active: true,
}

function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object' && Array.isArray((raw as { results?: unknown[] }).results)) {
    return (raw as { results: T[] }).results
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown[] }).data)) {
    return (raw as { data: T[] }).data
  }
  return []
}

function getPageTitle(page?: PageItem) {
  if (!page) return ''
  const translations = page.title_translations || []
  const mn = translations.find((item) => item.language === 1)
  const en = translations.find((item) => item.language === 2)
  return mn?.label || en?.label || page.url
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).pathname || '/'
    } catch {
      return trimmed
    }
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function getPlacementLabel(value: string) {
  return PLACEMENTS.find((item) => item.value === value)?.label || value
}

function getPublicSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  if (typeof window === 'undefined') return 'http://127.0.0.1:3000'
  return window.location.origin.replace(':3001', ':3000')
}

export default function PageLinksAdminPage() {
  const [pages, setPages] = useState<PageItem[]>([])
  const [links, setLinks] = useState<HomePageLink[]>([])
  const [form, setForm] = useState<HomePageLink>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [pagesRes, linksRes] = await Promise.all([
        axiosInstance.get('/page/'),
        axiosInstance.get('/home-page-links/'),
      ])
      setPages(toArray<PageItem>(pagesRes.data))
      setLinks(toArray<HomePageLink>(linksRes.data))
    } catch (error) {
      console.error('Failed to load page links:', error)
      alert('Мэдээлэл татахад алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const selectPage = (url: string) => {
    const normalized = normalizeUrl(url)
    const page = pages.find((item) => normalizeUrl(item.url || '') === normalized)
    setForm((prev) => ({
      ...prev,
      page_url: normalized,
      title: prev.title || getPageTitle(page),
    }))
  }

  const editLink = (item: HomePageLink) => {
    setEditingId(item.id || null)
    setForm({
      id: item.id,
      title: item.title || '',
      page_url: item.page_url || '',
      placement: item.placement || 'after-hero',
      sort_order: item.sort_order || 0,
      active: item.active !== false,
    })
  }

  const saveLink = async () => {
    const pageUrl = normalizeUrl(form.page_url)
    if (!pageUrl) {
      alert('Холбох хуудасны URL сонгоно уу')
      return
    }

    const page = pages.find((item) => normalizeUrl(item.url || '') === pageUrl)
    const payload = {
      title: (form.title || getPageTitle(page) || pageUrl).trim(),
      page_url: pageUrl,
      placement: form.placement,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
    }

    setSaving(true)
    try {
      if (editingId) {
        await axiosInstance.put(`/home-page-links/${editingId}/`, payload)
      } else {
        await axiosInstance.post('/home-page-links/', payload)
      }
      await loadData()
      resetForm()
      alert('Хуудасны холбоос хадгалагдлаа')
    } catch (error) {
      console.error('Failed to save page link:', error)
      alert('Хадгалахад алдаа гарлаа')
    } finally {
      setSaving(false)
    }
  }

  const deleteLink = async (id?: number) => {
    if (!id || !confirm('Энэ холбоосыг устгах уу?')) return
    try {
      await axiosInstance.delete(`/home-page-links/${id}/`)
      await loadData()
      if (editingId === id) resetForm()
    } catch (error) {
      console.error('Failed to delete page link:', error)
      alert('Устгахад алдаа гарлаа')
    }
  }

  const openUserPage = (url: string) => {
    const pageUrl = normalizeUrl(url)
    if (!pageUrl) return
    window.open(`${getPublicSiteOrigin()}${pageUrl}`, '_blank', 'noopener,noreferrer')
  }

  const sortedLinks = [...links].sort((a, b) => {
    const placementA = PLACEMENTS.findIndex((p) => p.value === a.placement)
    const placementB = PLACEMENTS.findIndex((p) => p.value === b.placement)
    return (placementA - placementB) || ((a.sort_order || 0) - (b.sort_order || 0)) || ((a.id || 0) - (b.id || 0))
  })

  return (
    <AdminLayout title="Хуудас холбох">
      <div className="space-y-6">
        <PageHeader
          title="Хуудас холбох"
          description="Хуудас удирдахаас үүсгэсэн URL-ийг нүүр хуудасны сонгосон байрлалд дуудаж харуулна"
        />

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Холбоос засах' : 'Шинэ холбоос'}</h2>
                <p className="text-sm text-slate-500">Page URL сонгоод хаана гарахыг тохируулна.</p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Шинэ
                </button>
              )}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Хуудас сонгох</span>
                <select
                  value={form.page_url}
                  onChange={(event) => selectPage(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Хуудас удирдахаас URL сонгох...</option>
                  {pages.map((page) => (
                    <option key={page.id} value={normalizeUrl(page.url || '')}>
                      {getPageTitle(page)} - {normalizeUrl(page.url || '')}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">URL гараар оруулах</span>
                <input
                  value={form.page_url}
                  onChange={(event) => setForm((prev) => ({ ...prev, page_url: event.target.value }))}
                  placeholder="/BIS"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Админд харагдах нэр</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Жишээ: BIS хөгжлийн төв"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Нүүр хуудсанд гарах байрлал</span>
                <select
                  value={form.placement}
                  onChange={(event) => setForm((prev) => ({ ...prev, placement: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {PLACEMENTS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Дараалал</span>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(event) => setForm((prev) => ({ ...prev, sort_order: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex h-[42px] items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                  />
                  Идэвхтэй
                </label>
              </div>

              <button
                type="button"
                onClick={saveLink}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusIcon className="h-5 w-5" />
                {saving ? 'Хадгалж байна...' : editingId ? 'Шинэчлэх' : 'Холбоос хадгалах'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Холбогдсон хуудсууд</h2>
                <p className="text-sm text-slate-500">Идэвхтэй холбоосууд нүүр хуудсанд автоматаар дуудагдана.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{links.length}</span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">Ачааллаж байна...</div>
            ) : sortedLinks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                <LinkIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-700">Одоогоор холбоос нэмэгдээгүй байна</p>
                <p className="mt-1 text-sm text-slate-500">Зүүн талын form-оор page URL сонгоод хадгалаарай.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedLinks.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{item.title || item.page_url}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {item.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>{item.page_url}</span>
                        <span>{getPlacementLabel(item.placement)}</span>
                        <span>Дараалал: {item.sort_order || 0}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openUserPage(item.page_url)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-white hover:text-blue-600"
                        title="Хэрэглэгч талд нээх"
                      >
                        <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editLink(item)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-white hover:text-blue-600"
                        title="Засах"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLink(item.id)}
                        className="rounded-xl border border-red-100 p-2 text-red-500 hover:bg-red-50"
                        title="Устгах"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
