import { logApiWarning } from '@/lib/apiError';
import { getApiBase } from '@/lib/apiBase';
import { getLocale } from '@/lib/serverLocale';
import GovernanceTabClient, { type CategoryAPI, type MemberAPI } from './GovernanceTabClient';

async function getGovernanceData(): Promise<{ members: MemberAPI[]; categories: CategoryAPI[] }> {
  try {
    const API_URL = getApiBase();
    const [membersRes, catsRes] = await Promise.all([
      fetch(`${API_URL}/management/`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/management-category/`, { next: { revalidate: 60 } }),
    ]);
    if (!membersRes.ok || !catsRes.ok) throw new Error('Failed');
    const membersRaw = await membersRes.json();
    const catsRaw = await catsRes.json();
    const members: MemberAPI[] = Array.isArray(membersRaw) ? membersRaw : Array.isArray(membersRaw?.results) ? membersRaw.results : [];
    const categories: CategoryAPI[] = Array.isArray(catsRaw) ? catsRaw : Array.isArray(catsRaw?.results) ? catsRaw.results : [];
    return { members, categories };
  } catch (err) {
    logApiWarning('Governance data', err);
    return { members: [], categories: [] };
  }
}

export default async function GovernanceTab() {
  const [locale, { members, categories }] = await Promise.all([getLocale(), getGovernanceData()]);

  return <GovernanceTabClient members={members} categories={categories} language={locale} />;
}
