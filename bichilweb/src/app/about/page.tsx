import { getFontStyle } from '@/lib/fontUtils';
import { logApiWarning } from '@/lib/apiError';
import { getOptimizedMediaUrl, getResponsiveImageSrcSet } from '@/lib/mediaUrl';
import { getApiBase } from '@/lib/apiBase';
import { getLocale } from '@/lib/serverLocale';
import AboutPageClient, { type AboutBannerProps, type AboutCategoryItem } from './AboutPageClient';
import IntroTab from './tabs/IntroTab';
import ValuesTab from './tabs/ValuesTab';
import GovernanceTab from './tabs/GovernanceTab';
import StructureTab from './tabs/StructureTab';

const API_URL = getApiBase();
const JSON_FETCH_OPTIONS = {
  headers: { Accept: 'application/json' },
  next: { revalidate: 60 },
};

interface BannerData {
  id: number;
  image: string;
  mobile_image?: string;
  translations: { language: number; title: string; subtitle: string; fontfamily?: string }[];
}

interface AboutPageSummary {
  id: number;
  key?: string;
}

async function getBanner(): Promise<AboutBannerProps> {
  const empty: AboutBannerProps = {
    title: '', subtitle: '', fontStyle: {}, imageSrc: '', mobileImageSrc: '', imageSrcSet: '', mobileImageSrcSet: '',
  };
  try {
    // Discover about page ID dynamically
    const pagesRes = await fetch(`${API_URL}/about-page/`, JSON_FETCH_OPTIONS);
    if (!pagesRes.ok) return empty;
    const pagesRaw = await pagesRes.json();
    const pages = Array.isArray(pagesRaw) ? pagesRaw : Array.isArray(pagesRaw?.results) ? pagesRaw.results : [];
    const aboutPage = pages.find((p: AboutPageSummary) => p.key === 'intro');
    if (!aboutPage) return empty;
    const pid = aboutPage.id;

    const res = await fetch(`${API_URL}/about-banner/?page=${pid}`, JSON_FETCH_OPTIONS);
    if (!res.ok) return empty;
    const bannerRaw = await res.json();
    const data: BannerData[] = Array.isArray(bannerRaw) ? bannerRaw : Array.isArray(bannerRaw?.results) ? bannerRaw.results : [];
    if (data.length === 0) return empty;

    const banner = data[0];
    // Get Mongolian translation (language 1 = MN)
    const bannerTitle = banner.translations?.find(t => t.language === 1)?.title || '';
    const bannerSubtitle = banner.translations?.find(t => t.language === 1)?.subtitle || '';
    const bannerFontFamily = banner.translations?.find(t => t.language === 1)?.fontfamily || '';
    const bannerImage = banner.image || '';
    const mobileBannerImage = banner.mobile_image || '';

    return {
      title: bannerTitle,
      subtitle: bannerSubtitle,
      fontStyle: getFontStyle(bannerFontFamily),
      imageSrc: getOptimizedMediaUrl(bannerImage, { width: 1920 }),
      mobileImageSrc: getOptimizedMediaUrl(mobileBannerImage, { width: 900 }),
      imageSrcSet: getResponsiveImageSrcSet(bannerImage, [960, 1280, 1600, 1920]),
      mobileImageSrcSet: getResponsiveImageSrcSet(mobileBannerImage, [480, 640, 750, 900]),
    };
  } catch (err) {
    logApiWarning('About banner', err);
    return empty;
  }
}

async function getDynamicCategories(): Promise<AboutCategoryItem[]> {
  try {
    const res = await fetch(`${API_URL}/about-category/`, JSON_FETCH_OPTIONS);
    if (!res.ok) return [];
    const raw = await res.json();
    const list: AboutCategoryItem[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
    return list.filter(c => c.active);
  } catch (err) {
    logApiWarning('About categories', err);
    return [];
  }
}

export default async function AboutPage() {
  const [locale, banner, dynamicCategories] = await Promise.all([
    getLocale(),
    getBanner(),
    getDynamicCategories(),
  ]);

  return (
    <AboutPageClient
      locale={locale}
      banner={banner}
      dynamicCategories={dynamicCategories}
      introContent={<IntroTab />}
      valuesContent={<ValuesTab />}
      governanceContent={<GovernanceTab />}
      structureContent={<StructureTab />}
    />
  );
}
