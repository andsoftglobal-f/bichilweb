import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

/**
 * The ONLY HTTP client admin pages should use for data fetching. It never
 * talks to Django directly — baseURL is same-origin, relative, and proxied
 * server-side through src/app/api/proxy/[...path]/route.ts, which is where
 * the session's bearer token actually gets attached. No token is ever held
 * in browser JavaScript.
 *
 * src/app/config/axiosConfig.tsx re-exports this same instance as its
 * default export so existing `import axiosInstance from '@/config/axiosConfig'`
 * call sites keep working without touching every page file.
 */
export const axiosInstance = axios.create({
  baseURL: '/api/proxy',
  timeout: 300000, // 5 min — large video uploads via some admin forms can be slow
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

let refreshPromise: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true
      const refreshed = await refreshSession()
      if (refreshed) {
        return axiosInstance(originalRequest)
      }
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
      }
    }

    return Promise.reject(error)
  }
)
