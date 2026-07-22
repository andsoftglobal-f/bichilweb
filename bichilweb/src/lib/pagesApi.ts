
import axiosInstance from '@/config/axiosConfig'
import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'

const API_BASE_URL = getApiBase();
const JSON_FETCH_OPTIONS = {
  headers: { Accept: 'application/json' },
  cache: 'no-store' as RequestCache,
};

export interface Translation {
  id: number;
  language: number; 
  label: string;
  font: string;
  family: string;
  weight: string;
  size: string;
}

export interface PageData {
  id: number;
  slug: string;
  url: string;
  active: boolean;
  image: string;
  content_blocks: string | null;
  title_translations: Translation[];
  description_translations: Translation[];
  meta_description_mn?: string;
  meta_description_en?: string;
  created_at: string;
  updated_at: string;
}

export interface PagesApiResponse {
  data: PageData[];
  total?: number;
  page?: number;
  limit?: number;
}

export function normalizePageSlugInput(value?: string): string {
  let raw = (value || '').trim();
  if (!raw) return '';

  try {
    if (/^https?:\/\//i.test(raw)) {
      raw = new URL(raw).pathname;
    }
  } catch {
    // If it is not a valid absolute URL, treat it as a normal slug/path.
  }

  return raw
    .split('?')[0]
    .split('#')[0]
    .replace(/^\/+/, '')
    .trim();
}

function getPageSlugCandidates(value?: string): string[] {
  const normalized = normalizePageSlugInput(value);
  if (!normalized) return [];

  const candidates = [normalized];
  for (const prefix of ['pages/', 'about/']) {
    if (normalized.startsWith(prefix)) {
      candidates.push(normalized.slice(prefix.length));
    }
  }

  const caseVariants = candidates.flatMap(candidate => [candidate, candidate.toLowerCase()]);
  return Array.from(new Set(caseVariants.filter(Boolean)));
}

async function fetchPublishedPageByCandidates(candidates: string[]): Promise<PageData | null> {
  const allPages = await fetchPublishedPages();
  const found = allPages.find((p: PageData) => {
    const pageCandidates = getPageSlugCandidates(p.url || '');
    return pageCandidates.some(pageUrl => candidates.includes(pageUrl));
  });
  return found || null;
}


export async function fetchPublishedPages(): Promise<PageData[]> {
  try {
    const params = new URLSearchParams({ active: 'true' });
    const response = await fetch(`${API_BASE_URL}/page/?${params.toString()}`, JSON_FETCH_OPTIONS);
    if (!response.ok) return [];

    const rawData = await response.json();
    if (rawData.data && Array.isArray(rawData.data)) return rawData.data;
    if (Array.isArray(rawData)) return rawData;
    if (rawData.results && Array.isArray(rawData.results)) return rawData.results;
    return [];
  } catch (error) {
    logApiWarning('Published pages', error);
    return [];
  }
}


export async function fetchAllPages(): Promise<PageData[]> {
  try {
    const response = await axiosInstance.get('/pages/');

    if (response && response.status === 200) {
      // Handle paginated response: {count, next, previous, results: [...]}
      const rawData = response.data;
      if (rawData.data && Array.isArray(rawData.data)) {
        return rawData.data;
      }
      if (Array.isArray(rawData)) {
        return rawData;
      }
      if (rawData.results && Array.isArray(rawData.results)) {
        return rawData.results;
      }
      return [];
    }
    
    return [];
  } catch (error) {
    logApiWarning('All pages', error);
    return [];
  }
}


export async function fetchPageBySlug(slug: string): Promise<PageData | null> {
  const candidates = getPageSlugCandidates(slug);

  try {
    const lookupCandidates = candidates.length > 0 ? candidates : [''];

    // Try by-url endpoint first (matches page URL field)
    for (const candidate of lookupCandidates) {
      const lookupUrl = candidate ? `/${candidate}` : '/';
      try {
        const params = new URLSearchParams({ url: lookupUrl });
        const response = await fetch(`${API_BASE_URL}/page/by-url/?${params.toString()}`, JSON_FETCH_OPTIONS);
        if (response.status === 404) continue;
        if (!response.ok) throw new Error(`Page lookup failed: ${response.status}`);
        return await response.json();
      } catch (candidateError: unknown) {
        throw candidateError;
      }
    }
    return fetchPublishedPageByCandidates(candidates);
  } catch {
    // If direct lookup fails, try fetching all pages and matching flexible paths.
    try {
      return await fetchPublishedPageByCandidates(candidates);
    } catch { return null; }
  }
}

export async function fetchPageById(id: number): Promise<PageData | null> {
  try {
    const response = await axiosInstance.get(`/page/${id}/`);

    if (response && response.status === 200) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    logApiWarning(`Page ID ${id}`, error);
    return null;
  }
}


export async function createPage(page: Partial<PageData>): Promise<PageData | null> {
  try {
    const response = await axiosInstance.post('/pages/', page);

    if (response && response.status === 201) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    logApiWarning('Create page', error);
    throw error;
  }
}


export async function updatePage(id: number, page: Partial<PageData>): Promise<PageData | null> {
  try {
    const response = await axiosInstance.put(`/pages/${id}`, page);

    if (response && response.status === 200) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    logApiWarning(`Update page ${id}`, error);
    throw error;
  }
}

export async function deletePage(id: number): Promise<boolean> {
  try {
    const response = await axiosInstance.delete(`/pages/${id}`);

    return response && response.status === 200;
  } catch (error) {
    logApiWarning(`Delete page ${id}`, error);
    return false;
  }
}

export function getTranslation(translations: Translation[], language: number): Translation {
  return translations.find(t => t.language === language) || translations[0];
}

export function getTitle(page: PageData, language: 'mn' | 'en'): string {
  const langId = language === 'mn' ? 1 : 2;
  const translation = getTranslation(page.title_translations, langId);
  return translation?.label || '';
}

export function getDescription(page: PageData, language: 'mn' | 'en'): string {
  const langId = language === 'mn' ? 1 : 2;
  const translation = getTranslation(page.description_translations, langId);
  return translation?.label || '';
}
