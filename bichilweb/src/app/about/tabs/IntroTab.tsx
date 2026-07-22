import { logApiWarning } from '@/lib/apiError';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { getApiBase } from '@/lib/apiBase';
import IntroTabClient, { type SectionData, type TimelineEvent } from './IntroTabClient';

// Django returns per-language translation rows with a free-form set of
// style/content fields (title, content, fontsize, fontcolor, ...) looked up
// dynamically by name below, so a fixed interface can't describe them.
type TranslationRecord = Record<string, unknown> & { language?: number; language_code?: string };

interface RawBlock {
  translations?: TranslationRecord[];
  visible?: boolean;
  index?: number;
}

interface RawSection {
  translations?: TranslationRecord[];
  visible?: boolean;
  image?: string;
  image_url?: string;
  file?: string;
  file_url?: string;
  image_position?: string;
  index?: number;
  blocks?: RawBlock[];
}

interface RawAboutPage {
  id: number;
  key?: string;
  media?: { file?: string; url?: string; file_url?: string }[];
  sections?: RawSection[];
}

interface RawTimelineEvent {
  visible?: boolean;
  year?: string;
  translations?: (TranslationRecord & { title?: string; short_desc?: string; full_desc?: string })[];
  image?: string;
  image_url?: string;
  year_color?: string;
  title_color?: string;
  short_color?: string;
  desc_color?: string;
}

const getMN = (translations: TranslationRecord[] | undefined, field: string): string => {
  const mn = translations?.find((t) => t.language === 1 || t.language_code === 'MN');
  return (mn?.[field] as string) || '';
};

const getStyle = (translations: TranslationRecord[] | undefined, field: string): string => {
  const mn = translations?.find((t) => t.language === 1 || t.language_code === 'MN');
  return (mn?.[field] as string) || '';
};

async function getIntroData(): Promise<{ sections: SectionData[]; imageUrl: string; historyEvents: TimelineEvent[] }> {
  const API_URL = getApiBase();
  let sections: SectionData[] = [];
  let imageUrl = '';
  let historyEvents: TimelineEvent[] = [];

  try {
    const pagesRes = await fetch(`${API_URL}/about-page/`, { next: { revalidate: 60 } });
    if (!pagesRes.ok) throw new Error('Failed to fetch pages');
    const pagesRaw = await pagesRes.json();
    const pages: RawAboutPage[] = Array.isArray(pagesRaw) ? pagesRaw : Array.isArray(pagesRaw?.results) ? pagesRaw.results : [];
    const aboutPage = pages.find((p) => p.key === 'intro');
    if (!aboutPage) throw new Error('About page not found');
    const pid = aboutPage.id;

    const [aboutRes, timelineRes] = await Promise.all([
      fetch(`${API_URL}/about-page/${pid}/`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/timeline/?page=${pid}`, { next: { revalidate: 60 } }),
    ]);

    if (aboutRes.ok) {
      const data = await aboutRes.json();

      // Media
      if (data.media?.length > 0) {
        imageUrl = resolveMediaUrl(data.media[0].file || data.media[0].url || data.media[0].file_url || '');
      }

      // Sections
      const sortedSections = [...(data.sections || []) as RawSection[]].sort((a, b) => (a.index || 0) - (b.index || 0));
      sections = sortedSections.map((section) => {
        const sortedBlocks = [...(section.blocks || [])].sort((a, b) => (a.index || 0) - (b.index || 0));
        return {
          title: getMN(section.translations, 'title'),
          titleColor: getStyle(section.translations, 'color') || getStyle(section.translations, 'fontcolor') || '#0f172a',
          titleSize: getStyle(section.translations, 'fontsize') || '36', // Томруулсан
          titleWeight: getStyle(section.translations, 'fontweight') || '800',
          titleFamily: getStyle(section.translations, 'fontfamily') || '',
          textAlign: getStyle(section.translations, 'textalign') || 'left',
          visible: section.visible !== false,
          image: resolveMediaUrl(section.image || section.image_url || section.file || section.file_url || ''),
          imagePosition: (section.image_position || 'right') as 'left' | 'right',
          blocks: sortedBlocks.map((block) => ({
            content: getMN(block.translations, 'content'),
            color: getStyle(block.translations, 'fontcolor') || getStyle(block.translations, 'color') || '#475569',
            fontSize: getStyle(block.translations, 'fontsize') || '16',
            fontWeight: getStyle(block.translations, 'fontweight') || '400',
            fontFamily: getStyle(block.translations, 'fontfamily') || '',
            textAlign: getStyle(block.translations, 'textalign') || 'justify',
            visible: block.visible !== false,
          })),
        };
      });
    }

    // Timeline
    if (timelineRes.ok) {
      const timelineRaw = await timelineRes.json();
      const timelineData: RawTimelineEvent[] = Array.isArray(timelineRaw) ? timelineRaw : Array.isArray(timelineRaw?.results) ? timelineRaw.results : [];
      historyEvents = (timelineData || [])
        .filter((ev) => ev.visible !== false)
        .map((ev) => {
          const mn = ev.translations?.find((t) => t.language === 1 || t.language_code === 'MN');
          return {
            year: ev.year || '',
            title: mn?.title || '',
            short: mn?.short_desc || '',
            desc: mn?.full_desc || '',
            image: resolveMediaUrl(ev.image || ev.image_url || ''),
            yearColor: ev.year_color || '#0048BA',
            titleColor: ev.title_color || '#111827',
            shortColor: ev.short_color || '#64748b',
            descColor: ev.desc_color || '#475569',
          };
        });
    }
  } catch (error) {
    logApiWarning('About intro page', error);
  }

  return { sections, imageUrl, historyEvents };
}

export default async function IntroTab() {
  const { sections, imageUrl, historyEvents } = await getIntroData();

  return <IntroTabClient sections={sections} imageUrl={imageUrl} historyEvents={historyEvents} />;
}
