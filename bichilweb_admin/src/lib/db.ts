import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * PostgreSQL Pool авах.
 * DATABASE_URL байхгүй бол null буцаана (throw хийхгүй).
 */
export function getPool(): Pool | null {
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️ DATABASE_URL тохируулаагүй байна — DB холболт алгасав');
        return null;
    }
    
    if (!pool) {
        // TLS cert validation is on by default now — rejectUnauthorized: false
        // unconditionally accepted ANY certificate (including a
        // MITM-substituted one) for every render.com connection. If Render's
        // cert genuinely isn't in Node's default trust store, set
        // DB_SSL_REJECT_UNAUTHORIZED=false explicitly rather than silently
        // defaulting to insecure.
        const useSSL = process.env.DATABASE_URL.includes('render.com');
        const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: useSSL ? { rejectUnauthorized } : undefined,
        });
    }
    
    return pool;
}

export default pool;
