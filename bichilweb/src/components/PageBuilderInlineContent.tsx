'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { type PageData } from '@/lib/pagesApi';

interface Block {
  id: string;
  type: string;
  content: Record<string, string>;
  style: Record<string, string>;
}

interface LayoutSettings {
  maxWidth: string;
  fullWidth: boolean;
  pagePaddingTop: string;
  pagePaddingBottom: string;
  pagePaddingLeft: string;
  pagePaddingRight: string;
}

interface Props {
  page: PageData;
  language: string;
  className?: string;
}

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-page-fade-in {
    animation: fadeIn 0.5s ease-out;
  }
  .animate-page-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }
`;

const htmlResponsiveCss = `
  html,body{width:100%;max-width:100%;overflow-x:hidden;margin:0;}
  img,video,svg,canvas,iframe{max-width:100%;height:auto;}
  body *{max-width:100%;}
  table{display:block;max-width:100%;overflow-x:auto;}
  *{box-sizing:border-box;}
  @media (max-width: 767px){
    .container,.wrapper,.content,section,main{width:100%!important;max-width:100%!important;}
    [style*="width"]{max-width:100%!important;}
    [style*="min-width"]{min-width:0!important;}
  }
`;

function getTranslation(
  translations: PageData['title_translations'] | PageData['description_translations'] | undefined,
  languageId: number,
) {
  return translations?.find(t => t.language === languageId) || translations?.[0] || null;
}

function getFileDisplayName(url?: string, fallback?: string) {
  if (fallback) return fallback;
  if (!url) return '';
  const cleanUrl = url.split('?')[0];
  const name = cleanUrl.split('/').pop() || '';
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

function getBackendOrigin() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  try {
    const parsed = new URL(api);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'http://127.0.0.1:8000';
  }
}

function resolvePageAssetUrl(url?: string) {
  if (!url) return '';
  const raw = url.trim();
  if (!raw) return '';
  if (raw.startsWith('blob:')) return '';
  if (raw.startsWith('data:')) return raw;

  if (/^localhost:\d+/i.test(raw)) {
    return resolvePageAssetUrl(`http://${raw}`);
  }

  if (raw.startsWith('//')) {
    return resolvePageAssetUrl(`http:${raw}`);
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const origin = getBackendOrigin();
  return `${origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

async function openFileForView(url: string) {
  const resolved = resolvePageAssetUrl(url);
  if (!resolved) return;
  window.open(resolved, '_blank', 'noopener,noreferrer');
}

function buildHtmlSrcDoc(code?: string, extraCss = '') {
  const raw = (code || '').trim();
  if (!raw) return '';

  if (/<html[\s>]/i.test(raw)) {
    const withBase = /<base[\s>]/i.test(raw) ? raw : raw.replace(/<head>/i, '<head><base target="_blank" />');
    if (!extraCss) return withBase;
    if (/<\/head>/i.test(withBase)) return withBase.replace(/<\/head>/i, `<style>${extraCss}</style></head>`);
    return withBase.replace(/<html[^>]*>/i, m => `${m}<head><style>${extraCss}</style></head>`);
  }

  return `<!doctype html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><base target="_blank" />${extraCss ? `<style>${extraCss}</style>` : ''}</head><body>${raw}</body></html>`;
}

function getHtmlImageStyleKey(index: number) {
  return index <= 1 ? 'htmlImageUrl' : `htmlImageUrl${index}`;
}

function getHtmlImageStyleValue(style: Record<string, string>, index: number) {
  if (index <= 1) return style.htmlImageUrl || '';
  return style[getHtmlImageStyleKey(index)] || '';
}

function applyHtmlTemplate(code: string, style: Record<string, string>) {
  return code.replace(/\{\{\s*IMAGE_URL(?:_(\d+))?\s*\}\}/gi, (_m, idxRaw: string) => {
    const idx = idxRaw ? parseInt(idxRaw, 10) : 1;
    return getHtmlImageStyleValue(style, idx);
  });
}

function getHtmlImageSlotCount(code?: string) {
  const raw = code || '';
  const placeholderRe = /\{\{\s*IMAGE_URL(?:_(\d+))?\s*\}\}/gi;
  let match: RegExpExecArray | null;
  let maxIndex = 0;

  while ((match = placeholderRe.exec(raw)) !== null) {
    const idx = match[1] ? parseInt(match[1], 10) : 1;
    if (idx > maxIndex) maxIndex = idx;
  }

  if (maxIndex > 0) return maxIndex;

  const iconMatches = raw.match(/class\s*=\s*['"][^'"]*\bicon\b[^'"]*['"]/gi);
  return iconMatches ? Math.min(iconMatches.length, 12) : 0;
}

function buildHtmlImageOverrideCssByCode(code: string, style: Record<string, string>) {
  const hasPlaceholder = /\{\{\s*IMAGE_URL(?:_\d+)?\s*\}\}/i.test(code);
  if (hasPlaceholder) return '';

  const slotCount = getHtmlImageSlotCount(code);
  if (!slotCount) return '';

  let css = '';
  for (let i = 1; i <= slotCount; i += 1) {
    const url = getHtmlImageStyleValue(style, i).trim();
    if (!url) continue;
    const safeUrl = url.replace(/'/g, "\\'");
    css += `.item:nth-of-type(${i}) .icon{background-image:url('${safeUrl}') !important;background-size:cover !important;background-position:center !important;background-repeat:no-repeat !important;color:transparent !important;}`;
  }
  return css;
}

function getHtmlButtonStyleKey(index: number) {
  return index <= 1 ? 'htmlButtonLink' : `htmlButtonLink${index}`;
}

function getHtmlButtonStyleValue(style: Record<string, string>, index: number) {
  if (index <= 1) return style.htmlButtonLink || '';
  return style[getHtmlButtonStyleKey(index)] || '';
}

function applyHtmlButtonLinks(code: string, style: Record<string, string>) {
  let nextImplicitIndex = 1;
  return code.replace(/\{\{\s*BUTTON_LINK(?:_(\d+))?\s*\}\}/gi, (_m, idxRaw: string) => {
    const idx = idxRaw ? parseInt(idxRaw, 10) : nextImplicitIndex;
    if (!idxRaw) nextImplicitIndex += 1;
    return getHtmlButtonStyleValue(style, idx);
  });
}

function getHtmlCodeForLanguage(content: Record<string, string>, lang: string) {
  const legacyCode = content.code || '';
  const mnCode = content.code_mn || legacyCode;
  if (lang === 'mn') return mnCode || content.code_en || '';
  return content.code_en || mnCode || legacyCode;
}

function HtmlBlockIframe({ srcDoc, initialHeight, autoHeight }: { srcDoc: string; initialHeight: number; autoHeight: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(initialHeight);

  const updateHeight = () => {
    if (!autoHeight) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const nextHeight = Math.max(
      initialHeight,
      doc.documentElement?.scrollHeight || 0,
      doc.body?.scrollHeight || 0,
    );
    setHeight(nextHeight + 8);
  };

  return (
    <iframe
      ref={iframeRef}
      title="HTML block"
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation"
      className="w-full border-0 bg-transparent"
      style={{ height: `${height}px`, display: 'block' }}
      onLoad={updateHeight}
    />
  );
}

function RenderBlock({ block, lang, mobileFlow = false }: { block: Block; lang: string; mobileFlow?: boolean }) {
  const c = block.content || {};
  const s = block.style || {};
  const wrap: CSSProperties = {
    textAlign: (s.textAlign as CSSProperties['textAlign']) || 'left',
    backgroundColor: s.backgroundColor || undefined,
    color: s.textColor || undefined,
    maxWidth: '100%',
    minWidth: 0,
    overflowX: 'hidden',
    overflowWrap: 'anywhere',
    paddingTop: `${s.paddingTop || 16}px`,
    paddingBottom: `${s.paddingBottom || 16}px`,
    paddingLeft: `${s.paddingLeft || 0}px`,
    paddingRight: `${s.paddingRight || 0}px`,
    borderRadius: `${s.borderRadius || 0}px`,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    fontFamily: s.fontFamily || undefined,
    fontWeight: s.fontWeight || undefined,
  };

  switch (block.type) {
    case 'heading': {
      const text = lang === 'mn' ? c.text_mn : c.text_en;
      const sizes: Record<string, string> = { h1: '2.5rem', h2: '2rem', h3: '1.5rem', h4: '1.25rem' };
      if (!text) return null;
      return <div style={wrap}><div style={{ fontSize: sizes[c.level] || '2rem', fontWeight: 'bold', lineHeight: 1.3 }}>{text}</div></div>;
    }
    case 'text': {
      const text = lang === 'mn' ? c.text_mn : c.text_en;
      if (!text) return null;
      return <div style={wrap}><div className="whitespace-pre-wrap leading-relaxed" style={{ fontSize: '17px', lineHeight: '1.8' }}>{text}</div></div>;
    }
    case 'image':
      return c.url ? (
        <div style={wrap}>
          <img src={c.url} alt={c.alt || ''} className="max-w-full h-auto rounded-lg" />
          {(lang === 'mn' ? c.caption_mn : c.caption_en) && (
            <p className="text-sm text-gray-500 mt-2 text-center">{lang === 'mn' ? c.caption_mn : c.caption_en}</p>
          )}
        </div>
      ) : null;
    case 'video': {
      const match = (c.url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
      const ytId = match ? match[1] : null;
      const isFile = c._isFile || (c.url && !c.url.includes('youtube') && !c.url.includes('youtu.be'));
      return c.url ? (
        <div style={wrap}>
          {ytId ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe src={`https://www.youtube.com/embed/${ytId}`} className="absolute inset-0 w-full h-full rounded-lg" allowFullScreen />
            </div>
          ) : isFile ? (
            <video src={c.url} controls className="w-full rounded-lg" style={{ maxHeight: '500px' }} />
          ) : null}
        </div>
      ) : null;
    }
    case 'button': {
      const text = lang === 'mn' ? c.text_mn : c.text_en;
      const variants: Record<string, string> = {
        primary: 'bg-teal-600 text-white hover:bg-teal-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        outline: 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50',
      };
      return (
        <div style={wrap}>
          <a href={c.url || '#'} className={`inline-block px-6 py-3 rounded-lg font-medium transition-colors ${variants[c.variant] || variants.primary}`}>
            {text || 'Button'}
          </a>
        </div>
      );
    }
    case 'spacer':
      return <div style={{ height: `${c.height || 40}px` }} />;
    case 'divider':
      return <div style={wrap}><hr style={{ border: 'none', borderTop: `${c.thickness || 1}px solid ${c.color || '#e5e7eb'}`, margin: 0 }} /></div>;
    case 'banner':
      return (
        <div style={{ ...wrap, position: 'relative', height: `${c.height || 400}px`, overflow: 'hidden', borderRadius: `${s.borderRadius || 0}px` }}>
          {c.imageUrl ? <img src={c.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-blue-700" />}
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(parseInt(c.overlayOpacity) || 40) / 100})` }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{(lang === 'mn' ? c.title_mn : c.title_en) || ''}</h2>
            {(lang === 'mn' ? c.subtitle_mn : c.subtitle_en) && <p className="text-lg md:text-xl opacity-90">{lang === 'mn' ? c.subtitle_mn : c.subtitle_en}</p>}
          </div>
        </div>
      );
    case 'columns': {
      const count = parseInt(c.count) || 2;
      const cols = count >= 3
        ? [lang === 'mn' ? c.col1_mn : c.col1_en, lang === 'mn' ? c.col2_mn : c.col2_en, lang === 'mn' ? c.col3_mn : c.col3_en]
        : [lang === 'mn' ? c.col1_mn : c.col1_en, lang === 'mn' ? c.col2_mn : c.col2_en];
      return (
        <div style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, gap: `${c.gap || 24}px` }}>
            {cols.map((col, i) => <div key={i} className="whitespace-pre-wrap">{col || ''}</div>)}
          </div>
        </div>
      );
    }
    case 'html': {
      const rawHtmlCode = getHtmlCodeForLanguage(c, lang);
      if (!rawHtmlCode) return null;
      const configuredHeight = parseInt(s.height || c.height || '0') || 0;
      const iframeHeight = mobileFlow ? Math.max(parseInt(c.height || '0') || 0, 800) : Math.max(configuredHeight, 260);
      let htmlCode = applyHtmlTemplate(rawHtmlCode, s);
      htmlCode = applyHtmlButtonLinks(htmlCode, s);
      const extraCss = `${htmlResponsiveCss}${buildHtmlImageOverrideCssByCode(htmlCode, s)}`;
      return (
        <div style={wrap}>
          <HtmlBlockIframe srcDoc={buildHtmlSrcDoc(htmlCode, extraCss)} initialHeight={iframeHeight} autoHeight={mobileFlow} />
        </div>
      );
    }
    case 'list': {
      const items = ((lang === 'mn' ? c.items_mn : c.items_en) || '').split('\n').filter(Boolean);
      if (items.length === 0) return null;
      const Tag = c.listType === 'numbered' ? 'ol' : 'ul';
      return (
        <div style={wrap}>
          <Tag className={c.listType === 'numbered' ? 'list-decimal pl-6 space-y-1' : 'list-disc pl-6 space-y-1'}>
            {items.map((x: string, i: number) => <li key={i}>{x}</li>)}
          </Tag>
        </div>
      );
    }
    case 'quote': {
      const text = lang === 'mn' ? c.text_mn : c.text_en;
      if (!text) return null;
      return (
        <div style={wrap}>
          <blockquote className="border-l-4 border-teal-500 pl-6 py-2 italic text-lg text-gray-700">
            <p>{text}</p>
            {c.author && <footer className="mt-2 text-sm font-medium text-gray-500 not-italic">- {c.author}</footer>}
          </blockquote>
        </div>
      );
    }
    case 'attachment': {
      const fileUrl = resolvePageAssetUrl(c.url);
      if (!fileUrl) return null;
      const title = lang === 'mn' ? c.title_mn : c.title_en;
      const description = lang === 'mn' ? c.description_mn : c.description_en;
      const buttonText = lang === 'mn' ? c.button_mn : c.button_en;
      const fileName = getFileDisplayName(c.url, c.file_name);
      const isDownload = (c.buttonAction || 'download') === 'download';
      const openNew = (c.openInNewTab || 'true') === 'true';
      const btnPos = c.buttonPosition || 'left';
      const btnJustify = btnPos === 'center' ? 'justify-center' : btnPos === 'right' ? 'justify-end' : 'justify-start';
      const iconWrapClass = c.icon_url ? 'h-20 w-20 rounded-2xl' : 'h-12 w-12 rounded-xl';
      const iconUrl = resolvePageAssetUrl(c.icon_url);

      return (
        <div style={wrap}>
          <a
            href={fileUrl}
            target={openNew ? '_blank' : undefined}
            rel={openNew ? 'noreferrer' : undefined}
            download={isDownload ? (c.file_name || true) : undefined}
            onClick={async event => {
              if (isDownload) return;
              event.preventDefault();
              await openFileForView(fileUrl);
            }}
            className="group block rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-5 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/50"
          >
            <div className="flex items-start gap-4">
              <div className={`flex shrink-0 items-center justify-center bg-sky-100 text-sky-600 overflow-hidden ${iconWrapClass}`}>
                {iconUrl
                  ? <img src={iconUrl} alt="" className="h-full w-full object-cover" />
                  : <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05 12.25 20.24a6 6 0 1 1-8.49-8.49l9.19-9.2a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48" /></svg>
                }
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold text-slate-900 group-hover:text-sky-700">{title || fileName || 'Attachment'}</div>
                {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
                <div className={`mt-4 flex ${btnJustify}`}>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-sky-700">
                    {buttonText || (isDownload ? 'Download file' : 'View file')}
                  </div>
                </div>
              </div>
            </div>
          </a>
        </div>
      );
    }
    case 'filelink':
      return null;
    default:
      return null;
  }
}

export default function PageBuilderInlineContent({ page, language, className = '' }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  let contentBlocks: Block[] = [];
  let layoutSettings: LayoutSettings = {
    maxWidth: '1200',
    fullWidth: false,
    pagePaddingTop: '0',
    pagePaddingBottom: '0',
    pagePaddingLeft: '0',
    pagePaddingRight: '0',
  };

  try {
    const raw = page.content_blocks ? JSON.parse(page.content_blocks) : [];
    if (Array.isArray(raw)) {
      contentBlocks = raw;
    } else if (raw?.blocks) {
      contentBlocks = raw.blocks || [];
      layoutSettings = { ...layoutSettings, ...(raw.layout || {}) };
    }
  } catch {
    contentBlocks = [];
  }

  const visibleBlocks = contentBlocks.filter(block => {
    if (block.type !== 'attachment') return true;
    return Boolean(resolvePageAssetUrl(block.content?.url));
  });
  const positionedBlocks = visibleBlocks.filter(block => block.style?.posX || block.style?.posY);
  const hasBlocks = visibleBlocks.length > 0;
  const isHtmlOnlyPage = hasBlocks && visibleBlocks.every(block => block.type === 'html');
  const layoutMaxWidth = parseInt(layoutSettings.maxWidth || '1200', 10) || 1200;
  const isMobileViewport = viewportWidth > 0 && viewportWidth < 768;
  const useMobileFlowLayout = isMobileViewport && positionedBlocks.length > 0;
  const positionedMinX = positionedBlocks.length > 0
    ? positionedBlocks.reduce((min: number, block: Block) => Math.min(min, parseInt(block.style?.posX || '0', 10)), Number.POSITIVE_INFINITY)
    : 0;
  const positionedMaxX = positionedBlocks.reduce((max: number, block: Block) => {
    const right = parseInt(block.style?.posX || '0', 10) + parseInt(block.style?.width || String(layoutMaxWidth), 10);
    return Math.max(max, right);
  }, layoutMaxWidth);
  const normalizeMobilePositionedCanvas = false;
  const contentCanvasWidth = positionedBlocks.reduce((max: number, block: Block) => {
    const right = parseInt(block.style?.posX || '0', 10) + parseInt(block.style?.width || String(layoutMaxWidth), 10);
    return Math.max(max, right);
  }, layoutMaxWidth);
  const htmlCanvasWidth = normalizeMobilePositionedCanvas
    ? Math.max(1, positionedMaxX - positionedMinX)
    : Math.max(layoutMaxWidth, contentCanvasWidth);
  const positionedCanvasHeight = positionedBlocks.length > 0
    ? Math.max(400, positionedBlocks.reduce((max: number, block: Block) => {
      const bottom = parseInt(block.style?.posY || '0') + parseInt(block.style?.height || '200', 10);
      return Math.max(max, bottom);
    }, 0) + 100)
    : 0;
  const flowCanvasHeight = visibleBlocks.reduce((total: number, block: Block) => {
    const blockHeight = parseInt(block.style?.height || block.content?.height || '', 10);
    return total + (Number.isFinite(blockHeight) && blockHeight > 0 ? blockHeight : block.type === 'html' ? 320 : 140);
  }, 0);
  const scalableCanvas = !useMobileFlowLayout && (isHtmlOnlyPage || positionedBlocks.length > 0);
  const canvasWidth = scalableCanvas ? htmlCanvasWidth : layoutMaxWidth;
  const canvasHeight = positionedBlocks.length > 0 ? positionedCanvasHeight : Math.max(flowCanvasHeight, 1);
  const canvasScale = scalableCanvas && viewportWidth > 0 && viewportWidth < canvasWidth
    ? Math.max(viewportWidth / canvasWidth, 0.1)
    : 1;
  const isCanvasScaled = canvasScale < 0.999;
  const mobileCanvasOffsetX = normalizeMobilePositionedCanvas ? positionedMinX : 0;
  const currentLanguageId = language === 'mn' ? 1 : 2;
  const title = getTranslation(page.title_translations, currentLanguageId);
  const description = getTranslation(page.description_translations, currentLanguageId);
  const descriptionLabel = description?.label || '';

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const update = () => {
      setViewportWidth(node.getBoundingClientRect().width || node.clientWidth || window.innerWidth || 0);
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className={`animate-page-fade-in w-full max-w-full overflow-x-hidden ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {page.image && (
        <div className="relative w-full aspect-[16/6] min-h-[240px] overflow-hidden rounded-3xl mb-8 bg-slate-100">
          <img
            src={page.image}
            alt={title?.label || 'Page Banner'}
            className="h-full w-full object-cover"
            onError={event => { event.currentTarget.style.display = 'none'; }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      )}

      {descriptionLabel && (
        <header className="pb-8 md:pb-10 animate-page-fade-in">
          <p className="text-sm md:text-base text-slate-600 max-w-3xl leading-7">{descriptionLabel}</p>
        </header>
      )}

      {hasBlocks ? (
        <div
          ref={viewportRef}
          className="animate-page-fade-in-up w-full max-w-full overflow-x-hidden"
          style={{
            maxWidth: layoutSettings.fullWidth || scalableCanvas ? '100%' : `${layoutMaxWidth}px`,
            width: '100%',
            margin: '0 auto',
            paddingTop: `${layoutSettings.pagePaddingTop || 0}px`,
            paddingBottom: `${layoutSettings.pagePaddingBottom || 0}px`,
            paddingLeft: isCanvasScaled ? '0px' : `${layoutSettings.pagePaddingLeft || 16}px`,
            paddingRight: isCanvasScaled ? '0px' : `${layoutSettings.pagePaddingRight || 16}px`,
          }}
        >
          <div
            className={isHtmlOnlyPage ? 'w-full max-w-full overflow-hidden' : 'w-full max-w-full overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-100'}
            style={isCanvasScaled ? { height: `${canvasHeight * canvasScale}px` } : undefined}
          >
            <div
              className="relative"
              style={{
                width: useMobileFlowLayout ? '100%' : scalableCanvas ? `${canvasWidth}px` : undefined,
                maxWidth: scalableCanvas ? undefined : '100%',
                transform: isCanvasScaled ? `scale(${canvasScale})` : undefined,
                transformOrigin: isCanvasScaled ? 'top left' : undefined,
                paddingLeft: isHtmlOnlyPage ? '0px' : '16px',
                paddingRight: isHtmlOnlyPage ? '0px' : '16px',
                minHeight: positionedBlocks.length > 0
                  ? `${positionedCanvasHeight}px`
                  : undefined,
              }}
            >
              {visibleBlocks.map(block => {
                const hasPosition = block.style?.posX || block.style?.posY;
                return hasPosition && !useMobileFlowLayout ? (
                  <div
                    key={block.id}
                    style={{
                      position: 'absolute',
                      left: `${Math.max(0, parseInt(block.style.posX || '0', 10) - mobileCanvasOffsetX)}px`,
                      top: `${block.style.posY || 0}px`,
                      width: block.style.width ? `${block.style.width}px` : 'auto',
                      height: block.style.height ? `${block.style.height}px` : 'auto',
                      zIndex: parseInt(block.style.zIndex || '1'),
                      overflow: 'hidden',
                    }}
                  >
                    <RenderBlock block={block} lang={language} />
                  </div>
                ) : (
                  <RenderBlock key={block.id} block={block} lang={language} mobileFlow={useMobileFlowLayout} />
                );
              })}
            </div>
          </div>
        </div>
      ) : descriptionLabel ? (
        <article className="max-w-3xl mx-auto animate-page-fade-in-up">
          <div className="rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden bg-white">
            <div className="px-6 md:px-10 lg:px-12 py-10 md:py-14">
              <div className="whitespace-pre-wrap text-slate-700" style={{ fontSize: '17px', lineHeight: '1.8' }}>
                {descriptionLabel}
              </div>
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
}
