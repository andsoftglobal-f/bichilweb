'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getApiBase } from '@/lib/apiBase';
import type { Locale } from '@/lib/i18n';

export interface PageConfig {
  id: number;
  banner_image: string;
  mobile_banner_image: string;
  title_mn: string;
  title_en: string;
  subtitle_mn: string;
  subtitle_en: string;
  disclaimer_mn: string;
  disclaimer_en: string;
  button_text_mn: string;
  button_text_en: string;
  success_title_mn: string;
  success_title_en: string;
  success_subtitle_mn: string;
  success_subtitle_en: string;
  success_description_mn: string;
  success_description_en: string;
  form_title_mn: string;
  form_title_en: string;
  form_subtitle_mn: string;
  form_subtitle_en: string;
  text_styles: Record<string, { fontSize?: string; color?: string; fontWeight?: string; fontFamily?: string }>;
  active: boolean;
}

interface ProductDetailItem {
  id: number;
  amount: number | null;
  min_fee_percent: number | null;
  max_fee_percent: number | null;
  min_interest_rate: number | null;
  max_interest_rate: number | null;
  term_months: number | null;
  min_processing_hours: number | null;
  max_processing_hoyrs: number | null;
  description_mn: string | null;
  description_en: string | null;
}

interface TranslationItem {
  language: number;
  label: string;
}

interface ProductDocumentItem {
  id: number;
  document?: {
    id: number;
    translations?: TranslationItem[];
  };
}

interface ProductCollateralItem {
  id: number;
  collateral?: {
    id: number;
    translations?: TranslationItem[];
  };
}

interface ProductConditionItem {
  id: number;
  condition?: {
    id: number;
    translations?: TranslationItem[];
  };
}

export interface ProductItem {
  id: number;
  translations: { language: number; label: string }[];
  product_type?: number;
  details?: ProductDetailItem[];
  documents?: ProductDocumentItem[];
  collaterals?: ProductCollateralItem[];
  conditions?: ProductConditionItem[];
}

export interface CategoryItem {
  id: number;
  translations: { language: number; label: string }[];
  product_types?: {
    id: number;
    translations: { language: number; label: string }[];
    products: { id: number; translations: { language: number; label: string }[] }[];
  }[];
}

export default function LoanRequestClient({ locale, pageConfig, products, categories }: {
  locale: Locale;
  pageConfig: PageConfig | null;
  products: ProductItem[];
  categories: CategoryItem[];
}) {
  const language = locale;
  const t = (mn: string, en: string) => (locale === 'mn' ? mn : en);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    last_name: '',
    first_name: '',
    phone: '',
    product: '',
  });

  const langId = language === 'mn' ? 2 : 1;

  const getTranslation = (translations: { language: number; label: string }[]) => {
    const tr = translations?.find(t => t.language === langId);
    const fallback = translations?.find(t => t.language !== langId);
    return tr?.label || fallback?.label || '';
  };

  const title = pageConfig
    ? (language === 'mn' ? pageConfig.title_mn : pageConfig.title_en) || t('Зээлийн хүсэлт', 'Loan Request')
    : t('Зээлийн хүсэлт', 'Loan Request');

  const disclaimer = pageConfig
    ? (language === 'mn' ? pageConfig.disclaimer_mn : pageConfig.disclaimer_en)
    : '';

  const buttonText = pageConfig
    ? (language === 'mn' ? pageConfig.button_text_mn : pageConfig.button_text_en) || t('Хүсэлт илгээх', 'Submit Request')
    : t('Хүсэлт илгээх', 'Submit Request');

  const successTitle = pageConfig
    ? (language === 'mn' ? pageConfig.success_title_mn : pageConfig.success_title_en) || t('Баярлалаа!', 'Thank you!')
    : t('Баярлалаа!', 'Thank you!');

  const successSubtitle = pageConfig
    ? (language === 'mn' ? pageConfig.success_subtitle_mn : pageConfig.success_subtitle_en) || t('Хүсэлт амжилттай илгээгдлээ', 'Request submitted successfully')
    : t('Хүсэлт амжилттай илгээгдлээ', 'Request submitted successfully');

  const successDescription = pageConfig
    ? (language === 'mn' ? pageConfig.success_description_mn : pageConfig.success_description_en) || t('Манай мэргэжилтэн тантай удахгүй холбогдох болно.', 'Our specialist will contact you soon.')
    : t('Манай мэргэжилтэн тантай удахгүй холбогдох болно.', 'Our specialist will contact you soon.');

  const formTitle = pageConfig
    ? (language === 'mn' ? pageConfig.form_title_mn : pageConfig.form_title_en) || t('Мэдээллээ бөглөнө үү', 'Fill in your details')
    : t('Мэдээллээ бөглөнө үү', 'Fill in your details');

  const formSubtitle = pageConfig
    ? (language === 'mn' ? pageConfig.form_subtitle_mn : pageConfig.form_subtitle_en) || t('Бид тантай холбогдох болно', 'We will contact you')
    : t('Бид тантай холбогдох болно', 'We will contact you');

  const ts = pageConfig?.text_styles || {};
  const styleFor = (key: string): React.CSSProperties => {
    const s = ts[key];
    if (!s) return {};
    return {
      ...(s.fontSize ? { fontSize: s.fontSize } : {}),
      ...(s.color ? { color: s.color } : {}),
      ...(s.fontWeight ? { fontWeight: Number(s.fontWeight) || (s.fontWeight as React.CSSProperties['fontWeight']) } : {}),
      ...(s.fontFamily ? { fontFamily: s.fontFamily } : {}),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.last_name.trim() || !form.first_name.trim()) {
      setError(t('Овог, нэрээ оруулна уу', 'Please enter your name'));
      return;
    }
    if (!/^\d{8}$/.test(form.phone)) {
      setError(t('Утасны дугаар 8 оронтой тоо байх ёстой', 'Phone must be 8 digits'));
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${getApiBase()}/loan-request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_name: form.last_name.trim(),
          first_name: form.first_name.trim(),
          phone: form.phone,
          product: form.product ? Number(form.product) : null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(t('Хүсэлт илгээхэд алдаа гарлаа. Дахин оролдоно уу.', 'Failed to submit. Please try again.'));
      }
    } catch {
      setError(t('Сервертэй холбогдож чадсангүй', 'Could not connect to server'));
    } finally {
      setSubmitting(false);
    }
  };

  if (pageConfig && !pageConfig.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">{t('Энэ хуудас түр хаагдсан байна', 'This page is temporarily unavailable')}</p>
        </div>
      </div>
    );
  }

  // Group products by category using the nested categories API (preserves admin sort_order)
  const groupedProducts: { categoryName: string; items: { id: number; name: string }[] }[] = [];

  // Build a set of product IDs that appear in the nested categories tree
  const usedProductIds = new Set<number>();

  categories.forEach(cat => {
    const catName = getTranslation(cat.translations);
    const items: { id: number; name: string }[] = [];
    cat.product_types?.forEach(pt => {
      pt.products?.forEach(p => {
        const name = getTranslation(p.translations);
        if (name) {
          items.push({ id: p.id, name });
          usedProductIds.add(p.id);
        }
      });
    });
    if (items.length) groupedProducts.push({ categoryName: catName, items });
  });

  // Add any products not in the category tree as "Бусад"
  const otherItems: { id: number; name: string }[] = [];
  products.forEach(p => {
    if (!usedProductIds.has(p.id)) {
      const name = getTranslation(p.translations);
      if (name) otherItems.push({ id: p.id, name });
    }
  });
  if (otherItems.length) groupedProducts.push({ categoryName: t('Бусад', 'Other'), items: otherItems });

  // ── Success State ──
  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0048BA] via-[#003894] to-[#002060] -mt-20 lg:-mt-24 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-white/[0.04] rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
          {/* Floating particles */}
          <div className="absolute top-[15%] left-[20%] w-2 h-2 bg-white/20 rounded-full animate-bounce [animation-duration:3s]" />
          <div className="absolute top-[25%] right-[25%] w-1.5 h-1.5 bg-white/15 rounded-full animate-bounce [animation-duration:4s] [animation-delay:0.5s]" />
          <div className="absolute bottom-[30%] left-[15%] w-1 h-1 bg-white/20 rounded-full animate-bounce [animation-duration:3.5s] [animation-delay:1s]" />
          <div className="absolute top-[40%] right-[10%] w-2.5 h-2.5 bg-white/10 rounded-full animate-bounce [animation-duration:5s] [animation-delay:0.3s]" />
          <div className="absolute bottom-[20%] right-[30%] w-1.5 h-1.5 bg-white/15 rounded-full animate-bounce [animation-duration:4.5s] [animation-delay:1.5s]" />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <div className="text-center max-w-lg mx-auto animate-fadeIn">

            {/* Success icon with ripple */}
            <div className="relative w-32 h-32 mx-auto mb-10">
              {/* Outer ripple rings */}
              <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping [animation-duration:2s]" />
              <div className="absolute inset-[-8px] rounded-full border border-white/5 animate-ping [animation-duration:3s]" />
              {/* Glow */}
              <div className="absolute inset-[-16px] bg-white/5 rounded-full blur-xl" />
              {/* Main circle */}
              <div className="relative w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl shadow-black/20">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-[#0048BA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Text content */}
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight" style={styleFor('success_title')}>
              {successTitle}
            </h2>

            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-8 h-px bg-white/20" />
              <div className="w-2 h-2 bg-white/30 rounded-full" />
              <div className="w-8 h-px bg-white/20" />
            </div>

            <p className="text-white/90 font-medium text-xl mb-3" style={styleFor('success_subtitle')}>
              {successSubtitle}
            </p>
            <p className="text-white/40 text-sm mb-12 leading-relaxed max-w-sm mx-auto" style={styleFor('success_description')}>
              {successDescription}
            </p>

            {/* Button */}
            <Link
              href="/"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-[#0048BA] rounded-2xl font-semibold
                hover:bg-white/95 transition-all duration-300 hover:shadow-2xl hover:shadow-white/10 active:scale-[0.97]
                hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('Нүүр хуудас руу буцах', 'Back to Home')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen -mt-20 lg:-mt-24">

      {/* ── Full-viewport Hero with Form ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        {pageConfig?.banner_image ? (
          <>
            <Image src={pageConfig.banner_image} alt={title} fill className="object-cover hidden sm:block" priority unoptimized />
            {pageConfig.mobile_banner_image && (
              <Image src={pageConfig.mobile_banner_image} alt={title} fill className="object-cover sm:hidden" priority unoptimized />
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#001a4d] via-[#0048BA] to-[#003894]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-32 sm:py-0">
          <div className="flex items-center justify-center">

            {/* Form card */}
            <div className="w-full max-w-[440px]">
              <form
                onSubmit={handleSubmit}
                className="bg-white/[0.95] backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/20 p-6 sm:p-8"
              >
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900" style={styleFor('form_title')}>
                    {formTitle}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1" style={styleFor('form_subtitle')}>{formSubtitle}</p>
                </div>

                <div className="space-y-4">
                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t('Овог', 'Last Name')}</label>
                      <input
                        type="text"
                        value={form.last_name}
                        onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 text-sm bg-white
                          outline-none transition-all focus:border-[#0048BA] focus:ring-2 focus:ring-[#0048BA]/10 placeholder-gray-300"
                        placeholder={t('Овог', 'Last Name')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t('Нэр', 'First Name')}</label>
                      <input
                        type="text"
                        value={form.first_name}
                        onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 text-sm bg-white
                          outline-none transition-all focus:border-[#0048BA] focus:ring-2 focus:ring-[#0048BA]/10 placeholder-gray-300"
                        placeholder={t('Нэр', 'First Name')}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t('Утас', 'Phone')}</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">+976</span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setForm(f => ({ ...f, phone: val }));
                        }}
                        maxLength={8}
                        className="w-full pl-14 pr-10 py-2.5 rounded-lg border border-gray-200 text-gray-900 text-sm bg-white
                          outline-none transition-all focus:border-[#0048BA] focus:ring-2 focus:ring-[#0048BA]/10 placeholder-gray-300"
                        placeholder="9988 7766"
                      />
                      {form.phone.length === 8 && (
                        <svg className="w-5 h-5 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2 animate-fadeIn" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Product */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                      {t('Бүтээгдэхүүн', 'Product')}
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-left bg-white
                          outline-none transition-all cursor-pointer flex items-center justify-between
                          ${productDropdownOpen ? 'border-[#0048BA] ring-2 ring-[#0048BA]/10' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <span className={form.product ? 'text-gray-900' : 'text-gray-400'}>
                          {form.product
                            ? groupedProducts.flatMap(g => g.items).find(i => String(i.id) === form.product)?.name || t('— Сонгох —', '— Select —')
                            : t('— Сонгох —', '— Select —')
                          }
                        </span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${productDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>

                      {productDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setProductDropdownOpen(false)} />
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl shadow-black/8 max-h-64 overflow-y-auto overscroll-contain">
                            {/* Clear selection */}
                            <button
                              type="button"
                              onClick={() => { setForm(f => ({ ...f, product: '' })); setProductDropdownOpen(false); }}
                              className={`w-full px-3.5 py-2.5 text-left text-sm transition-colors flex items-center justify-between
                                ${!form.product ? 'text-[#0048BA] bg-blue-50/50 font-medium' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                              {t('— Сонгох —', '— Select —')}
                              {!form.product && (
                                <svg className="w-4 h-4 text-[#0048BA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </button>

                            {groupedProducts.map((group, gi) => (
                              <div key={gi}>
                                <div className="px-3.5 py-2 bg-gray-50/80 border-y border-gray-100">
                                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{group.categoryName}</span>
                                </div>
                                {group.items.map(item => {
                                  const isSelected = form.product === String(item.id);
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => { setForm(f => ({ ...f, product: String(item.id) })); setProductDropdownOpen(false); }}
                                      className={`w-full px-3.5 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-2
                                        ${isSelected ? 'text-[#0048BA] bg-blue-50/50 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                      <span className="truncate">{item.name}</span>
                                      {isSelected && (
                                        <svg className="w-4 h-4 text-[#0048BA] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Selected product details */}
                    {(() => {
                      if (!form.product) return null;
                      const selectedProduct = products.find(p => String(p.id) === form.product);
                      if (!selectedProduct) return null;
                      const detail = selectedProduct.details?.[0];
                      const getNestedLabel = (translations?: TranslationItem[]) => {
                        if (!translations?.length) return '';
                        const tr = translations.find(item => item.language === langId);
                        const fallback = translations.find(item => item.language !== langId);
                        return tr?.label || fallback?.label || '';
                      };

                      const materials = (selectedProduct.documents || [])
                        .map(item => getNestedLabel(item.document?.translations))
                        .filter(Boolean);

                      const collaterals = (selectedProduct.collaterals || [])
                        .map(item => getNestedLabel(item.collateral?.translations))
                        .filter(Boolean);

                      const conditions = (selectedProduct.conditions || [])
                        .map(item => getNestedLabel(item.condition?.translations))
                        .filter(Boolean);

                      const hasInfo = !!(
                        detail &&
                        (detail.amount || detail.min_fee_percent || detail.max_fee_percent || detail.min_interest_rate || detail.max_interest_rate || detail.term_months)
                      );
                      const hasExtras = materials.length > 0 || collaterals.length > 0 || conditions.length > 0;

                      if (!hasInfo && !hasExtras) return null;

                      const formatAmount = (val: number) => {
                        if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(val % 1_000_000_000 === 0 ? 0 : 1)} ${t('тэрбум', 'B')}`;
                        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)} ${t('сая', 'M')}`;
                        return val.toLocaleString();
                      };

                      return (
                        <div className="mt-2 p-3 bg-blue-50/60 border border-blue-100 rounded-xl animate-fadeIn">
                          {hasInfo && detail && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {detail.amount != null && detail.amount > 0 && (
                                <div className="flex flex-col">
                                  <span className="text-gray-400 font-medium">{t('Зээлийн дүн', 'Loan Amount')}</span>
                                  <span className="text-gray-800 font-semibold">{t('', 'Up to ')}{formatAmount(detail.amount)}₮</span>
                                </div>
                              )}
                              {(detail.min_fee_percent != null || detail.max_fee_percent != null) && (
                                <div className="flex flex-col">
                                  <span className="text-gray-400 font-medium">{t('Урьдчилгаа төлбөр /%/', 'Down Payment /%/')}</span>
                                  <span className="text-gray-800 font-semibold">
                                    {detail.min_fee_percent != null && detail.max_fee_percent != null && detail.min_fee_percent !== detail.max_fee_percent
                                      ? `${detail.min_fee_percent}% – ${detail.max_fee_percent}%`
                                      : `${detail.min_fee_percent ?? detail.max_fee_percent}%`
                                    }
                                  </span>
                                </div>
                              )}
                              {(detail.min_interest_rate != null || detail.max_interest_rate != null) && (
                                <div className="flex flex-col">
                                  <span className="text-gray-400 font-medium">{t('Хүү', 'Interest')}</span>
                                  <span className="text-gray-800 font-semibold">
                                    {detail.min_interest_rate != null && detail.max_interest_rate != null && detail.min_interest_rate !== detail.max_interest_rate
                                      ? `${detail.min_interest_rate}% – ${detail.max_interest_rate}%`
                                      : `${detail.min_interest_rate ?? detail.max_interest_rate}%`
                                    }
                                  </span>
                                </div>
                              )}
                              {detail.term_months != null && detail.term_months > 0 && (
                                <div className="flex flex-col">
                                  <span className="text-gray-400 font-medium">{t('Хугацаа', 'Term')}</span>
                                  <span className="text-gray-800 font-semibold">{detail.term_months} {t('сар', 'months')}</span>
                                </div>
                              )}
                              {(detail.min_processing_hours != null || detail.max_processing_hoyrs != null) && (
                                <div className="flex flex-col">
                                  <span className="text-gray-400 font-medium">{t('Шийдвэрлэх', 'Processing')}</span>
                                  <span className="text-gray-800 font-semibold">
                                    {detail.min_processing_hours != null && detail.max_processing_hoyrs != null && detail.min_processing_hours !== detail.max_processing_hoyrs
                                      ? `${detail.min_processing_hours}–${detail.max_processing_hoyrs} ${t('цаг', 'hrs')}`
                                      : `${detail.min_processing_hours ?? detail.max_processing_hoyrs} ${t('цаг', 'hrs')}`
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          {hasExtras && (
                            <div className={hasInfo ? 'mt-2 pt-2 border-t border-blue-100 space-y-2' : 'space-y-2'}>
                              {(() => {
                                const renderCollapsibleList = (titleMn: string, titleEn: string, items: string[]) => (
                                  <details className="group rounded-lg border border-blue-100 bg-white/70">
                                    <summary className="list-none cursor-pointer px-2.5 py-2 flex items-center justify-between gap-2">
                                      <span className="text-[11px] text-gray-600 font-medium">{t(titleMn, titleEn)}</span>
                                      <svg
                                        className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                      </svg>
                                    </summary>
                                    <ul className="px-2.5 pb-2 space-y-1 border-t border-blue-50">
                                      {items.map((item, idx) => (
                                        <li key={`${titleEn}-${idx}`} className="text-[11px] text-gray-700 pt-1">• {item}</li>
                                      ))}
                                    </ul>
                                  </details>
                                );

                                return (
                                  <>
                                    {materials.length > 0 && renderCollapsibleList('Шаардагдах материал', 'Required Documents', materials)}
                                    {collaterals.length > 0 && renderCollapsibleList('Барьцаа хөрөнгө', 'Collateral', collaterals)}
                                    {conditions.length > 0 && renderCollapsibleList('Нөхцөл', 'Conditions', conditions)}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Disclaimer */}
                  {disclaimer && (
                    <p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-line" style={styleFor('disclaimer')}>{disclaimer}</p>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600 animate-fadeIn">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#0048BA] text-white font-semibold text-sm rounded-xl
                      hover:bg-[#003894] disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 hover:shadow-lg hover:shadow-[#0048BA]/25 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('Илгээж байна...', 'Submitting...')}
                      </span>
                    ) : <span style={styleFor('button_text')}>{buttonText}</span>}
                  </button>

                  {/* Trust */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-300 pt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    {t('Нууцлал хамгаалагдсан', 'Privacy protected')}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent hidden lg:block" />
      </section>
    </main>
  );
}
