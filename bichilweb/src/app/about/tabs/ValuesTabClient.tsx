'use client';

import { useEffect, useState, useCallback } from 'react';
import { getOptimizedMediaUrl, getResponsiveImageSrcSet } from '@/lib/mediaUrl';
import type { Locale } from '@/lib/i18n';

/* ── Intersection Observer hook (callback-ref pattern) ────────── */
function useInViewAnimation(threshold = 0.2) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold]);

  const ref = useCallback((el: HTMLDivElement | null) => { setNode(el); }, []);

  // Returned as a tuple (not `{ ref, visible }`) so callers get two distinct
  // bindings instead of repeated property access on one object — the latter
  // trips react-hooks/refs's conservative "ref accessed during render" check
  // on the plain `visible` boolean, since it shares an object with `ref`.
  return [ref, visible] as const;
}

/* ── Types ─────────────────────────────────────────────── */
export interface CoreValueDisplay {
  id: number;
  title: string;
  desc: string;
  image: string;
  imageRatio: string;
  cardSize: string;
  titleStyle: { color: string; fontSize: string; fontWeight: string; fontFamily: string; textAlign: string };
  descStyle: { color: string; fontSize: string; fontWeight: string; fontFamily: string; textAlign: string };
  subItems?: { icon: string; title: string; desc: string; title_color?: string; title_size?: number; title_weight?: string; title_textalign?: string; desc_color?: string; desc_size?: number; desc_weight?: string; desc_textalign?: string }[];
}

const weightMap: Record<string, number> = {
  normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800,
};

const CardImage = ({
  src,
  alt,
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw',
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) => {
  const srcSet = getResponsiveImageSrcSet(src, [360, 520, 720, 960, 1280]);

  return (
    <img
      src={getOptimizedMediaUrl(src, { width: priority ? 1280 : 960 })}
      srcSet={srcSet || undefined}
      sizes={sizes}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
    />
  );
};

/* ── Main Component ──────────────────────────────────────────── */
export default function ValuesTabClient({ allValues, language }: {
  allValues: CoreValueDisplay[];
  language: Locale;
}) {
  const [heroRef, heroVisible] = useInViewAnimation(0.15);
  const [gridRef, gridVisible] = useInViewAnimation(0.1);

  const [expandedCards, setExpandedCards] = useState<Set<number | string>>(new Set());

  const toggleCard = (id: number | string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const heroCards = allValues.slice(0, 2);
  const valueCards = allValues.slice(2);

  /* ── SubItems renderer ── */
  const renderSubItems = (items: NonNullable<CoreValueDisplay['subItems']>) => (
    <div className="space-y-2">
      {items.map((item, si) => (
        <div key={si} className="flex items-start gap-2">
          {item.icon && <span className="text-base mt-0.5 shrink-0">{item.icon}</span>}
          <div>
            {item.title && <p className="font-semibold text-gray-800 text-sm" style={{
              ...(item.title_color ? { color: item.title_color } : {}),
              ...(item.title_size ? { fontSize: `${item.title_size}px` } : {}),
              ...(item.title_weight ? { fontWeight: weightMap[item.title_weight] || item.title_weight } : {}),
              ...(item.title_textalign ? { textAlign: item.title_textalign as React.CSSProperties['textAlign'] } : {}),
            }}>{item.title}</p>}
            {item.desc && <p className="text-gray-500 text-sm leading-relaxed" style={{
              ...(item.desc_color ? { color: item.desc_color } : {}),
              ...(item.desc_size ? { fontSize: `${item.desc_size}px` } : {}),
              ...(item.desc_weight ? { fontWeight: weightMap[item.desc_weight] || item.desc_weight } : {}),
              ...(item.desc_textalign ? { textAlign: item.desc_textalign as React.CSSProperties['textAlign'] } : {}),
            }}>{item.desc}</p>}
          </div>
        </div>
      ))}
    </div>
  );

  /* ── Title style helper ── */
  const titleSx = (s: CoreValueDisplay['titleStyle']): React.CSSProperties => ({
    ...(s.color ? { color: s.color } : {}),
    ...(s.fontSize ? { fontSize: s.fontSize } : {}),
    ...(s.fontWeight ? { fontWeight: weightMap[s.fontWeight] || s.fontWeight } : {}),
    ...(s.fontFamily ? { fontFamily: s.fontFamily } : {}),
    ...(s.textAlign ? { textAlign: s.textAlign as React.CSSProperties['textAlign'] } : {}),
  });

  /* ── Desc style helper ── */
  const descSx = (s: CoreValueDisplay['descStyle']): React.CSSProperties => ({
    ...(s.color ? { color: s.color } : {}),
    ...(s.fontFamily ? { fontFamily: s.fontFamily } : {}),
    ...(s.fontWeight ? { fontWeight: weightMap[s.fontWeight] || s.fontWeight } : {}),
    ...(s.fontSize ? { fontSize: s.fontSize } : {}),
    ...(s.textAlign ? { textAlign: s.textAlign as React.CSSProperties['textAlign'] } : {}),
  });

  /* ── Glass bg for large & text cards ── */
  const glassBg = 'linear-gradient(145deg, #f5f7fa 0%, #ebeef3 35%, #f0f2f6 55%, #e9ecf1 80%, #edf0f4 100%)';
  const shimmerBg = 'linear-gradient(120deg, transparent 10%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0.2) 55%, transparent 75%)';

  /* ── Content renderer (shared by all card types) ── */
  const renderContent = (card: CoreValueDisplay, variant: 'light' | 'dark' | 'glass') => {
    const isDark = variant === 'dark';
    return (
      <>
        {card.subItems && card.subItems.length > 0
          ? renderSubItems(card.subItems)
          : card.desc
            ? <p className={`text-sm sm:text-[15px] leading-relaxed ${isDark ? 'text-white/85' : 'text-gray-500'}`} style={descSx(card.descStyle)}>{card.desc}</p>
            : null}
      </>
    );
  };

  return (
    <div className="max-w-7xl mx-auto w-full overflow-x-hidden no-scrollbar px-4 sm:px-6 lg:px-0 space-y-16 sm:space-y-24 lg:space-y-32">

      {/* ── Hero: Vision & Mission ─────────────────────── */}
      <div ref={heroRef}>
        {(() => {
          const visionCard = heroCards[0];
          const missionCard = heroCards[1];
          const missionLabel = missionCard ? (language === 'mn' ? 'Эрхэм зорилго' : 'Mission') : '';
          const visionLabel = visionCard ? (language === 'mn' ? 'Алсын хараа' : 'Vision') : '';

          const renderHeroCard = (card: CoreValueDisplay, label: string, delay: string) => {
            const heroKey = `hero-${card.id}`;
            const isOpen = expandedCards.has(heroKey);
            return (
              <div
                onClick={() => toggleCard(heroKey)}
                className={`group rounded-2xl sm:rounded-3xl overflow-hidden relative flex flex-col min-h-[200px] sm:min-h-[240px] transition-all duration-700 ease-out hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] cursor-pointer select-none
                  ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                `}
                style={{ background: '#f3f4f6', transitionDelay: delay }}
              >
                {/* Full-bleed image */}
                {card.image && (
                  <CardImage src={card.image} alt={label} priority sizes="(max-width: 640px) 100vw, 50vw" />
                )}
                {card.image && (
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-white/95 via-white/80 sm:via-white/70 to-white/30 sm:to-transparent" />
                )}
                {!card.image && (
                  <>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: glassBg }} />
                    <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: shimmerBg }} />
                  </>
                )}
                {/* Content */}
                <div className="relative z-10 p-5 sm:p-7 md:p-9 flex flex-col justify-end sm:justify-center h-full sm:max-w-[65%] md:max-w-[60%]">
                  <h2
                    className="text-lg sm:text-xl md:text-[26px] font-extrabold text-gray-900 mb-1 leading-tight tracking-tight flex items-center gap-2"
                    style={titleSx(card.titleStyle)}
                  >
                    {label}
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </h2>
                  <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                    <div className="overflow-hidden">
                      {card.subItems && card.subItems.length > 0 ? (
                        <div className="space-y-1.5 sm:space-y-2">{renderSubItems(card.subItems)}</div>
                      ) : (
                        <p className="text-gray-500 text-xs sm:text-sm md:text-[15px] leading-relaxed line-clamp-4 sm:line-clamp-none" style={descSx(card.descStyle)}>
                          {card.desc}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
              {missionCard && renderHeroCard(missionCard, missionLabel, '0ms')}
              {visionCard && renderHeroCard(visionCard, visionLabel, '150ms')}
            </div>
          );
        })()}
      </div>

      {/* ── Core Values — Bento Grid ──────────────────── */}
      {valueCards.length > 0 && (
        <section ref={gridRef}>
          {/* Section heading */}
          <div className={`text-center mb-8 sm:mb-10 lg:mb-16 transition-all duration-700 ease-out ${gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-2 sm:mb-3">
              {language === 'mn' ? 'Бидний итгэл үнэмшил' : 'What we believe'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-extrabold text-gray-900 tracking-tight">
              {language === 'mn' ? 'Үнэт зүйл' : 'Core Values'}
            </h2>
          </div>

          {/* Bento grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-[5fr_3fr_3fr] gap-3 sm:gap-4 lg:gap-5"
            style={{ gridAutoRows: 'minmax(180px, auto)' }}
          >
            {valueCards.map((card, i) => {
              const hasImage = !!card.image;
              const size = card.cardSize || 'small';
              const animCls = `transition-all duration-700 ease-out ${gridVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.98]'}`;
              const animDelay = { transitionDelay: `${(i + 1) * 100}ms` };

              /* ── Large card (row-span-2) ── */
              if (size === 'large') {
                const isOpen = expandedCards.has(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`group col-span-2 sm:col-span-2 md:col-span-1 md:row-span-2 rounded-2xl sm:rounded-3xl overflow-hidden relative flex flex-col min-h-[220px] sm:min-h-0 cursor-pointer select-none ${animCls}`}
                    style={{ background: glassBg, ...animDelay }}
                  >
                    {hasImage && (
                      <CardImage src={card.image} alt={card.title} sizes="(max-width: 768px) 100vw, 36vw" />
                    )}
                    {hasImage && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />}
                    {!hasImage && <div className="absolute inset-0 pointer-events-none" style={{ background: shimmerBg }} />}

                    <div className={`relative z-10 p-5 sm:p-7 md:p-9 lg:p-11 mt-auto`}>
                      <h3
                        className={`text-lg sm:text-2xl md:text-[28px] lg:text-[32px] font-extrabold mb-1 leading-tight tracking-tight flex items-center gap-2 ${hasImage ? 'text-white' : 'text-gray-900'}`}
                        style={titleSx(card.titleStyle)}
                      >
                        {card.title}
                        <svg className={`w-4 h-4 shrink-0 transition-transform duration-300 ${hasImage ? 'text-white/60' : 'text-gray-400'} ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </h3>
                      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">{renderContent(card, hasImage ? 'dark' : 'glass')}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              /* ── Vertical card (row-span-2, narrow) ── */
              if (size === 'vertical') {
                const isOpen = expandedCards.has(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`group row-span-2 md:row-span-2 rounded-2xl sm:rounded-3xl overflow-hidden relative flex flex-col cursor-pointer select-none ${animCls}`}
                    style={{ background: glassBg, ...animDelay }}
                  >
                    {hasImage && (
                      <CardImage src={card.image} alt={card.title} sizes="(max-width: 768px) 50vw, 28vw" />
                    )}
                    {hasImage && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />}
                    {!hasImage && <div className="absolute inset-0 pointer-events-none" style={{ background: shimmerBg }} />}

                    <div className={`relative z-10 p-4 sm:p-5 md:p-7 mt-auto`}>
                      <h3
                        className={`text-sm sm:text-lg md:text-xl font-bold mb-1 leading-tight flex items-center gap-1.5 ${hasImage ? 'text-white' : 'text-gray-900'}`}
                        style={titleSx(card.titleStyle)}
                      >
                        {card.title}
                        <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${hasImage ? 'text-white/60' : 'text-gray-400'} ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </h3>
                      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">{renderContent(card, hasImage ? 'dark' : 'glass')}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              /* ── Small card with image ── */
              if (hasImage && card.title) {
                const isOpen = expandedCards.has(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`group rounded-2xl sm:rounded-3xl overflow-hidden relative flex flex-col justify-end cursor-pointer select-none ${animCls}`}
                    style={{ ...animDelay }}
                  >
                    <CardImage src={card.image} alt={card.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                    <div className="relative z-10 px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5">
                      <h3 className="text-sm sm:text-[15px] md:text-lg font-bold text-white leading-snug flex items-center gap-1.5" style={titleSx(card.titleStyle)}>
                        {card.title}
                        <svg className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-white/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </h3>
                      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">
                          {card.subItems && card.subItems.length > 0
                            ? <div className="mt-0.5">{renderSubItems(card.subItems)}</div>
                            : card.desc
                              ? <p className="text-white/80 text-[11px] sm:text-xs md:text-sm leading-relaxed line-clamp-3" style={descSx(card.descStyle)}>{card.desc}</p>
                              : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              /* ── Small: image only ── */
              if (hasImage) {
                return (
                  <div
                    key={card.id}
                    className={`group rounded-2xl sm:rounded-3xl overflow-hidden relative ${animCls}`}
                    style={{ ...animDelay }}
                  >
                    <CardImage src={card.image} alt={card.title || ''} />
                  </div>
                );
              }

              /* ── Small: text only ── */
              const isOpen = expandedCards.has(card.id);
              return (
                <div
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  className={`group rounded-2xl sm:rounded-3xl overflow-hidden relative flex flex-col p-4 sm:p-6 md:p-8 cursor-pointer select-none ${animCls}`}
                  style={{ background: glassBg, ...animDelay }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ background: shimmerBg }} />
                  <h3 className="text-base sm:text-xl md:text-2xl font-extrabold text-gray-900 mb-1 relative z-10 tracking-tight flex items-center gap-2" style={titleSx(card.titleStyle)}>
                    {card.title}
                    <svg className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </h3>
                  <div className={`grid transition-all duration-500 ease-in-out relative z-10 ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                    <div className="overflow-hidden">{renderContent(card, 'glass')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
