import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_API_URL = (process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

/**
 * Same-origin proxy to Django's public read API. This site has no auth
 * token to protect, but per the report's BFF requirement the browser still
 * shouldn't call Django directly — this keeps the backend's real address
 * out of the client bundle and gives the app one place to add caching or
 * rate-limiting later. Only forwards to /api/v1/ — nothing else.
 */
type RouteContext = { params: Promise<{ path: string[] }> }

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params

  // Reject traversal/absolute-URL-looking segments before they ever reach
  // string interpolation below — see the admin app's equivalent proxy route
  // for the fuller writeup of why this matters even though targetPath is
  // always appended to BACKEND_API_URL here, never treated as a full URL.
  if (path.some((segment) => segment === '..' || segment === '.' || segment.includes('\\') || /^[a-z][a-z0-9+.-]*:/i.test(segment))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const targetPath = path.join('/')
  const search = request.nextUrl.search

  const init: RequestInit = { method: request.method, cache: 'no-store' }

  // Forward whatever X-Forwarded-For this request arrived with (set by
  // Render's edge in front of THIS app) so Django's NUM_PROXIES-based IP
  // resolution (settings.py) can recover the real visitor IP through this
  // BFF hop instead of every proxied request looking like it came from
  // this server.
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

  const upstream = await fetch(`${BACKEND_API_URL}/${targetPath}/${search}`, init)
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
