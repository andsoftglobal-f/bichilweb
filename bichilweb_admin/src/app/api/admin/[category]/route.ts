import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser, requireSuperAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic'

/**
 * Generic key/value admin content store (the `admin_items` table) — used by
 * simple list-style admin features (e.g. the homepage slides editor) that
 * don't warrant their own Django model. Real content types with their own
 * Django models (products, branches, news, ...) are managed through Django
 * directly via src/lib/axios.tsx + src/app/api/proxy — see the removed
 * product/branch/news-specific SQL that used to live here: those branches
 * were dead (their pages call Django) and, worse, wrote to the same tables
 * Django manages with none of Django's validation, so they're gone rather
 * than fixed.
 */

async function requireAuth() {
    const user = await getCurrentUser()
    if (!user) {
        return NextResponse.json({ error: 'Нэвтрэх шаардлагатай.' }, { status: 401 })
    }
    return null
}

// This table has no Django model behind it, so none of Django's per-view
// Group/Permission RBAC applies here — getCurrentUser() alone only proves
// *authentication*, not that the caller is allowed to mutate content. Every
// write path (POST/PUT/DELETE) requires Super Admin; only read (GET) is
// open to any authenticated staff member.
async function requireAdminWrite() {
    const user = await requireSuperAdmin()
    if (!user) {
        return NextResponse.json({ error: 'Энэ үйлдэлд Super Admin эрх шаардлагатай.' }, { status: 403 })
    }
    return null
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ category: string }> }
) {
    const unauthorized = await requireAuth()
    if (unauthorized) return unauthorized

    const { category } = await params;
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'DB холболтгүй' }, { status: 503 });

    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT * FROM admin_items WHERE category = $1 ORDER BY created_at DESC',
            [category]
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ category: string }> }
) {
    const unauthorized = await requireAdminWrite()
    if (unauthorized) return unauthorized

    const { category } = await params;
    const body = await request.json();
    const { title, image_url, payload } = body;

    if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'DB холболтгүй' }, { status: 503 });

    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO admin_items (category, title, image_url, payload) VALUES ($1, $2, $3, $4) RETURNING *',
            [category, title, image_url, payload]
        );
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating item:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ category: string }> }
) {
    const unauthorized = await requireAdminWrite()
    if (unauthorized) return unauthorized

    const { category } = await params;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { title, image_url, payload } = body;
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'DB холболтгүй' }, { status: 503 });

    const client = await pool.connect();
    try {
        const result = await client.query(
            'UPDATE admin_items SET title = $1, image_url = $2, payload = $3, updated_at = now() WHERE id = $4 AND category = $5 RETURNING *',
            [title, image_url, payload, id, category]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating item:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ category: string }> }
) {
    const unauthorized = await requireAdminWrite()
    if (unauthorized) return unauthorized

    const { category } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'DB холболтгүй' }, { status: 503 });

    const client = await pool.connect();
    try {
        const result = await client.query(
            'DELETE FROM admin_items WHERE id = $1 AND category = $2 RETURNING *',
            [id, category]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
