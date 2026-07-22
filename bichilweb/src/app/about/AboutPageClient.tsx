'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Container from '@/components/Container';
import clsx from 'clsx';
import LottieLoading from '@/components/LottieLoading';
import PageBuilderInlineContent from '@/components/PageBuilderInlineContent';
import { fetchPageBySlug, normalizePageSlugInput, type PageData } from '@/lib/pagesApi';
import { logApiWarning } from '@/lib/apiError';
import { getOptimizedMediaUrl, getResponsiveImageSrcSet } from '@/lib/mediaUrl';
import { getApiBase } from '@/lib/apiBase';
import type { Locale } from '@/lib/i18n';

const API_URL = getApiBase();
const JSON_FETCH_OPTIONS = {
  headers: { Accept: 'application/json' },
  cache: 'no-store' as RequestCache,
};

export interface AboutCategoryItem {
  id: number;
  slug: string;
  icon: string;
  image: string;
  page_url?: string;
  active: boolean;
  translations: { language: number; label: string; description: string }[];
}

interface AboutCategoryContentBlock {
  text?: string;
  text_mn?: string;
  text_en?: string;
  title?: string;
  title_mn?: string;
  title_en?: string;
  image?: string;
  text_align?: 'left' | 'center' | 'right';
  font_size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
}

interface AboutCategoryData extends AboutCategoryItem {
  content?: AboutCategoryContentBlock[];
}

export interface AboutBannerProps {
  title: string;
  subtitle: string;
  fontStyle: React.CSSProperties;
  imageSrc: string;
  mobileImageSrc: string;
  imageSrcSet: string;
  mobileImageSrcSet: string;
}

export default function AboutPageClient({ locale, banner, dynamicCategories, introContent, valuesContent, governanceContent, structureContent }: {
  locale: Locale;
  banner: AboutBannerProps;
  dynamicCategories: AboutCategoryItem[];
  introContent: ReactNode;
  valuesContent: ReactNode;
  governanceContent: ReactNode;
  structureContent: ReactNode;
}) {
  const langId = locale === 'mn' ? 2 : 1;
  const t = (mn: string, en: string) => (locale === 'mn' ? mn : en);
  const [activeTab, setActiveTab] = useState('intro');

  // Build tab list: built-in tabs + dynamic categories
  const builtInTabs = [
    { id: 'intro', label: t('Бидний тухай', 'About Us') },
    { id: 'values', label: t('Үнэт зүйлс', 'Values') },
    { id: 'governance', label: t('Засаглал', 'Governance') },
    { id: 'structure', label: t('Бүтэц', 'Structure') },
  ];

  const dynamicTabs = dynamicCategories.map(cat => {
    const tr = cat.translations.find(t => t.language === langId);
    const fallback = cat.translations.find(t => t.language !== langId);
    return {
      id: `cat-${cat.slug}`,
      label: tr?.label || fallback?.label || cat.slug,
      slug: cat.slug,
    };
  });

  const allTabs = [...builtInTabs, ...dynamicTabs];
  const isDynamicCategoryTab = activeTab.startsWith('cat-');

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <main className="about-page-shell min-h-screen bg-white overflow-x-hidden">

      {/* Hero Section - extends behind header */}
      {banner.imageSrc && (
      <section className="relative h-[50vh] sm:h-screen md:h-auto md:aspect-[1920/696] -mt-20 lg:-mt-24 flex items-end justify-center overflow-hidden">
        {/* Desktop image: 1920×696 */}
        <img
          src={banner.imageSrc}
          srcSet={banner.imageSrcSet || undefined}
          sizes="100vw"
          alt="About Us Hero"
          className={`absolute inset-0 h-full w-full object-cover ${banner.mobileImageSrc ? 'hidden md:block' : ''}`}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        {/* Mobile image: 750×1200 */}
        {banner.mobileImageSrc && (
          <img
            src={banner.mobileImageSrc}
            srcSet={banner.mobileImageSrcSet || undefined}
            sizes="100vw"
            alt="About Us Hero Mobile"
            className="absolute inset-0 block h-full w-full object-cover md:hidden"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        <div className="relative z-10 text-center text-white px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {banner.title && (
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight drop-shadow-lg" style={banner.fontStyle}>{banner.title}</h1>
          )}
          {banner.subtitle && (
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto" style={banner.fontStyle}>{banner.subtitle}</p>
          )}
        </div>
      </section>
      )}

      {/* Modern Tabs Navigation */}
      <div className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <Container>
          <div className="flex overflow-x-auto no-scrollbar justify-start md:justify-center py-4 gap-2 md:gap-8">
            {allTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={clsx(
                  "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap select-none",
                  activeTab === tab.id
                    ? "bg-[#0048BA] text-white shadow-md transform scale-105"
                    : "text-gray-500 hover:text-[#00B2E7] hover:bg-[#0048BA]/5"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Container>
      </div>

      {/* Main Content Area */}
      <div className={clsx(activeTab === 'intro' ? 'bg-white' : 'bg-gray-50/50', isDynamicCategoryTab ? 'pt-0 pb-16 md:pt-0 md:pb-24' : 'py-16 md:py-24')}>
        {isDynamicCategoryTab ? (
          <div className="min-h-[600px] w-full max-w-full overflow-x-hidden">
            <DynamicCategoryContent key={activeTab} slug={activeTab.replace('cat-', '')} locale={locale} />
          </div>
        ) : (
          <Container>
             {/* Dynamic Content Rendering */}
             <div className="min-h-[600px] w-full max-w-full overflow-x-hidden">
                 {activeTab === 'intro' && introContent}
                 {activeTab === 'values' && valuesContent}
                 {activeTab === 'governance' && governanceContent}
                 {activeTab === 'structure' && structureContent}
             </div>
          </Container>
        )}
      </div>
    </main>
  );
}

/* ─── Dynamic Category Content Component ─── */
function DynamicCategoryContent({ slug, locale }: { slug: string; locale: Locale }) {
  const langId = locale === 'mn' ? 2 : 1;
  const [category, setCategory] = useState<AboutCategoryData | null>(null);
  const [linkedPage, setLinkedPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const normalizedSlug = normalizePageSlugInput(slug);

    (async () => {
      try {
        setLoading(true);

        // Fetch category
        const lookupSlug = normalizedSlug || slug;
        const categoryRes = await fetch(`${API_URL}/about-category/by-slug/${encodeURIComponent(lookupSlug)}/`, JSON_FETCH_OPTIONS);
        const categoryData = categoryRes.ok ? await categoryRes.json() : null;

        if (!mounted) return;
        setCategory(categoryData);

        // If category has page_url, fetch that page; otherwise look up by slug
        let linkedPageData = null;
        const pageLookupSlug = normalizePageSlugInput(categoryData?.page_url || categoryData?.slug || normalizedSlug);
        if (pageLookupSlug) {
          linkedPageData = await fetchPageBySlug(pageLookupSlug).catch(() => null);
        }

        if (!mounted) return;
        setLinkedPage(linkedPageData || null);
        setLoading(false);
      } catch (err) {
        logApiWarning('About dynamic category', err);
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LottieLoading size={120} />
      </div>
    );
  }

  const content: AboutCategoryContentBlock[] = category?.content || [];

  if (linkedPage) {
    return (
      <div className="w-full max-w-full overflow-x-hidden">
        <PageBuilderInlineContent page={linkedPage} language={locale} />
      </div>
    );
  }

  if (!category) {
    return <div className="text-center py-20 text-gray-400">Мэдээлэл олдсонгүй</div>;
  }

  const tr = category.translations?.find(t => t.language === langId);
  const fallback = category.translations?.find(t => t.language !== langId);
  const title = tr?.label || fallback?.label || '';
  const description = tr?.description || fallback?.description || '';
  const categoryImageSrc = getOptimizedMediaUrl(category.image, { width: 1280 });
  const categoryImageSrcSet = getResponsiveImageSrcSet(category.image, [480, 768, 1024, 1280]);
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center mb-12">
        {categoryImageSrc && (
          <div className="relative w-full max-w-4xl mx-auto aspect-[16/7] rounded-2xl overflow-hidden mb-8">
            <img
              src={categoryImageSrc}
              srcSet={categoryImageSrcSet || undefined}
              sizes="(max-width: 1024px) 100vw, 896px"
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        {title && <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>}
        {description && <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">{description}</p>}
      </div>

      {/* Content blocks (JSON) */}
      {content.length > 0 && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {content.map((block, idx: number) => {
            const blockText = locale === 'mn' ? (block.text_mn || block.text || '') : (block.text_en || block.text || '');
            const blockTitle = locale === 'mn' ? (block.title_mn || block.title || '') : (block.title_en || block.title || '');
            const blockImage = block.image || '';
            const blockImageSrc = getOptimizedMediaUrl(blockImage, { width: 1024 });
            const blockImageSrcSet = getResponsiveImageSrcSet(blockImage, [480, 768, 1024]);
            const align = block.text_align || 'left';
            const fontCls = { sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl' }[block.font_size as string] || 'text-base';
            const alignCls = { left: 'text-left', center: 'text-center', right: 'text-right' }[align as 'left' | 'center' | 'right'] || 'text-left';

            return (
              <div key={idx} className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 ${alignCls}`}>
                {blockImageSrc && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6">
                    <img
                      src={blockImageSrc}
                      srcSet={blockImageSrcSet || undefined}
                      sizes="(max-width: 1024px) 100vw, 896px"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                {blockTitle && <h3 className={`font-bold text-gray-900 mb-3 ${fontCls === 'text-base' ? 'text-xl' : fontCls}`}>{blockTitle}</h3>}
                {blockText && (
                  <div className={`text-gray-600 leading-relaxed whitespace-pre-line ${fontCls}`}>{blockText}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
