/**
 * Resolves the right base URL for calling the API depending on where the
 * code actually runs:
 *  - In the browser: the same-origin proxy (/api/proxy/...), which never
 *    exposes Django's real address or requires CORS.
 *  - On the server (Server Components, route handlers): straight to Django
 *    — this is already server-to-server, never reaches the browser, so
 *    proxying through our own proxy route would just be a pointless extra
 *    hop.
 *
 * Any module that might be imported from both a client and a server
 * component (src/lib/axios.tsx, src/lib/pagesApi.ts, etc.) should resolve
 * its base URL through this function rather than hardcoding one or the
 * other, since Next.js evaluates the same module separately per context.
 */
export function getApiBase(): string {
  if (typeof window === 'undefined') {
    return (process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')
  }
  return '/api/proxy'
}
