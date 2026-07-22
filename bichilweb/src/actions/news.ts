/**
 * News data-fetching actions — thin, typed wrappers around the Django news
 * endpoints. Components should call these instead of inlining
 * axiosInstance.get(...) + extractResults(...) + a locally-declared DTO, so
 * the endpoint shape is defined once (see src/types/news.ts).
 */

import { axiosInstance, extractResults } from '@/lib/axios'
import { logApiWarning } from '@/lib/apiError'
import type { ApiNewsItem, NewsCategoryAPI } from '@/types/news'

export async function getHomeNews(): Promise<ApiNewsItem[]> {
  try {
    const response = await axiosInstance.get<ApiNewsItem[]>('/news/?home=1')
    return extractResults<ApiNewsItem>(response.data)
  } catch (error) {
    logApiWarning('Home news', error)
    return []
  }
}

export async function getNewsCategories(): Promise<NewsCategoryAPI[]> {
  try {
    const response = await axiosInstance.get<NewsCategoryAPI[]>('/news-category/')
    return extractResults<NewsCategoryAPI>(response.data)
  } catch (error) {
    logApiWarning('News categories', error)
    return []
  }
}

export async function getAllNews(): Promise<ApiNewsItem[]> {
  try {
    const response = await axiosInstance.get<ApiNewsItem[]>('/news/')
    return extractResults<ApiNewsItem>(response.data)
  } catch (error) {
    logApiWarning('All news', error)
    return []
  }
}

export async function getNewsDetail(id: number | string): Promise<ApiNewsItem | null> {
  try {
    const response = await axiosInstance.get<ApiNewsItem>(`/news/${id}/`)
    return response.data
  } catch (error) {
    logApiWarning(`News detail ${id}`, error)
    return null
  }
}
