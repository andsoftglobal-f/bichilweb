import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic'

// No Django model/RBAC backs the admin_items table (see [category]/route.ts)
// — both actions here mutate it, so both require Super Admin.
async function requireAdminWrite() {
    const user = await requireSuperAdmin()
    if (!user) {
        return NextResponse.json({ error: 'Энэ үйлдэлд Super Admin эрх шаардлагатай.' }, { status: 403 })
    }
    return null
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ category: string; id: string }> }
) {
    const unauthorized = await requireAdminWrite()
    if (unauthorized) return unauthorized

    const { category, id } = await params;
    const body = await request.json();
    const { title, image_url, payload } = body;

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'DB холболтгүй' }, { status: 503 });

    const client = await pool.connect();
    try {
        const result = await client.query(
            'UPDATE admin_items SET title = $1, image_url = $2, payload = $3, updated_at = now() WHERE id = $4 AND category = $5 RETURNING *',
            [title, image_url, payload, id, category]
        );
        if (result.rowCount === 0) {
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
    { params }: { params: Promise<{ category: string; id: string }> }
) {
    const unauthorized = await requireAdminWrite()
    if (unauthorized) return unauthorized

    const { category, id } = await params;
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'DB холболтгүй' }, { status: 503 });

    const client = await pool.connect();
    try {
        const result = await client.query(
            'DELETE FROM admin_items WHERE id = $1 AND category = $2 RETURNING *',
            [id, category]
        );
        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
