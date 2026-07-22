import { getFontStyle } from '@/lib/fontUtils';
import { logApiWarning } from '@/lib/apiError';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { getApiBase } from '@/lib/apiBase';
import { getLocale } from '@/lib/serverLocale';
import ValuesTabClient, { type CoreValueDisplay } from './ValuesTabClient';

// title_translations/desc_translations share this style shape plus one
// content field (title or desc) accessed dynamically by name below.
interface StyledTranslation {
  language: number;
  fontcolor?: string;
  fontsize?: number;
  fontweight?: string;
  fontfamily?: string;
  textalign?: string;
  [field: string]: unknown;
}

interface CoreValueAPI {
  id: number;
  file?: string | null;
  file_url?: string | null;
  image?: string | null;
  image_url?: string | null;
  file_ratio?: string;
  card_size?: string;
  index: number;
  visible: boolean;
  title_translations: StyledTranslation[];
  desc_translations: StyledTranslation[];
}

const getTr = (translations: StyledTranslation[], langId: number, field: string): string => {
  const tr = translations?.find((t) => t.language === langId);
  return (tr?.[field] as string) || (translations?.[0]?.[field] as string) || '';
};

const getStyle = (translations: StyledTranslation[], langId: number) => {
  const tr = translations?.find((t) => t.language === langId) || translations?.[0];
  const fontStyle = getFontStyle(tr?.fontfamily);
  return {
    color: tr?.fontcolor || '',
    fontSize: tr?.fontsize ? `${tr.fontsize}px` : '',
    fontWeight: tr?.fontweight || '',
    fontFamily: (fontStyle.fontFamily as string) || tr?.fontfamily || '',
    textAlign: tr?.textalign || '',
  };
};

async function getCoreValues(langId: number): Promise<CoreValueDisplay[]> {
  try {
    const res = await fetch(`${getApiBase()}/core-value/`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch');
    const raw = await res.json();
    const data: CoreValueAPI[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
    const sorted = [...data].sort((a, b) => a.index - b.index).filter(v => v.visible !== false);

    return sorted.map(cv => {
      const desc = getTr(cv.desc_translations, langId, 'desc');
      let subItems: CoreValueDisplay['subItems'];
      try {
        const parsed = JSON.parse(desc);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title !== undefined) {
          subItems = parsed;
        }
      } catch {}
      return {
        id: cv.id,
        title: getTr(cv.title_translations, langId, 'title'),
        desc: subItems ? '' : desc,
        image: resolveMediaUrl(cv.file_url || cv.image_url || cv.file || cv.image),
        imageRatio: cv.file_ratio || '16 / 9',
        cardSize: cv.card_size || 'small',
        titleStyle: getStyle(cv.title_translations, langId),
        descStyle: getStyle(cv.desc_translations, langId),
        subItems,
      };
    });
  } catch (error) {
    logApiWarning('Core values', error);
    return [];
  }
}

export default async function ValuesTab() {
  const locale = await getLocale();
  const langId = locale === 'mn' ? 1 : 2;
  const allValues = await getCoreValues(langId);

  return <ValuesTabClient allValues={allValues} language={locale} />;
}
