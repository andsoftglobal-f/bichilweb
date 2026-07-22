import { NextRequest, NextResponse } from 'next/server'
import { djangoFetch } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * Generic authenticated Backend-for-Frontend proxy: every admin page's data
 * fetching goes through this same-origin route instead of calling Django
 * directly from the browser (src/lib/axios.tsx / src/app/config/axiosConfig.tsx
 * point here). The server attaches the signed-in user's own bearer token —
 * it never elevates privileges — so Django's per-view RBAC (see
 * app/accounts/permissions.py in the backend) is still the authority on
 * whether a request is actually allowed; this route only makes sure the
 * token itself never has to live in browser JavaScript.
 *
 * Only forwards to Django's /api/v1/ namespace — nothing else is reachable
 * through it.
 */

type RouteContext = { params: Promise<{ path: string[] }> }

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params

  // Defense in depth: djangoFetch() always resolves its path argument
  // against BACKEND_API_URL now (see src/lib/session.ts), so this can no
  // longer be redirected to an external host purely via targetPath — but
  // reject anything that even looks like it's trying to (an absolute URL,
  // a traversal segment, or a raw '\' Windows-style separator some parsers
  // treat as '/') rather than relying on that alone.
  if (path.some((segment) => segment === '..' || segment === '.' || segment.includes('\\') || /^[a-z][a-z0-9+.-]*:/i.test(segment))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const targetPath = path.join('/')
  const search = request.nextUrl.search

  const init: RequestInit = { method: request.method }

  // Forward whatever X-Forwarded-For this request arrived with (set by
  // Render's edge in front of THIS app) so Django's NUM_PROXIES-based IP
  // resolution (settings.py) can still recover the real visitor IP through
  // this BFF hop, instead of every proxied request looking like it came
  // from this server. See NUM_PROXIES in bichilglobusweb/settings.py.
  const forwardedFor = request.headers.get('x-forwarded-for')
  const headers = new Headers()
  if (forwardedFor) headers.set('X-Forwarded-For', forwardedFor)

  if (!['GET', 'HEAD'].includes(request.method)) {
    const contentType = request.headers.get('content-type') || ''
    if (contentType) headers.set('Content-Type', contentType)
    const buffer = await request.arrayBuffer()
    if (buffer.byteLength > 0) init.body = buffer
  }

  init.headers = headers

  const upstream = await djangoFetch(`${targetPath}/${search}`, init)

  const responseContentType = upstream.headers.get('content-type') || ''
  const body = await upstream.arrayBuffer()

  return new NextResponse(body, {
    status: upstream.status,
    headers: responseContentType ? { 'Content-Type': responseContentType } : undefined,
  })
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forward(request, context)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forward(request, context)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return forward(request, context)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forward(request, context)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return forward(request, context)
}
