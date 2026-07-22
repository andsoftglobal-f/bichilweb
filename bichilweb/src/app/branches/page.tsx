import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import { getLocale } from '@/lib/serverLocale'
import BranchesPageClient, { defaultSettings, type Branch, type BranchCategory, type BranchSettings } from './BranchesPageClient'

async function getBranchesData(): Promise<{ branches: Branch[]; categories: BranchCategory[]; settings: BranchSettings; error: boolean }> {
  try {
    const [branchRes, catRes, settingsRes] = await Promise.all([
      fetch(`${getApiBase()}/branch/`, { next: { revalidate: 60 } }),
      fetch(`${getApiBase()}/branch-category/`, { next: { revalidate: 60 } }),
      fetch(`${getApiBase()}/branch-settings/`, { next: { revalidate: 60 } }),
    ])

    if (!branchRes.ok || !catRes.ok) {
      return { branches: [], categories: [], settings: defaultSettings, error: true }
    }

    const branchRaw = await branchRes.json()
    const branches: Branch[] = Array.isArray(branchRaw) ? branchRaw : Array.isArray(branchRaw?.results) ? branchRaw.results : []

    const catRaw = await catRes.json()
    const catArr: BranchCategory[] = Array.isArray(catRaw) ? catRaw : Array.isArray(catRaw?.results) ? catRaw.results : []
    const categories = catArr.filter((c) => c.active).sort((a, b) => a.sort_order - b.sort_order)

    const settingsData = settingsRes.ok ? await settingsRes.json() : null
    const settings = settingsData ? { ...defaultSettings, ...settingsData } : defaultSettings

    return { branches, categories, settings, error: false }
  } catch (err) {
    logApiWarning('Branches', err)
    return { branches: [], categories: [], settings: defaultSettings, error: true }
  }
}

export default async function BranchesPage() {
  const [locale, data] = await Promise.all([getLocale(), getBranchesData()])

  return (
    <BranchesPageClient
      locale={locale}
      branches={data.branches}
      categories={data.categories}
      settings={data.settings}
      error={data.error}
    />
  )
}
