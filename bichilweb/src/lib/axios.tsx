import axios from 'axios'
import { logApiWarning } from './apiError'
import { getApiBase } from './apiBase'

/**
 * The only HTTP client pages/components should use for data fetching. It
 * never talks to Django directly from the browser — baseURL is same-origin,
 * relative, and proxied server-side through src/app/api/proxy/[...path]/route.ts.
 * This keeps the Django backend's real address out of the browser bundle and
 * gives the app one place to add caching/rate-limiting later, matching the
 * report's BFF requirement even though this site has no auth token to hide.
 *
 * src/config/axiosConfig.tsx re-exports this same instance as its default
 * export so existing `import axiosInstance from '@/config/axiosConfig'`
 * call sites keep working without touching every page file.
 */
export const axiosInstance = axios.create({
  baseURL: getApiBase(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Django REST Framework pagination хариуг задлах туслах функц.
 * Paginated: { count, next, previous, results: [...] }
 * Plain array: [...]
 */
export function extractResults<T = unknown>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'results' in data) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as T[];
  }
  return [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    logApiWarning('Response', error)
    return Promise.reject(error)
  }
)
