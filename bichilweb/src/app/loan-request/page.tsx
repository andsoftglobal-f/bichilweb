import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import { getLocale } from '@/lib/serverLocale'
import LoanRequestClient, { type CategoryItem, type PageConfig, type ProductItem } from './LoanRequestClient'

async function getLoanRequestData(): Promise<{ pageConfig: PageConfig | null; products: ProductItem[]; categories: CategoryItem[] }> {
  try {
    const API_URL = getApiBase()
    const [pageRes, productsRes, categoriesRes] = await Promise.all([
      fetch(`${API_URL}/loan-request-page/`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/product/`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/categories/`, { next: { revalidate: 60 } }),
    ])

    const pageConfig: PageConfig | null = pageRes.ok ? await pageRes.json() : null
    const products: ProductItem[] = productsRes.ok
      ? (await productsRes.json().then(raw => (Array.isArray(raw) ? raw : raw?.results ?? [])))
      : []
    const categories: CategoryItem[] = categoriesRes.ok
      ? (await categoriesRes.json().then(raw => (Array.isArray(raw) ? raw : raw?.results ?? [])))
      : []

    return { pageConfig, products, categories }
  } catch (err) {
    logApiWarning('Loan request page', err)
    return { pageConfig: null, products: [], categories: [] }
  }
}

export default async function LoanRequestPage() {
  const [locale, data] = await Promise.all([getLocale(), getLoanRequestData()])

  return (
    <LoanRequestClient
      locale={locale}
      pageConfig={data.pageConfig}
      products={data.products}
      categories={data.categories}
    />
  )
}
