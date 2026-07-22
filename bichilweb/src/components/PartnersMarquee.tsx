import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import type { Locale } from '@/lib/i18n'
import PartnersMarqueeClient, { DEFAULT_SECTION_CONFIG, type Partner, type PartnerSectionConfig } from './PartnersMarqueeClient'

function normalizePartners(raw: unknown): Partner[] {
  const items: Partner[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { results?: unknown }).results)
      ? (raw as { results: Partner[] }).results
      : []

  return items.filter((p) => p.active && p.logo_url)
}

async function getPartners(): Promise<Partner[]> {
  try {
    const res = await fetch(`${getApiBase()}/partners/`, { next: { revalidate: 60 } })
    return res.ok ? normalizePartners(await res.json()) : []
  } catch (err) {
    logApiWarning('Partners', err)
    return []
  }
}

async function getSectionConfig(): Promise<PartnerSectionConfig> {
  try {
    const res = await fetch(`${getApiBase()}/partner-section-config/`, { next: { revalidate: 60 } })
    const data = res.ok ? await res.json() : null
    return data ? { ...DEFAULT_SECTION_CONFIG, ...data } : DEFAULT_SECTION_CONFIG
  } catch (err) {
    logApiWarning('Partner section config', err)
    return DEFAULT_SECTION_CONFIG
  }
}

export default async function PartnersMarquee({ locale }: { locale: Locale }) {
  const [partners, sectionConfig] = await Promise.all([getPartners(), getSectionConfig()])

  if (partners.length === 0) return null

  return <PartnersMarqueeClient partners={partners} sectionConfig={sectionConfig} language={locale} />
}
