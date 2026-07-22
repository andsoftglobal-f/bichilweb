import { notFound } from 'next/navigation'
import { getLocale } from '@/lib/serverLocale'
import ProductContent, { type ApiProductResponse } from './ProductContent'

const API_BASE = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1'

interface Translation { language: number; label: string }

async function getProduct(id: string): Promise<ApiProductResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/product/${id}/`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error('Failed to fetch product:', err)
    return null
  }
}

async function getProductTypeLabel(productTypeId: number): Promise<{ categoryMn: string; categoryEn: string; typeMn: string; typeEn: string }> {
  const fallback = { categoryMn: '', categoryEn: '', typeMn: '', typeEn: '' }
  try {
    const ptRes = await fetch(`${API_BASE}/product-type/${productTypeId}/`, { next: { revalidate: 60 } })
    if (!ptRes.ok) return fallback
    const pt = await ptRes.json()
    const getLabel = (translations: Translation[], langId: number) =>
      translations?.find((t: Translation) => t.language === langId)?.label || ''
    const typeMn = getLabel(pt.translations, 2)
    const typeEn = getLabel(pt.translations, 1)

    const catRes = await fetch(`${API_BASE}/categories/${pt.category}/`, { next: { revalidate: 60 } })
    if (!catRes.ok) return { ...fallback, typeMn, typeEn }
    const cat = await catRes.json()
    return {
      categoryMn: getLabel(cat.translations, 2),
      categoryEn: getLabel(cat.translations, 1),
      typeMn,
      typeEn,
    }
  } catch {
    return fallback
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productID: string }>
}) {
  const { productID } = await params

  if (!productID) notFound()

  const [locale, apiData] = await Promise.all([getLocale(), getProduct(productID)])

  if (!apiData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="text-center">
          <div className="text-6xl mb-4">&#x26A0;&#xFE0F;</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Алдаа гарлаа</h2>
          <p className="text-gray-600">Бүтээгдэхүүн олдсонгүй / Product not found</p>
        </div>
      </div>
    )
  }

  const labels = apiData.type_labels || await getProductTypeLabel(apiData.product_type)

  return <ProductContent apiData={apiData} typeLabels={labels} locale={locale} />
}
