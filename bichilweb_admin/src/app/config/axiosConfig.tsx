/**
 * Historically a second, near-duplicate axios client (with its own dead,
 * commented-out localStorage refresh logic). It's now a thin re-export of
 * the single real client in src/lib/axios.tsx, kept only so existing
 * `import axiosInstance from '@/config/axiosConfig'` call sites across the
 * admin pages don't all need to change their import path.
 */
export { axiosInstance as default } from '@/lib/axios'
