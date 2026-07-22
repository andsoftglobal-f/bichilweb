/**
 * News DTOs shared between src/actions/news.ts and the components that
 * render them (NewsSection, news/page.tsx, news/[id]/page.tsx) — extracted
 * from three near-identical inline copies of the same shapes.
 */

export interface NewsTranslation {
  language: number
  label: string
  font: string
  family: string
  weight: string
  size: string
}

export interface NewsImage {
  image: string
}

export interface NewsSocial {
  social: string
  icon: string
}

export interface ApiNewsItem {
  id: number
  category: number
  image: string
  image_url?: string
  video: string
  video_orientation?: string
  facebook_url?: string
  feature: boolean
  render: boolean
  show_on_home: boolean
  readtime: number
  slug: string
  date: string
  images?: NewsImage[]
  socials?: NewsSocial[]
  title_translations: NewsTranslation[]
  shortdesc_translations?: NewsTranslation[]
  content_translations?: NewsTranslation[]
}

export interface NewsCategoryTranslation {
  id: number
  language: number
  label: string
}

export interface NewsCategoryAPI {
  id: number
  translations: NewsCategoryTranslation[]
}
