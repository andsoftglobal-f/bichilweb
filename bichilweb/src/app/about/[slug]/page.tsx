import Image from 'next/image';
import Link from 'next/link';
import Container from '@/components/Container';
import PageBuilderInlineContent from '@/components/PageBuilderInlineContent';
import { fetchPageBySlug, normalizePageSlugInput, type PageData } from '@/lib/pagesApi';
import { logApiWarning } from '@/lib/apiError';
import { getApiBase } from '@/lib/apiBase';
import { getLocale } from '@/lib/serverLocale';
import { t } from '@/lib/i18n';

interface CategoryData {
  id: number;
  slug: string;
  icon: string;
  image: string;
  page_url?: string;
  active: boolean;
  content: CategoryContentBlock[];
  translations: { language: number; label: string; description: string }[];
}

interface CategoryContentBlock {
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

async function getCategoryBySlug(slugParam: string): Promise<CategoryData | null> {
  const normalizedSlug = normalizePageSlugInput(slugParam);
  const lookupSlug = normalizedSlug || slugParam;
  try {
    const res = await fetch(`${getApiBase()}/about-category/by-slug/${encodeURIComponent(lookupSlug)}/`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    return res.ok ? await res.json() : null;
  } catch (err) {
    logApiWarning('About category page', err);
    return null;
  }
}

export default async function AboutCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: slugParam } = await params;
  const [locale, category] = await Promise.all([getLocale(), getCategoryBySlug(slugParam)]);
  const langId = locale === 'mn' ? 2 : 1;
  const tr = (mn: string, en: string) => t(locale, mn, en);

  let linkedPage: PageData | null = null;
  if (category) {
    const pageLookupSlug = normalizePageSlugInput(category.page_url || category.slug || slugParam);
    if (pageLookupSlug) {
      linkedPage = await fetchPageBySlug(pageLookupSlug).catch(() => null);
    }
  }

  if (linkedPage) {
    return (
      <main className="min-h-screen bg-white py-16 md:py-24 overflow-x-hidden">
        <Container>
          <div className="w-full max-w-full overflow-x-hidden">
            <PageBuilderInlineContent page={linkedPage} language={locale} />
          </div>
        </Container>
      </main>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{tr('Хуудас олдсонгүй', 'Page not found')}</h2>
          <Link href="/about" className="text-blue-600 hover:underline text-sm">
            {tr('Бидний тухай руу буцах', 'Back to About')}
          </Link>
        </div>
      </div>
    );
  }

  const content: CategoryContentBlock[] = category.content || [];
  const catTr = category.translations?.find(x => x.language === langId);
  const catFallback = category.translations?.find(x => x.language !== langId);
  const title = catTr?.label || catFallback?.label || '';
  const description = catTr?.description || catFallback?.description || '';
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero */}
      {category.image && (
        <section className="relative h-[40vh] sm:h-[50vh] -mt-20 lg:-mt-24 flex items-end justify-center overflow-hidden">
          <Image src={category.image} alt={title} fill className="object-cover" priority unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          <div className="relative z-10 text-center text-white px-4 pb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 tracking-tight drop-shadow-lg">{title}</h1>
            {description && <p className="text-lg opacity-90 max-w-2xl mx-auto">{description}</p>}
          </div>
        </section>
      )}

      {/* Content */}
      <div className="py-16 md:py-24 bg-gray-50/50">
        <Container>
          {/* If no image, show title as text */}
          {!category.image && title && (
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h1>
              {description && <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">{description}</p>}
            </div>
          )}

          {/* Content blocks */}
          {content.length > 0 && (
            <div className="space-y-8 max-w-4xl mx-auto">
              {content.map((block, idx: number) => {
                const blockText = locale === 'mn' ? (block.text_mn || block.text || '') : (block.text_en || block.text || '');
                const blockTitle = locale === 'mn' ? (block.title_mn || block.title || '') : (block.title_en || block.title || '');
                const blockImage = block.image || '';
                const align = (block.text_align || 'left') as string;
                const fontCls = ({ sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl' } as Record<string, string>)[block.font_size as string] || 'text-base';
                const alignCls = ({ left: 'text-left', center: 'text-center', right: 'text-right' } as Record<string, string>)[align] || 'text-left';

                return (
                  <div key={idx} className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 ${alignCls}`}>
                    {blockImage && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6">
                        <Image src={blockImage} alt="" fill className="object-cover" unoptimized />
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

          {content.length === 0 && !description && (
            <div className="text-center py-20 text-gray-400">
              {tr('Агуулга одоогоор байхгүй байна', 'No content yet')}
            </div>
          )}

          {/* Back link */}
          <div className="text-center mt-12">
            <Link href="/about" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {tr('Бидний тухай руу буцах', 'Back to About')}
            </Link>
          </div>
        </Container>
      </div>
    </main>
  );
}
