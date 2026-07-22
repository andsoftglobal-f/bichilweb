'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { getFontStyle } from '@/lib/fontUtils';
import { getOptimizedMediaUrl, getResponsiveImageSrcSet } from '@/lib/mediaUrl';

/* ── Types ─────────────────────────────────────────────────────── */

export interface SectionBlock {
  content: string;
  color: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  textAlign: string;
  visible: boolean;
}

export interface SectionData {
  title: string;
  titleColor: string;
  titleSize: string;
  titleWeight: string;
  titleFamily: string;
  textAlign: string;
  visible: boolean;
  image: string;
  imagePosition: 'left' | 'right';
  blocks: SectionBlock[];
}

export interface TimelineEvent {
  year: string;
  title: string;
  short: string;
  desc: string;
  image: string;
  yearColor: string;
  titleColor: string;
  shortColor: string;
  descColor: string;
}

const FluidImage = ({
  src,
  alt,
  className = '',
  priority = false,
  sizes = '(max-width: 1024px) 100vw, 68vw',
  fit = 'cover',
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fit?: 'cover' | 'contain';
}) => {
  const width = priority ? 1600 : 1280;
  const srcSet = getResponsiveImageSrcSet(src);

  return (
    <img
      src={getOptimizedMediaUrl(src, { width })}
      srcSet={srcSet || undefined}
      sizes={sizes}
      alt={alt}
      className={clsx(
        fit === 'contain'
          ? 'absolute inset-0 m-auto max-h-full max-w-full object-contain'
          : 'absolute inset-0 h-full w-full object-cover',
        className
      )}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
    />
  );
};

/* ── Helpers ────────────────────────────────────────────────────── */

const mapAlign = (val: string) => {
  if (val === 'left' || val === 'right' || val === 'center' || val === 'justify') return val;
  return undefined;
};

/* ── Main Component ────────────────────────────────────────────── */

export default function IntroTabClient({ sections, imageUrl, historyEvents }: {
  sections: SectionData[];
  imageUrl: string;
  historyEvents: TimelineEvent[];
}) {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  const [revealedSections, setRevealedSections] = useState<Set<number>>(new Set());
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Section animation observers ─────────────────────────────── */

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-section'));
            setRevealedSections(prev => { const n = new Set(prev); n.add(idx); return n; });
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    sectionRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  /* ── Timeline observers ──────────────────────────────────────── */

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const newlyVisible: number[] = [];
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            newlyVisible.push(Number(entry.target.getAttribute('data-index')));
          }
        });
        if (newlyVisible.length) {
          setActiveIndex(newlyVisible[newlyVisible.length - 1]);
          setRevealedIndexes(prev => { const n = new Set(prev); newlyVisible.forEach(i => n.add(i)); return n; });
        }
      },
      { rootMargin: '-30% 0px -30% 0px', threshold: 0.1 }
    );
    itemRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [historyEvents]);

  const toggleYear = (index: number) => setExpandedYear(expandedYear === index ? null : index);
  const isTimelineEnd = activeIndex !== null && activeIndex >= historyEvents.length - 2;

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className="relative isolate w-full max-w-full overflow-x-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
{/* ── Dynamic Sections ─────────────────────────────────────── */}
      <div className="w-full max-w-full space-y-14 overflow-x-hidden pt-3 md:space-y-24 lg:space-y-28 lg:pt-6">
        {sections.map((section, sIdx) => {
          if (!section.visible) return null;
          const isFirst = sIdx === 0;
          const sectionImage = isFirst ? (imageUrl || section.image) : section.image;
          const hasImage = !!sectionImage;

          const imageOnLeft = sIdx % 2 === 1;
          const sectionTitleSize = Number.parseFloat(section.titleSize);
          const mobileTitleSize = Number.isFinite(sectionTitleSize) ? Math.min(sectionTitleSize, 28) : 28;

          // ── Текст контент ──
          const TextContent = (
            <div className="relative z-10 flex flex-col justify-center space-y-5 md:space-y-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0048BA] text-xs font-black text-white shadow-[0_16px_36px_-18px_rgba(0,72,186,0.9)]">
                  {String(sIdx + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-[#0048BA]/35 via-[#00B2E7]/25 to-transparent" />
              </div>
              {section.title && (
                <div className="space-y-4">
                  <h2
                    style={{
                      color: section.titleColor,
                      fontSize: `${section.titleSize}px`,
                      fontWeight: section.titleWeight,
                      ...getFontStyle(section.titleFamily),
                      textAlign: mapAlign(section.textAlign) as React.CSSProperties['textAlign'],
                    }}
                    className="max-w-3xl leading-[0.98] tracking-[-0.055em] text-balance"
                  >
                    {section.title}
                  </h2>
                </div>
              )}
              <div className="space-y-4 md:space-y-5">
                {section.blocks.map((block, bIdx) =>
                  block.visible && block.content ? (
                    <p
                      key={bIdx}
                      style={{
                        color: block.color,
                        fontSize: `${block.fontSize}px`,
                        fontWeight: block.fontWeight,
                        ...getFontStyle(block.fontFamily),
                        textAlign: mapAlign(block.textAlign) as React.CSSProperties['textAlign'],
                      }}
                      className="max-w-3xl leading-[1.9] text-gray-600 md:text-[1.01em]"
                    >
                      {block.content}
                    </p>
                  ) : null
                )}
              </div>
            </div>
          );

          const MobileTextContent = (
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0048BA] text-[11px] font-black text-white">
                  {String(sIdx + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-[#0048BA]/30 via-[#00B2E7]/25 to-transparent" />
              </div>
              {section.title && (
                <h2
                  style={{
                    color: section.titleColor,
                    fontSize: `${mobileTitleSize}px`,
                    fontWeight: section.titleWeight,
                    ...getFontStyle(section.titleFamily),
                    textAlign: mapAlign(section.textAlign) as React.CSSProperties['textAlign'],
                  }}
                  className="leading-[1.04] tracking-[-0.045em] text-balance"
                >
                  {section.title}
                </h2>
              )}
              <div className="space-y-3.5">
                {section.blocks.map((block, bIdx) => {
                  const blockSize = Number.parseFloat(block.fontSize);
                  const mobileBlockSize = Number.isFinite(blockSize) ? Math.min(blockSize, 15) : 15;

                  return block.visible && block.content ? (
                    <p
                      key={bIdx}
                      style={{
                        color: block.color,
                        fontSize: `${mobileBlockSize}px`,
                        fontWeight: block.fontWeight,
                        ...getFontStyle(block.fontFamily),
                        textAlign: mapAlign(block.textAlign) as React.CSSProperties['textAlign'],
                      }}
                      className="max-w-full break-words leading-[1.75] text-gray-600"
                    >
                      {block.content}
                    </p>
                  ) : null;
                })}
              </div>
            </div>
          );

          return (
            <div
              key={sIdx}
              ref={(el) => { sectionRefs.current[sIdx] = el; }}
              data-section={sIdx}
              className={clsx(
                'transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]',
                revealedSections.has(sIdx) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
              )}
            >
              {hasImage ? (
                <>
                  <div className="lg:hidden">
                    <div className="space-y-5">
                      <div className="relative aspect-[4/3] rounded-[1.6rem]">
                        <FluidImage
                          src={sectionImage}
                          alt={section.title || ''}
                          priority={isFirst}
                          className="rounded-[1.6rem]"
                          fit="contain"
                        />
                      </div>
                      <div className="px-1">
                        {MobileTextContent}
                      </div>
                    </div>
                  </div>

                  <div
                    className={clsx(
                      'hidden items-center gap-10 lg:grid lg:grid-cols-12 lg:gap-14',
                      !imageOnLeft && 'lg:[&>*:first-child]:order-2'
                    )}
                  >
                    <div className="lg:col-span-7">
                      <div className="relative aspect-[16/10] rounded-[2rem]">
                        <FluidImage
                          src={sectionImage}
                          alt={section.title || ''}
                          className="rounded-[2rem]"
                          fit="contain"
                          priority={isFirst}
                          sizes="(max-width: 1024px) 100vw, 58vw"
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-5">
                      {TextContent}
                    </div>
                  </div>
                </>
              ) : (
                /* ЗУРАГГҮЙ ХЭСЭГ (Text Only Card) */
                <div className="mx-auto max-w-5xl">
                  <div className="border-l-2 border-[#0048BA]/30 pl-5 md:pl-8">
                    {TextContent}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Timeline Section ─────────────────────────────────────── */}
      {historyEvents.length > 0 && (
        <>
        <div className="flex items-center justify-center py-20 md:py-28">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-gray-300" />
          <div className="px-6 py-2 rounded-full border border-gray-100 shadow-sm text-sm font-semibold text-gray-400 uppercase tracking-widest bg-white">
            Түүхэн замнал
          </div>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-gray-300" />
        </div>

        {/* pt-4 болон px-2 нэмж цэг тайрагдахаас сэргийлэв */}
        <div ref={timelineRef} className="pb-24 pt-4 md:pt-0 px-2 md:px-0 relative overflow-hidden">
          {/* Орчин үеийн уусдаг голын шугам - left байрлалыг гар утсанд тааруулав */}
          <div className="absolute left-[35px] md:left-1/2 top-4 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-blue-200 to-transparent transform md:-translate-x-1/2 z-0" />

          <div className="space-y-16">
            {historyEvents.map((event, index) => {
              const isExpanded = expandedYear === index;
              const isEven = index % 2 === 0;
              const isActive = activeIndex === index;

              const ContentCard = (
                <div className={clsx(
                  "w-full bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 transition-all duration-500 group relative z-10",
                  isActive ? "ring-2 ring-blue-50 shadow-blue-900/5 transform scale-[1.02]" : "hover:shadow-lg hover:-translate-y-1"
                )}>
                  {/* Зөвхөн гар утсан дээр харагдах ОН */}
                  <div className="md:hidden flex items-center gap-4 mb-6">
                    <span className="text-3xl font-black tracking-tight" style={{ color: event.yearColor }}>{event.year}</span>
                    <div className="h-px bg-gradient-to-r from-gray-200 to-transparent flex-1" />
                  </div>

                  <div className={clsx(
                    "flex flex-col gap-6 items-center",
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  )}>

                    {/* ── ЗУРАГ ХЭСЭГ ── */}
                    {event.image && (
                      <div className="relative w-full md:w-[45%] h-48 md:h-52 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-gray-50">
                        <FluidImage
                          src={event.image}
                          alt={event.title || event.year}
                          className="transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    )}

                    {/* ── ТЕКСТ ХЭСЭГ ── */}
                    <div className="flex flex-col justify-center flex-1 w-full">
                      <h4 className="text-xl font-bold mb-3 group-hover:text-[#0048BA] transition-colors duration-300" style={{ color: event.titleColor }}>
                        {event.title}
                      </h4>

                      {/* text-justify класс нэмснээр текст баруун, зүүн талаараа тэгшхэн болно */}
                      <p className="text-sm md:text-base leading-relaxed text-justify" style={{ color: event.shortColor }}>
                        {event.short}
                      </p>

                      <button
                        onClick={() => toggleYear(index)}
                        className={clsx(
                          'flex items-center gap-2 text-sm font-semibold text-[#0048BA] mt-5 group/btn w-fit',
                          !isEven && 'md:ml-auto'
                        )}
                      >
                        <span className="relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#0048BA] after:transition-all after:duration-300 group-hover/btn:after:w-full">
                          {isExpanded ? 'Хураах' : 'Дэлгэрэнгүй унших'}
                        </span>
                        <svg className={clsx(
                          'w-4 h-4 transition-all duration-300',
                          isExpanded ? 'rotate-180' : 'group-hover/btn:translate-x-1'
                        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {isExpanded ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Дэлгэрэнгүй тайлбар */}
                  <div className={clsx(
                    'grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    isExpanded ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'
                  )}>
                    <div className="overflow-hidden min-h-0">
                      <div className="pt-6 border-t border-gray-100 text-sm md:text-base leading-relaxed text-justify" style={{ color: event.descColor }}>
                        {event.desc}
                      </div>
                    </div>
                  </div>

                </div>
              );

              return (
                <div
                  key={index}
                  ref={el => { itemRefs.current[index] = el; }}
                  data-index={index}
                  className={clsx(
                    'relative flex max-w-full flex-col md:flex-row items-center md:items-start group',
                    'transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    revealedIndexes.has(index) ? 'opacity-100 translate-x-0' : isEven ? 'opacity-0 -translate-x-12' : 'opacity-0 translate-x-12',
                    isActive && 'z-10'
                  )}
                >
                  {/* Гэрэлтдэг цаг хугацааны цэг - left болон top-ийг дотогшлуулж тайрагдахгүй болгов */}
                  <div className={clsx(
                    "absolute left-[24px] md:left-1/2 w-6 h-6 rounded-full border-4 border-white shadow-md z-20 top-6 md:top-10 transform md:-translate-x-1/2 transition-all duration-500",
                    isActive ? "bg-[#0048BA] scale-125 ring-[6px] ring-[#0048BA]/10" : "bg-gray-300 scale-100"
                  )} />

                  {/* Зүүн тал - pl-[64px] болгож гар утсан дээр цэгтэй давхцахгүй зай авав */}
                  <div className={clsx('w-full md:w-1/2 pl-[64px] md:pl-0 md:pr-16 md:text-right flex md:block', !isEven && 'md:flex md:justify-end')}>
                    <div className="md:hidden w-full">{ContentCard}</div>
                    <div className="hidden md:block w-full">
                      {isEven ? ContentCard : (
                        <div className="sticky top-40 flex justify-end pr-8">
                          <span className={clsx(
                            'text-6xl lg:text-7xl font-black tracking-tighter transition-all duration-500',
                            isActive ? 'opacity-100 scale-100' : 'opacity-20 scale-95 grayscale'
                          )}
                          style={{ color: event.yearColor }}>
                            {event.year}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Баруун тал */}
                  <div className="hidden md:block w-full md:w-1/2 md:pl-16 text-left">
                    {isEven ? (
                      <div className="sticky top-40 pl-8">
                        <span className={clsx(
                          'text-6xl lg:text-7xl font-black tracking-tighter transition-all duration-500',
                          isActive ? 'opacity-100 scale-100' : 'opacity-20 scale-95 grayscale'
                        )}
                        style={{ color: event.yearColor }}>
                          {event.year}
                        </span>
                      </div>
                    ) : ContentCard}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={clsx(
            'pointer-events-none absolute bottom-0 left-0 w-full h-40 transition-all duration-1000',
            isTimelineEnd ? 'opacity-0' : 'opacity-100'
          )}>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
          </div>
        </div>
        </>
      )}
    </div>
  );
}
