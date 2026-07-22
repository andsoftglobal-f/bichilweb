'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { getFontStyle } from '@/lib/fontUtils';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { Locale } from '@/lib/i18n';

/* ── Intersection Observer hook (callback-ref pattern) ─────────── */
function useInViewAnimation(threshold = 0.1) {
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

/* ── Types ─────────────────────────────────────────────────────────── */

interface FieldStyle {
  fontcolor?: string;
  fontsize?: number;
  fontweight?: string;
  textalign?: string;
  textAlign?: string;
  fontfamily?: string;
  slogan?: FieldStyle;
}

interface MemberStylesRaw {
  name?: FieldStyle;
  role?: FieldStyle;
  description?: FieldStyle;
  location?: FieldStyle;
  district?: FieldStyle;
}

const parseStyles = (raw?: string | null): MemberStylesRaw => {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

const parseCatStyles = (raw?: string | null): FieldStyle => {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

const weightMap: Record<string, number> = {
  normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800,
};

const toInlineStyle = (s?: FieldStyle): React.CSSProperties | undefined => {
  if (!s) return undefined;
  const out: React.CSSProperties = {};
  if (s.fontcolor) out.color = s.fontcolor;
  if (s.fontsize) out.fontSize = `${s.fontsize}px`;
  if (s.fontweight) out.fontWeight = weightMap[s.fontweight] || s.fontweight;
  const align = s.textalign || s.textAlign;
  if (align) out.textAlign = align as React.CSSProperties['textAlign'];
  if (s.fontfamily) {
    const fs = getFontStyle(s.fontfamily);
    if (fs.fontFamily) out.fontFamily = fs.fontFamily as string;
    if (fs.fontWeight) out.fontWeight = fs.fontWeight;
  }
  return Object.keys(out).length ? out : undefined;
};

export interface Translation {
  language: number;
  name: string;
  role: string;
  description: string;
  location: string;
  district: string;
  styles?: string;
}

export interface MemberAPI {
  id: number;
  type: string;
  image?: string | null;
  sort_order: number;
  active: boolean;
  pinned?: boolean;
  translations: Translation[];
}

export interface CategoryTranslation {
  language: number;
  label: string;
  slogan?: string;
  styles?: string;
}

export interface CategoryAPI {
  id: number;
  key: string;
  sort_order: number;
  active: boolean;
  translations: CategoryTranslation[];
}

const getCatLabel = (cat: CategoryAPI, langId: number) => {
  const tr = cat.translations.find((t) => t.language === langId);
  return tr?.label || cat.key;
};

const getTrans = (translations: Translation[], langId: number) =>
  translations.find((t) => t.language === langId);

/* ── PersonCard (Modern) ───────────────────────────────────────────── */

function PersonCard({ image, name, subtitle, onClick, priority = false, index = 0, visible = true, nameStyle, roleStyle, pinned = false, fillHeight = false }: {
  image?: string | null;
  name: string;
  subtitle: string;
  onClick: () => void;
  priority?: boolean;
  index?: number;
  visible?: boolean;
  nameStyle?: React.CSSProperties;
  roleStyle?: React.CSSProperties;
  pinned?: boolean;
  fillHeight?: boolean;
}) {
  const isSmall = !pinned;
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = resolveMediaUrl(image);
  const showImage = !!imageSrc && !imageFailed;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`group cursor-pointer relative overflow-hidden transition-all duration-500 outline-none focus:ring-2 focus:ring-[#0048BA] focus:ring-offset-2 h-full flex flex-col
        ${pinned
          ? 'bg-[#f3f3f7] md:bg-white border rounded-2xl border-[#00B2E7]/40 ring-1 ring-[#00B2E7]/20 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1'
          : 'bg-[#f3f3f7] md:bg-white rounded-2xl border border-[#e8e8ef] shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)] hover:-translate-y-1'}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Image Container */}
      <div className={`relative w-full overflow-hidden ${fillHeight ? 'flex-1 min-h-0' : pinned ? 'aspect-[10/13] sm:aspect-[4/5] md:aspect-[3/5]' : 'aspect-[10/11] sm:aspect-[10/11] md:aspect-[3/5]'} ${isSmall ? 'bg-[#d8d8df]' : 'bg-[#eef1f5]'}`}>
        {showImage ? (
          <img
            src={imageSrc}
            alt={name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={pinned
              ? 'absolute inset-0 h-full w-full object-cover object-top group-hover:scale-[1.06] transition-transform duration-700 ease-out'
              : 'absolute inset-0 h-full w-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700 ease-out'
            }
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0048BA]/5 to-gray-50 text-[#00B2E7]/30">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

      </div>

      {/* Info Section */}
      <div className={`relative ${pinned ? 'h-[68px] sm:h-[72px] md:h-auto p-2.5 sm:p-3 md:p-6' : 'h-[70px] sm:h-[74px] md:h-auto px-2 sm:px-2.5 md:px-4 pt-1.5 pb-2 md:pt-3.5 md:pb-4.5 text-center bg-[#f3f3f7] border-t border-white/60'}`}>
        {/* Blue accent line */}
        {pinned && (
          <div className="absolute top-0 left-4 right-4 sm:left-5 sm:right-5 h-px bg-gradient-to-r from-transparent via-[#00B2E7]/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        )}

        <h3 className={`font-bold transition-colors duration-300 line-clamp-1 leading-tight ${pinned ? 'text-gray-900 group-hover:text-[#0048BA] text-[11px] sm:text-[12px] md:text-lg' : 'text-[#4a49f5] text-[11px] sm:text-[12px] md:text-[21px] uppercase tracking-[0.02em]'}`} style={nameStyle}>
          {name}
        </h3>

        {/* Энд байсан line-clamp-1 гэдэг class-ийг устгаснаар текст бүрэн харагдах болно */}
        <p className={`${pinned ? 'uppercase tracking-[0.06em] md:tracking-[0.15em] text-[8.5px] sm:text-[9.5px] md:text-sm text-[#0048BA]' : 'text-[#222831] text-[9px] sm:text-[10px] md:text-[17px] tracking-normal normal-case'} mt-1 font-medium leading-snug`} style={roleStyle}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */

export default function GovernanceTabClient({ members, categories, language }: {
  members: MemberAPI[];
  categories: CategoryAPI[];
  language: Locale;
}) {
  const [activeSubTab, setActiveSubTab] = useState(categories[0]?.key || '');
  const [selectedPerson, setSelectedPerson] = useState<MemberAPI | null>(null);
  const [modalDragY, setModalDragY] = useState(0);
  const [isModalDragging, setIsModalDragging] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const modalDragStartY = useRef<number | null>(null);
  const [gridRef, gridVisible] = useInViewAnimation(0.05);

  const langId = language === 'mn' ? 1 : 2;

  const displayed = members.filter((m) => m.type === activeSubTab);
  const sortedDisplayed = [...displayed].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.sort_order - b.sort_order;
  });
  const hasPinned = sortedDisplayed.some((m) => !!m.pinned);
  const activeCategory = categories.find((cat) => cat.key === activeSubTab);
  const activeCategoryTranslation = activeCategory?.translations.find((t) => t.language === langId);
  const activeSlogan = activeCategoryTranslation?.slogan?.trim() || '';
  const activeSloganStyles = parseCatStyles(activeCategoryTranslation?.styles).slogan;
  const activeSloganStyle = toInlineStyle(activeSloganStyles) || {
    color: '#0048BA',
    fontSize: '18px',
    fontWeight: 600,
  };
  const showSloganSlot = hasPinned && !!activeSlogan;
  const closeSelectedPerson = useCallback(() => {
    setSelectedPerson(null);
    setModalDragY(0);
    setIsModalDragging(false);
    modalDragStartY.current = null;
  }, []);

  const handleModalDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return;
    modalDragStartY.current = e.clientY;
    setIsModalDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const handleModalDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (modalDragStartY.current === null) return;
    const delta = Math.max(0, e.clientY - modalDragStartY.current);
    setModalDragY(Math.min(delta, 220));
  }, []);

  const handleModalDragEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (modalDragStartY.current === null) return;
    const delta = Math.max(0, e.clientY - modalDragStartY.current);
    modalDragStartY.current = null;
    setIsModalDragging(false);
    if (delta > 90) {
      closeSelectedPerson();
      return;
    }
    setModalDragY(0);
  }, [closeSelectedPerson]);

  /* ── Body scroll lock ────────────────────────────────────────────── */

  useEffect(() => {
    document.body.style.overflow = selectedPerson ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedPerson]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSelectedPerson();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSelectedPerson]);

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="max-w-7xl mx-auto w-full overflow-visible no-scrollbar">
      <h2 className="sr-only">Компанийн засаглал</h2>

      {/* Category Tabs - Modern style */}
      <div className="mb-10 sm:mb-12">
        <div
          ref={tabsRef}
          className="flex overflow-x-auto no-scrollbar gap-2 pb-2 sm:justify-center snap-x snap-mandatory"
        >
          {categories.map((cat) => {
            const isActive = activeSubTab === cat.key;
            const count = members.filter((m) => m.type === cat.key).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveSubTab(cat.key)}
                className={clsx(
                  'relative px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 snap-start flex-shrink-0 flex items-center gap-2 border',
                  isActive
                    ? 'bg-white text-[#0048BA] border-[#0048BA] shadow-md'
                    : 'bg-white text-gray-500 border-gray-200/80 hover:border-[#00B2E7] hover:text-[#0048BA] hover:shadow-md'
                )}
              >
                {getCatLabel(cat, langId)}
                {count > 0 && (
                  <span className={clsx(
                    'text-[11px] font-semibold min-w-[20px] h-5 flex items-center justify-center rounded-full transition-colors',
                    isActive
                      ? 'bg-[#0048BA] text-white'
                      : 'bg-gray-100 text-gray-400'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {displayed.length === 0 ? (
        <div className="py-24 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gray-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">{language === 'mn' ? 'Мэдээлэл байхгүй' : 'No data available'}</p>
        </div>
      ) : (
        <div ref={gridRef} className="overflow-visible">
          <style>{`
            @keyframes governanceSloganFlow {
              from { transform: translateX(100%); }
              to { transform: translateX(-100%); }
            }
          `}</style>
          {/* Mobile layout */}
	          <div className="md:hidden space-y-4 sm:space-y-5 overflow-visible px-1 pb-2">
	            <div className="relative overflow-visible">
	              {showSloganSlot && (
	                <div
	                  className="absolute left-[52%] right-0 top-0 h-8 overflow-hidden"
	                  style={{
	                    WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%)',
	                    maskImage: 'linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%)',
	                  }}
	                >
	                  <div
	                    className="inline-flex h-full min-w-full items-center whitespace-nowrap px-4"
	                    style={{
	                      ...activeSloganStyle,
	                      fontSize: activeSloganStyle.fontSize || '13px',
	                      animation: 'governanceSloganFlow 15s linear infinite',
	                    }}
	                  >
	                    {activeSlogan}
	                  </div>
	                </div>
	              )}
	              <div className={clsx(
	                'grid gap-3 sm:gap-4 mx-auto p-1',
	                showSloganSlot && 'pt-8',
	                sortedDisplayed.length <= 1
	                  ? 'grid-cols-1 max-w-sm'
	                  : sortedDisplayed.length === 2
	                    ? 'grid-cols-2 max-w-md'
	                    : 'grid-cols-2 max-w-lg'
	              )}>
	              {sortedDisplayed.map((person, idx) => {
	                const tr = getTrans(person.translations, langId);
	                const ms = parseStyles(tr?.styles);
	                return (
	                  <div key={person.id} className={clsx('p-[2px]', person.pinned && showSloganSlot && '-mt-8')}>
	                    <PersonCard
	                      image={person.image}
	                      name={tr?.name || ''}
	                      subtitle={tr?.role || ''}
	                      onClick={() => setSelectedPerson(person)}
	                      priority={idx < 4}
	                      index={idx}
	                      visible={gridVisible}
	                      nameStyle={toInlineStyle(ms.name)}
	                      roleStyle={toInlineStyle(ms.role)}
	                      pinned={person.pinned}
	                    />
	                  </div>
	                );
	              })}
	              </div>
	            </div>
	          </div>

          {/* Desktop layout: first item tall, others in equal cells */}
<div className="hidden md:block relative overflow-visible px-2 pb-4">
  {hasPinned && activeSlogan && (
    <div
      className="absolute left-[34%] right-0 top-0 h-14 overflow-hidden"
      style={{
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)',
        maskImage: 'linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)',
      }}
    >
      <div
        className="inline-flex h-full min-w-full items-center whitespace-nowrap px-8"
        style={{
          ...activeSloganStyle,
          animation: 'governanceSloganFlow 18s linear infinite',
        }}
      >
        {activeSlogan}
      </div>
    </div>
  )}
  <div className="grid grid-cols-3 auto-rows-[420px] gap-4 pt-16 sm:gap-6 overflow-visible">
  {sortedDisplayed.map((person, idx) => {
    const tr = getTrans(person.translations, langId);
    const ms = parseStyles(tr?.styles);
    return (
      <div key={person.id} className={clsx('p-[3px]', person.pinned ? '-mt-16 h-[calc(100%+4rem)]' : 'h-full')}>
        <PersonCard
          image={person.image}
          name={tr?.name || ''}
          subtitle={tr?.role || ''}
          onClick={() => setSelectedPerson(person)}
          priority={idx < 4}
          index={idx}
          visible={gridVisible}
          nameStyle={toInlineStyle(ms.name)}
          roleStyle={toInlineStyle(ms.role)}
          pinned={person.pinned}
          fillHeight
        />
      </div>
    );
  })}
</div>
</div>
        </div>
      )}

      {/* Detail Modal - Premium */}
      {selectedPerson && (() => {
        const tr = getTrans(selectedPerson.translations, langId);
        const ms = parseStyles(tr?.styles);
        const selectedImageSrc = resolveMediaUrl(selectedPerson.image);
        const descriptionStyle = toInlineStyle(ms.description);
        const isDescriptionJustified = descriptionStyle?.textAlign === 'justify';
        const descriptionTextStyle: React.CSSProperties | undefined = descriptionStyle
          ? {
              ...descriptionStyle,
              ...(isDescriptionJustified
                ? { textAlign: 'justify', textAlignLast: 'left', hyphens: 'auto' }
                : {}),
            }
          : undefined;
        return (
          <div
            className="fixed inset-0 z-[100000] flex items-end justify-center p-0 sm:items-center sm:p-6 bg-slate-950/75 backdrop-blur-lg overflow-y-auto no-scrollbar"
            onClick={closeSelectedPerson}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              className="bg-white w-full max-h-[96vh] sm:max-h-[92vh] sm:w-[95vw] sm:max-w-5xl rounded-t-[28px] sm:rounded-[30px] overflow-hidden relative shadow-[0_35px_120px_rgba(2,6,23,0.45)] animate-in fade-in slide-in-from-bottom-12 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
              style={{
                transform: modalDragY ? `translateY(${modalDragY}px)` : undefined,
                transition: isModalDragging ? 'none' : undefined,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute inset-x-0 top-0 z-30 flex h-12 cursor-grab touch-none items-start justify-center pt-3 active:cursor-grabbing md:hidden"
                onPointerDown={handleModalDragStart}
                onPointerMove={handleModalDragMove}
                onPointerUp={handleModalDragEnd}
                onPointerCancel={handleModalDragEnd}
              >
                <span className="h-1.5 w-14 rounded-full bg-slate-300/90 shadow-sm" />
              </div>
              <button
                onClick={closeSelectedPerson}
                className="hidden md:flex absolute right-5 top-5 z-30 h-11 w-11 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-lg ring-1 ring-slate-200/70 backdrop-blur transition hover:bg-[#0048BA] hover:text-white"
                aria-label={language === 'mn' ? 'Хаах' : 'Close'}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Mobile: single scrollable column / Desktop: side-by-side */}
              <div className="flex max-h-[96vh] flex-col overflow-y-auto no-scrollbar md:max-h-[92vh] md:flex-row md:overflow-hidden">
                {/* Image */}
                <div className="w-full md:w-[44%] flex-shrink-0 relative overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200">
                  {selectedImageSrc ? (
                    <>
                      {/* Mobile: shorter aspect + overlapping content */}
                      <div className="block md:hidden relative w-full" style={{ aspectRatio: '4/3.15' }}>
                        <img
                          src={selectedImageSrc}
                          alt={tr?.name || ''}
                          className="absolute inset-0 h-full w-full object-cover object-top"
                          loading="eager"
                          decoding="async"
                        />
                        {/* Smooth gradient overlay for text readability */}
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/75 to-transparent" />
                        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/10 to-transparent" />
                      </div>
                      {/* Desktop: full height, object-cover */}
                      <div className="hidden md:block relative w-full h-full min-h-[560px]">
                        <img
                          src={selectedImageSrc}
                          alt={tr?.name || ''}
                          className="absolute inset-0 h-full w-full object-cover object-top"
                          loading="eager"
                          decoding="async"
                        />
                        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white/70 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950/25 to-transparent" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-56 md:h-full md:min-h-[480px] flex items-center justify-center bg-gradient-to-br from-[#0048BA]/5 to-gray-100 text-[#00B2E7]/30">
                      <svg className="w-20 h-20 md:w-24 md:h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="w-full md:w-[56%] px-3 pb-4 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-start md:overflow-y-auto md:max-h-[92vh] no-scrollbar -mt-10 md:mt-0 relative z-10">
                  <div className="rounded-[24px] bg-white/95 p-5 shadow-[0_-18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-6 md:rounded-none md:bg-transparent md:p-0 md:shadow-none md:ring-0">
                  {/* Role badge */}
                  {tr?.role && (
                    <div className="inline-flex items-center self-start gap-1.5 rounded-full bg-gradient-to-r from-[#0048BA]/5 to-[#00B2E7]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0048BA] ring-1 ring-[#00B2E7]/30 sm:px-3.5 sm:text-[11px] mb-4 sm:mb-5" style={toInlineStyle(ms.role)}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0048BA] animate-pulse" />
                      {tr.role}
                    </div>
                  )}

                  <h3 id="modal-title" className="text-[22px] sm:text-2xl md:text-[2rem] lg:text-4xl font-extrabold text-gray-950 leading-[1.12] tracking-tight" style={toInlineStyle(ms.name)}>
                    {tr?.name}
                  </h3>

                  {selectedPerson.type === 'branch' && tr?.location && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 flex items-center gap-2" style={toInlineStyle(ms.location)}>
                      <svg className="w-4 h-4 text-[#0048BA] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span style={toInlineStyle(ms.location)}>{tr.location}</span>
                      {tr.district ? <span style={toInlineStyle(ms.district)}> - {tr.district}</span> : ''}
                    </p>
                  )}

                  {tr?.description && (
                    <>
                      <div className="mt-5 mb-5 h-[3px] w-16 rounded-full bg-gradient-to-r from-[#0048BA] via-[#00B2E7] to-transparent sm:mt-6 sm:mb-6 sm:w-20" />
                      <div
                        className="space-y-3 rounded-2xl bg-slate-50/90 p-4 text-[13px] leading-[1.85] text-slate-600 ring-1 ring-slate-100 sm:space-y-4 sm:text-[15px] md:bg-white/75 md:p-5 md:shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] md:ring-slate-200/70"
                        style={descriptionTextStyle}
                      >
                        {tr.description.split('\n\n').map((paragraph: string, i: number) => (
                          <p key={i} style={descriptionTextStyle}>{paragraph}</p>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Bottom action on mobile */}
                  <div className="hidden">
                    <button
                      onClick={() => setSelectedPerson(null)}
                      className="w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-[#0048BA]"
                    >
                      {language === 'mn' ? 'Хаах' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        );
      })()}
    </div>
  );
}
