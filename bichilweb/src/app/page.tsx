import Hero from '@/components/Hero'
import StatsBar from '@/components/StatsBar'
import DraggableStatsCarousel from '@/components/CTA'
import AppDownload from '@/components/AppDownload'
import NewsSection from '@/components/NewsSection'
import PartnersMarquee from '@/components/PartnersMarquee'
import ProductTutorials from '@/components/ProductTutorials'
import ScrollReveal from '@/components/ScrollReveal'
import HomePageLinks from '@/components/HomePageLinks'
import { getLocale } from '@/lib/serverLocale'

export default async function Home() {
  const locale = await getLocale()

  return (
    <div>
      <HomePageLinks placement="before-hero" locale={locale} />

      <Hero />

      <HomePageLinks placement="after-hero" locale={locale} />

      <ScrollReveal direction="up" duration={900} distance={60} scale={0.97} once={false}>
        <DraggableStatsCarousel locale={locale} />
      </ScrollReveal>

      <HomePageLinks placement="after-cta" locale={locale} />

      <ScrollReveal direction="up" duration={900} distance={50} once={false}>
        <StatsBar locale={locale} />
      </ScrollReveal>

      <HomePageLinks placement="after-stats" locale={locale} />

      <ScrollReveal direction="up" duration={900} distance={60} scale={0.97} once={false}>
        <AppDownload locale={locale} />
      </ScrollReveal>

      <HomePageLinks placement="after-app-download" locale={locale} />

      <ScrollReveal direction="up" duration={1000} distance={50} threshold={0.1}>
        <NewsSection locale={locale} />
      </ScrollReveal>

      <HomePageLinks placement="after-news" locale={locale} />

      <ScrollReveal direction="up" duration={800} distance={40} scale={0.98} once={false}>
        <PartnersMarquee locale={locale} />
      </ScrollReveal>

      <HomePageLinks placement="after-partners" locale={locale} />

      <ScrollReveal direction="up" duration={800} distance={40} scale={0.98}>
        <ProductTutorials locale={locale} />
      </ScrollReveal>

      <HomePageLinks placement="after-product-tutorials" locale={locale} />
    </div>
  )
}
