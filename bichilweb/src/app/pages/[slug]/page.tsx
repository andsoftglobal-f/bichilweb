import Link from 'next/link';
import Container from '@/components/Container';
import { fetchPageBySlug, getTranslation } from '@/lib/pagesApi';
import { getFontStyle } from '@/lib/fontUtils';
import { getLocale } from '@/lib/serverLocale';
import HtmlBlockIframe from '@/components/pageBuilder/HtmlBlockIframe';
import AttachmentLink from '@/components/pageBuilder/AttachmentLink';

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }
  .animate-scale-in {
    animation: scaleIn 0.4s ease-out;
  }
`;

const htmlResponsiveCss = `
  html,body{width:100%;max-width:100%;overflow:hidden;margin:0;}
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

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCK TYPES & RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

interface Block {
  id: string;
  type: string;
  // The page builder stores a free-form JSON blob per block type (heading,
  // text, image, video, button, banner, columns, html, list, quote,
  // attachment, ...), each with its own unrelated field set accessed
  // dynamically below — a real discriminated union isn't confidently
  // inferable without the page-builder's own type definitions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: Record<string, any>;
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
  if (url.startsWith('blob:')) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const origin = getBackendOrigin();
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

function buildHtmlSrcDoc(code?: string, extraCss = '') {
  const raw = (code || '').trim();
  if (!raw) return '';
  if (/<html[\s>]/i.test(raw)) {
    // Ensure <base target="_blank"> exists so all links open in new tab
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

function getHtmlImageSlotCount(code?: string) {
  const raw = code || '';
  const placeholderRe = /\{\{\s*IMAGE_URL(?:_(\d+))?\s*\}\}/gi;
  let m: RegExpExecArray | null;
  let maxIndex = 0;
  while ((m = placeholderRe.exec(raw)) !== null) {
    const idx = m[1] ? parseInt(m[1], 10) : 1;
    if (idx > maxIndex) maxIndex = idx;
  }
  if (maxIndex > 0) return maxIndex;

  const iconMatches = raw.match(/class\s*=\s*['"][^'"]*\bicon\b[^'"]*['"]/gi);
  return iconMatches ? Math.min(iconMatches.length, 12) : 0;
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
    const idx = idxRaw ? parseInt(idxRaw, 10) : nextImplicitIndex++;
    return getHtmlButtonStyleValue(style, idx);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHtmlCodeForLanguage(content: Record<string, any>, lang: string) {
  const legacyCode = content.code || '';
  const mnCode = content.code_mn || legacyCode;
  if (lang === 'mn') return mnCode || content.code_en || '';
  return content.code_en || mnCode || legacyCode;
}

function RenderBlock({ block, lang }: { block: Block; lang: string }) {
  const c = block.content;
  const s = block.style || {};
  const wrap: React.CSSProperties = {
    textAlign: (s.textAlign as React.CSSProperties['textAlign']) || 'left',
    backgroundColor: s.backgroundColor || undefined,
    color: s.textColor || undefined,
    paddingTop: `${s.paddingTop || 16}px`,
    paddingBottom: `${s.paddingBottom || 16}px`,
    paddingLeft: `${s.paddingLeft || 0}px`,
    paddingRight: `${s.paddingRight || 0}px`,
    borderRadius: `${s.borderRadius || 0}px`,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    ...getFontStyle(s.fontFamily),
    fontWeight: (s.fontWeight as React.CSSProperties['fontWeight']) || getFontStyle(s.fontFamily).fontWeight || undefined,
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
      const vars: Record<string, string> = {
        primary: 'bg-teal-600 text-white hover:bg-teal-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        outline: 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50',
      };
      return (
        <div style={wrap}>
          <a href={c.url || '#'} className={`inline-block px-6 py-3 rounded-lg font-medium transition-colors ${vars[c.variant] || vars.primary}`}>
            {text || 'Товч'}
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
      const n = parseInt(c.count) || 2;
      const cols = n >= 3
        ? [lang === 'mn' ? c.col1_mn : c.col1_en, lang === 'mn' ? c.col2_mn : c.col2_en, lang === 'mn' ? c.col3_mn : c.col3_en]
        : [lang === 'mn' ? c.col1_mn : c.col1_en, lang === 'mn' ? c.col2_mn : c.col2_en];
      return (
        <div style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: `${c.gap || 24}px` }}>
            {cols.map((col, i) => <div key={i} className="whitespace-pre-wrap">{col || ''}</div>)}
          </div>
        </div>
      );
    }
    case 'html': {
      const rawHtmlCode = getHtmlCodeForLanguage(c, lang);
      if (!rawHtmlCode) return null;
      const iframeHeight = Math.max(parseInt(s.height || c.height || '0') || 0, 260);
      let htmlCode = applyHtmlTemplate(rawHtmlCode, s);
      htmlCode = applyHtmlButtonLinks(htmlCode, s);
      const extraCss = `${htmlResponsiveCss}${buildHtmlImageOverrideCssByCode(htmlCode, s)}`;
      return (
        <div style={wrap}>
          <HtmlBlockIframe srcDoc={buildHtmlSrcDoc(htmlCode, extraCss)} initialHeight={iframeHeight} />
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
            {c.author && <footer className="mt-2 text-sm font-medium text-gray-500 not-italic">— {c.author}</footer>}
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
          <AttachmentLink
            fileUrl={fileUrl}
            iconUrl={iconUrl}
            title={title}
            description={description}
            buttonText={buttonText}
            fileName={fileName}
            isDownload={isDownload}
            fileDownloadName={c.file_name}
            openNew={openNew}
            btnJustify={btnJustify}
            iconWrapClass={iconWrapClass}
          />
        </div>
      );
    }
    case 'filelink':
      return null;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [language, page] = await Promise.all([getLocale(), fetchPageBySlug(slug)]);

  const currentLanguageId = language === 'mn' ? 1 : 2;

  const error = !page ? 'NOT_FOUND' : !page.active ? 'INACTIVE' : null;

  // Error states
  if (error || !page) {
    const errorMessages = {
      NOT_FOUND: {
        mn: { title: 'Хуудас олдсонгүй', message: 'Уучлаарай, таны хайсан хуудас олдсонгүй.' },
        en: { title: 'Page Not Found', message: 'Sorry, the page you are looking for could not be found.' }
      },
      INACTIVE: {
        mn: { title: 'Хуудас идэвхгүй', message: 'Энэ хуудас одоогоор идэвхгүй байна.' },
        en: { title: 'Page Inactive', message: 'This page is currently inactive.' }
      },
      NETWORK_ERROR: {
        mn: { title: 'Сүлжээний алдаа', message: 'Сүлжээний холболт тасарсан байна.' },
        en: { title: 'Network Error', message: 'Network connection failed.' }
      }
    };

    const currentError = errorMessages[error as keyof typeof errorMessages] || errorMessages.NOT_FOUND;
    const errorText = language === 'mn' ? currentError.mn : currentError.en;

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0d2347] to-[#0048BA] relative overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: `
          ${styles}
          @keyframes float3d { 0%,100% { transform: perspective(800px) rotateX(8deg) rotateY(-8deg) translateY(0); } 50% { transform: perspective(800px) rotateX(-4deg) rotateY(4deg) translateY(-20px); } }
          @keyframes glowPulse { 0%,100% { box-shadow: 0 0 40px rgba(0,72,186,0.3), 0 0 80px rgba(0,72,186,0.1); } 50% { box-shadow: 0 0 60px rgba(0,72,186,0.5), 0 0 120px rgba(0,72,186,0.2), 0 0 200px rgba(0,72,186,0.05); } }
          @keyframes textReveal { 0% { opacity:0; transform: translateY(30px) rotateX(-10deg); filter: blur(8px); } 100% { opacity:1; transform: translateY(0) rotateX(0); filter: blur(0); } }
          @keyframes slideUp { 0% { opacity:0; transform: translateY(40px); } 100% { opacity:1; transform: translateY(0); } }
          @keyframes orbitSlow { 0% { transform: rotate(0deg) translateX(180px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(180px) rotate(-360deg); } }
          @keyframes orbitMed { 0% { transform: rotate(120deg) translateX(240px) rotate(-120deg); } 100% { transform: rotate(480deg) translateX(240px) rotate(-480deg); } }
          @keyframes orbitFast { 0% { transform: rotate(240deg) translateX(140px) rotate(-240deg); } 100% { transform: rotate(600deg) translateX(140px) rotate(-600deg); } }
          @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }
          @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
          .animate-float3d { animation: float3d 6s ease-in-out infinite; }
          .animate-glowPulse { animation: glowPulse 3s ease-in-out infinite; }
          .animate-textReveal { animation: textReveal 0.8s cubic-bezier(0.16,1,0.3,1) forwards; }
          .animate-slideUp { animation: slideUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
          .animate-orbitSlow { animation: orbitSlow 20s linear infinite; }
          .animate-orbitMed { animation: orbitMed 15s linear infinite; }
          .animate-orbitFast { animation: orbitFast 10s linear infinite; }
          .animate-gridMove { animation: gridMove 8s linear infinite; }
          .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
        `}} />

        {/* Animated grid background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] animate-gridMove"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Orbiting particles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="animate-orbitSlow"><div className="w-2 h-2 bg-white/20 rounded-full blur-[1px]" /></div>
          <div className="animate-orbitMed"><div className="w-1.5 h-1.5 bg-blue-300/30 rounded-full blur-[1px]" /></div>
          <div className="animate-orbitFast"><div className="w-1 h-1 bg-white/30 rounded-full" /></div>
        </div>

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0048BA]/20 rounded-full blur-[120px] pointer-events-none" />

        <Container>
          <div className="relative z-10 py-28 sm:py-36 text-center" style={{ perspective: '1200px' }}>

            {/* 3D floating card with 404 */}
            <div className="animate-float3d mb-10 inline-block" style={{ transformStyle: 'preserve-3d' }}>
              <div className="relative animate-glowPulse rounded-3xl">
                {/* Glass card */}
                <div className="relative px-12 sm:px-20 py-10 sm:py-14 bg-white/[0.06] backdrop-blur-2xl rounded-3xl border border-white/[0.12]"
                  style={{ transformStyle: 'preserve-3d' }}>

                  {/* Inner glow */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent" />

                  {/* Reflection stripe */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                  {/* 404 text with 3D depth */}
                  <div className="relative" style={{ transform: 'translateZ(40px)' }}>
                    <span className="text-[100px] sm:text-[140px] font-black leading-none tracking-tighter select-none
                      bg-gradient-to-b from-white via-white/90 to-white/30 bg-clip-text text-transparent
                      drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]"
                      style={{ textShadow: '0 0 60px rgba(255,255,255,0.1)' }}>
                      404
                    </span>
                  </div>

                  {/* Subtitle under number */}
                  <div className="relative mt-2" style={{ transform: 'translateZ(20px)' }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.08] rounded-full border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-xs font-medium text-white/60 uppercase tracking-widest">
                        {language === 'mn' ? 'Хуудас олдсонгүй' : 'Page Not Found'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text content with stagger animation */}
            <div style={{ perspective: '600px' }}>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight animate-textReveal"
                style={{ animationDelay: '0.2s', opacity: 0 }}>
                {errorText.title}
              </h1>
              <p className="text-white/40 text-sm sm:text-base mb-12 max-w-md mx-auto leading-relaxed animate-textReveal"
                style={{ animationDelay: '0.4s', opacity: 0 }}>
                {errorText.message}
              </p>
            </div>

            {/* Animated divider */}
            <div className="flex items-center justify-center gap-3 mb-12 animate-slideUp" style={{ animationDelay: '0.5s', opacity: 0 }}>
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/20" />
              <div className="w-2 h-2 rounded-full border border-white/20 animate-pulse" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-white/20" />
            </div>

            {/* Button with shimmer */}
            <div className="animate-slideUp" style={{ animationDelay: '0.6s', opacity: 0 }}>
              <Link
                href="/"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-[#0048BA] rounded-2xl font-bold text-sm
                  overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.97] hover:-translate-y-1"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 animate-shimmer"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,72,186,0.08) 50%, transparent 100%)', backgroundSize: '200% 100%' }} />
                <svg className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:-translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="relative z-10">{language === 'mn' ? 'Нүүр хуудас руу буцах' : 'Back to Home'}</span>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Parse content_blocks
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
    } else if (raw && raw.blocks) {
      contentBlocks = raw.blocks || [];
      layoutSettings = { ...layoutSettings, ...(raw.layout || {}) };
    }
  } catch {
    contentBlocks = [];
  }

  const visibleBlocks = contentBlocks.filter((block) => {
    if (block.type !== 'attachment') return true;
    return Boolean(resolvePageAssetUrl(block.content?.url));
  });
  const positionedBlocks = visibleBlocks.filter((b) => b.style?.posX || b.style?.posY);
  const hasBlocks = visibleBlocks.length > 0;
  const isHtmlOnlyPage = hasBlocks && visibleBlocks.every((block) => block.type === 'html');
  const title = getTranslation(page.title_translations, currentLanguageId);
  const description = getTranslation(page.description_translations, currentLanguageId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <main className="pt-0 pb-8 md:pt-0 md:pb-16 lg:pt-0 lg:pb-20">
        {/* Product-style Banner */}
        {page.image && (
          <div className="relative w-full h-[420px] md:h-[600px] -mt-20 lg:-mt-24 overflow-hidden mb-6 md:mb-8">
            <img
              src={page.image}
              alt={title.label || 'Page Banner'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-50/80" />
          </div>
        )}

        {/* Product-style Description */}
        {description.label && (
          <Container>
            <header className="pt-2 md:pt-4 pb-8 md:pb-10 animate-fade-in">
              <p className="text-sm md:text-base text-slate-600 max-w-xl">{description.label}</p>
            </header>
          </Container>
        )}

        {hasBlocks ? (
          /* ── Block-based page rendering ── */
          <Container>
            <div
              className="animate-fade-in-up"
              style={{
                maxWidth: layoutSettings.fullWidth ? '100%' : `${layoutSettings.maxWidth || 1200}px`,
                margin: '0 auto',
                paddingTop: `${layoutSettings.pagePaddingTop || 0}px`,
                paddingBottom: `${layoutSettings.pagePaddingBottom || 0}px`,
                paddingLeft: `${layoutSettings.pagePaddingLeft || 16}px`,
                paddingRight: `${layoutSettings.pagePaddingRight || 16}px`,
              }}
            >
            {/* Render Blocks */}
            <div className={isHtmlOnlyPage ? 'overflow-visible' : 'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden'}>
              <div className="relative" style={{
                paddingLeft: isHtmlOnlyPage ? '0px' : '16px',
                paddingRight: isHtmlOnlyPage ? '0px' : '16px',
                minHeight: positionedBlocks.length > 0 && !isHtmlOnlyPage ? `${Math.max(400, positionedBlocks.reduce((max: number, b: Block) => {
                  const bottom = parseInt(b.style?.posY || '0') + parseInt(b.style?.height || '200')
                  return Math.max(max, bottom)
                }, 0) + 100)}px` : undefined,
              }}>
                {visibleBlocks.map((block) => {
                  const hasPosition = block.style?.posX || block.style?.posY
                  const shouldPosition = hasPosition && !isHtmlOnlyPage
                  return shouldPosition ? (
                    <div key={block.id} style={block.type === 'html' ? {
                      position: 'absolute',
                      left: 0, right: 0,
                      top: `${block.style.posY || 0}px`,
                      height: block.style.height ? `${block.style.height}px` : 'auto',
                      zIndex: parseInt(block.style.zIndex || '1'),
                      overflow: 'hidden',
                    } : {
                      position: 'absolute',
                      left: `${block.style.posX || 0}px`,
                      top: `${block.style.posY || 0}px`,
                      width: block.style.width ? `${block.style.width}px` : 'auto',
                      height: block.style.height ? `${block.style.height}px` : 'auto',
                      zIndex: parseInt(block.style.zIndex || '1'),
                      overflow: 'hidden',
                    }}>
                      <RenderBlock block={block} lang={language} />
                    </div>
                  ) : (
                    <RenderBlock key={block.id} block={block} lang={language} />
                  )
                })}
              </div>
            </div>
            </div>
          </Container>
        ) : (
          /* ── Legacy fallback: title + description ── */
          <Container>
            <article className="max-w-3xl mx-auto animate-fade-in-up">
              <div className="rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden bg-white">
                <div className="px-6 md:px-10 lg:px-12 py-10 md:py-14">
                  <div className="prose prose-slate max-w-none">
                    <div className="whitespace-pre-wrap space-y-4" style={{ fontSize: '17px', lineHeight: '1.8' }}>
                      {description.label}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </Container>
        )}
      </main>
    </div>
  );
}
