import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import { getLocale } from '@/lib/serverLocale'
import CalculatorClient, { type CalcConfig, type CategoryItem, type ProductItem } from './CalculatorClient'

async function getCalculatorData(): Promise<{ products: ProductItem[]; categories: CategoryItem[]; config: CalcConfig | null }> {
  try {
    const API_URL = getApiBase()
    const [productsRes, categoriesRes, configRes] = await Promise.all([
      fetch(`${API_URL}/product/`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/categories/`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/calculator-config/`, { next: { revalidate: 60 } }),
    ])

    const products: ProductItem[] = productsRes.ok
      ? (await productsRes.json().then(raw => (Array.isArray(raw) ? raw : raw?.results ?? [])))
      : []
    const categories: CategoryItem[] = categoriesRes.ok
      ? (await categoriesRes.json().then(raw => (Array.isArray(raw) ? raw : raw?.results ?? [])))
      : []

    let config: CalcConfig | null = null
    if (configRes.ok) {
      const raw = await configRes.json()
      if (raw && !Array.isArray(raw) && raw.id) {
        config = raw
      } else {
        const list = Array.isArray(raw) ? raw : raw?.results ?? []
        if (list.length) config = list[0]
      }
    }

    return { products, categories, config }
  } catch (err) {
    logApiWarning('Calculator data', err)
    return { products: [], categories: [], config: null }
  }
}

export default async function CalculatorPage() {
  const [locale, data] = await Promise.all([getLocale(), getCalculatorData()])

  return (
    <CalculatorClient
      locale={locale}
      products={data.products}
      categories={data.categories}
      config={data.config}
    />
  )
}
