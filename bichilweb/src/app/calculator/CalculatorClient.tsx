'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import type { Locale } from '@/lib/i18n';

export interface ProductDetail {
  id: number;
  amount: number | null;
  min_interest_rate: number | null;
  max_interest_rate: number | null;
  term_months: number | null;
}

export interface ProductItem {
  id: number;
  product_type: number | null;
  translations: { language: number; label: string }[];
  details: ProductDetail[];
}

export interface CategoryItem {
  id: number;
  translations: { language: number; label: string }[];
  product_types: {
    id: number;
    translations: { language: number; label: string }[];
    products: { id: number; translations: { language: number; label: string }[] }[];
  }[];
}

interface ScheduleRow {
  index: number;
  days: number;
  totalPayment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface CalcConfig {
  banner_image?: string;
  banner_mobile_image?: string;
}

export default function CalculatorClient({ locale, products, categories, config }: {
  locale: Locale;
  products: ProductItem[];
  categories: CategoryItem[];
  config: CalcConfig | null;
}) {
  const langId = locale === 'mn' ? 2 : 1;
  const t = useCallback((mn: string, en: string) => (locale === 'mn' ? mn : en), [locale]);

  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleType, setScheduleType] = useState<'annuity' | 'equal_principal'>('annuity');

  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [termMonths, setTermMonths] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [carPrice, setCarPrice] = useState('');
  const [downPayment, setDownPayment] = useState('');

  const getTranslation = useCallback((translations: { language: number; label: string }[]) => {
    const tr = translations?.find(t => t.language === langId);
    const fallback = translations?.find(t => t.language !== langId);
    return tr?.label || fallback?.label || '';
  }, [langId]);

  // Map product ID → category info
  const productCategoryMap = useMemo(() => {
    const map = new Map<number, { categoryId: number; categoryName: string; typeName: string }>();
    categories.forEach(cat => {
      const catName = getTranslation(cat.translations);
      cat.product_types?.forEach(pt => {
        const typeName = pt.translations?.length ? getTranslation(pt.translations) : '';
        pt.products?.forEach(p => {
          map.set(p.id, { categoryId: cat.id, categoryName: catName, typeName });
        });
      });
    });
    return map;
  }, [categories, getTranslation]);

  // Check if selected product is car-related
  const isCarProduct = useMemo(() => {
    if (!selectedProduct) return false;
    const catInfo = productCategoryMap.get(Number(selectedProduct));
    const product = products.find(p => p.id === Number(selectedProduct));
    const productName = product ? getTranslation(product.translations) : '';

    const combined = ((catInfo?.categoryName || '') + ' ' + (catInfo?.typeName || '') + ' ' + productName).toLowerCase();
    return combined.includes('автомашин') || combined.includes('авто машин') || combined.includes('auto') || combined.includes('машин') || combined.includes('car');
  }, [selectedProduct, productCategoryMap, products, getTranslation]);

  // Group products for dropdown
  const groupedProducts = useMemo(() => {
    const groups: { categoryName: string; items: { id: number; name: string }[] }[] = [];
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
      if (items.length) groups.push({ categoryName: catName, items });
    });

    const otherItems: { id: number; name: string }[] = [];
    products.forEach(p => {
      if (!usedProductIds.has(p.id)) {
        const name = getTranslation(p.translations);
        if (name) otherItems.push({ id: p.id, name });
      }
    });
    if (otherItems.length) groups.push({ categoryName: t('Бусад', 'Other'), items: otherItems });

    return groups;
  }, [categories, products, getTranslation, t]);

  // When product changes, fill interest rate and term from details
  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    setShowSchedule(false);

    // Reset fields
    setCarPrice('');
    setDownPayment('');
    setLoanAmount('');
    setInterestRate('');
    setTermMonths('');

    if (productId) {
      const product = products.find(p => p.id === Number(productId));

      const catInfo = productCategoryMap.get(Number(productId));
      const productName = product ? getTranslation(product.translations) : '';
      const combined = ((catInfo?.categoryName || '') + ' ' + (catInfo?.typeName || '') + ' ' + productName).toLowerCase();
      const isCar = combined.includes('автомашин') || combined.includes('авто машин') || combined.includes('auto') || combined.includes('машин') || combined.includes('car');

      if (product?.details?.length) {
        const detail = product.details[0];
        if (detail.amount != null) {
          const amtStr = String(Math.round(Number(detail.amount)));
          if (isCar) {
            setCarPrice(amtStr); // Автомашины бүтээгдэхүүн бол машины үнэнд оруулна
          } else {
            setLoanAmount(amtStr); // Бусад бүтээгдэхүүн бол шууд зээлийн хэмжээнд орно
          }
        }
        if (detail.max_interest_rate != null) {
          setInterestRate(String(detail.max_interest_rate));
        } else if (detail.min_interest_rate != null) {
          setInterestRate(String(detail.min_interest_rate));
        }
        if (detail.term_months != null) {
          setTermMonths(String(detail.term_months));
        }
      }
    }
  };

  // When car price or down payment change, update loan amount automatically
  const handleCarPriceChange = (value: string) => {
    setCarPrice(value);
    if (isCarProduct) {
      const price = parseFloat(value) || 0;
      const dp = parseFloat(downPayment) || 0;
      const amount = Math.max(0, price - dp);
      setLoanAmount(amount > 0 ? String(amount) : '');
    }
  };

  const handleDownPaymentChange = (value: string) => {
    setDownPayment(value);
    if (isCarProduct) {
      const price = parseFloat(carPrice) || 0;
      const dp = parseFloat(value) || 0;
      const amount = Math.max(0, price - dp);
      setLoanAmount(amount > 0 ? String(amount) : '');
    }
  };

  // Calculate monthly payment (annuity)
  const monthlyPayment = useMemo(() => {
    const P = parseFloat(loanAmount) || 0;
    const r = (parseFloat(interestRate) || 0) / 100;
    const n = parseInt(termMonths) || 0;
    if (P <= 0 || r <= 0 || n <= 0) return 0;
    return P * r / (1 - Math.pow(1 + r, -n));
  }, [loanAmount, interestRate, termMonths]);

  // Generate repayment schedule
  const generateSchedule = useCallback((type: 'annuity' | 'equal_principal'): ScheduleRow[] => {
    const P = parseFloat(loanAmount) || 0;
    const r = (parseFloat(interestRate) || 0) / 100;
    const n = parseInt(termMonths) || 0;
    const start = startDate ? new Date(startDate) : new Date();

    if (P <= 0 || r <= 0 || n <= 0) return [];

    const rows: ScheduleRow[] = [];
    let balance = P;
    const pmt = P * r / (1 - Math.pow(1 + r, -n));
    const fixedPrincipal = P / n;

    for (let i = 1; i <= n; i++) {
      const prevDate = new Date(start.getFullYear(), start.getMonth() + (i - 1), start.getDate());
      const payDate = new Date(start.getFullYear(), start.getMonth() + i, start.getDate());
      const days = Math.round((payDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      const interest = balance * r;
      let principalPaid: number;
      let totalPay: number;

      if (type === 'annuity') {
        if (i < n) {
          totalPay = pmt;
          principalPaid = pmt - interest;
        } else {
          principalPaid = balance;
          totalPay = balance + interest;
        }
      } else {
        principalPaid = i < n ? fixedPrincipal : balance;
        totalPay = principalPaid + interest;
      }

      balance = Math.max(0, balance - principalPaid);

      rows.push({
        index: i,
        days,
        totalPayment: Math.round(totalPay * 100) / 100,
        principal: Math.round(principalPaid * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
      });
    }
    return rows;
  }, [loanAmount, interestRate, termMonths, startDate]);

  const schedule = useMemo(() => {
    if (!showSchedule) return [];
    return generateSchedule(scheduleType);
  }, [showSchedule, scheduleType, generateSchedule]);

  // Total sums
  const scheduleTotals = useMemo(() => {
    if (!schedule.length) return { totalPayment: 0, totalPrincipal: 0, totalInterest: 0 };
    return {
      totalPayment: schedule.reduce((s, r) => s + r.totalPayment, 0),
      totalPrincipal: schedule.reduce((s, r) => s + r.principal, 0),
      totalInterest: schedule.reduce((s, r) => s + r.interest, 0),
    };
  }, [schedule]);

  const formatNum = (n: number) =>
    new Intl.NumberFormat('mn-MN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n);

  const formatDisplay = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('mn-MN').format(num);
  };

  const handleCalculate = () => {
    if (!loanAmount || !interestRate || !termMonths) return;
    setShowSchedule(true);
  };

  const canCalculate = !!(loanAmount && interestRate && termMonths && parseFloat(loanAmount) > 0);

  const selectedProductName = selectedProduct
    ? groupedProducts.flatMap(g => g.items).find(i => String(i.id) === selectedProduct)?.name
    : '';

  return (
    <main className="min-h-screen bg-gray-50/80 -mt-20 lg:-mt-24">
      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-36 pb-20 sm:pb-28 overflow-visible">
        {/* Background */}
        <div className="absolute inset-0 -bottom-24 sm:-bottom-32">
          {config?.banner_image ? (
            <>
              <Image src={config.banner_image} alt="Calculator" fill className="object-cover hidden sm:block" priority unoptimized />
              {config.banner_mobile_image && (
                <Image src={config.banner_mobile_image} alt="Calculator" fill className="object-cover sm:hidden" priority unoptimized />
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#001a4d] via-[#0048BA] to-[#003894]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-5">
            <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
            </svg>
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
              {t('Зээлийн тооцоолуур', 'Loan Calculator')}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            {t('Зээлийн тооцоолол', 'Loan Calculator')}
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-lg mx-auto">
            {t(
              'Зээлийн хэмжээ, хүү, хугацааг оруулан сарын төлбөр болон эргэн төлөх хуваарийг тооцоолно уу',
              'Enter loan amount, interest rate and term to calculate monthly payments and repayment schedule'
            )}
          </p>
        </div>
      </section>

      {/* Calculator Card */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 -mt-12 sm:-mt-16 pb-16">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-black/[0.08] border border-gray-100 overflow-hidden">

          {/* Form */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">

              {/* Барьцаа хөрөнгө (Collateral / Product) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('Барьцаа хөрөнгө', 'Collateral')}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-left bg-white
                      outline-none transition-all cursor-pointer flex items-center justify-between
                      ${productDropdownOpen ? 'border-[#0048BA] ring-2 ring-[#0048BA]/10' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className={selectedProduct ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                      {selectedProductName || t('— Бүтээгдэхүүн сонгох —', '— Select Product —')}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${productDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {productDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProductDropdownOpen(false)} />
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl shadow-black/8 max-h-72 overflow-y-auto overscroll-contain">
                        <button
                          type="button"
                          onClick={() => { handleProductSelect(''); setProductDropdownOpen(false); }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between
                            ${!selectedProduct ? 'text-[#0048BA] bg-blue-50/50 font-medium' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                          {t('— Бүтээгдэхүүн сонгох —', '— Select Product —')}
                          {!selectedProduct && (
                            <svg className="w-4 h-4 text-[#0048BA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                        {groupedProducts.map((group, gi) => (
                          <div key={gi}>
                            <div className="px-4 py-2 bg-gray-50/80 border-y border-gray-100">
                              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{group.categoryName}</span>
                            </div>
                            {group.items.map(item => {
                              const isSelected = selectedProduct === String(item.id);
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => { handleProductSelect(String(item.id)); setProductDropdownOpen(false); }}
                                  className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between gap-2
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
              </div>

              {/* Car-specific fields */}
              {isCarProduct && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                      {t('Автомашины үнэ /₮/', 'Car Price /₮/')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={carPrice ? formatDisplay(carPrice) : ''}
                        onChange={(e) => handleCarPriceChange(e.target.value.replace(/[^\d]/g, ''))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm bg-white
                          outline-none transition-all focus:border-[#0048BA] focus:ring-2 focus:ring-[#0048BA]/10 placeholder-gray-300"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">₮</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                      {t('Таны төлөх урьдчилгаа /₮/', 'Down Payment /₮/')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={downPayment ? formatDisplay(downPayment) : ''}
                        onChange={(e) => handleDownPaymentChange(e.target.value.replace(/[^\d]/g, ''))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm bg-white
                          outline-none transition-all focus:border-[#0048BA] focus:ring-2 focus:ring-[#0048BA]/10 placeholder-gray-300"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">₮</span>
                    </div>
                  </div>
                </>
              )}

              {/* Зээлийн хэмжээ */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('Зээлийн хэмжээ /₮/', 'Loan Amount /₮/')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={loanAmount ? formatDisplay(loanAmount) : ''}
                    onChange={(e) => setLoanAmount(e.target.value.replace(/[^\d]/g, ''))}
                    readOnly={isCarProduct}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm
                      outline-none transition-all focus:border-[#0048BA] focus:ring-2 focus:ring-[#0048BA]/10 placeholder-gray-300
                      ${isCarProduct ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">₮</span>
                </div>
                {selectedProduct && !isCarProduct && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t('Бүтээгдэхүүнээс автоматаар бөглөгдсөн', 'Auto-filled from product')}
                  </p>
                )}
              </div>

              {/* Хүүгийн түвшин */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('Хүүгийн түвшин /% сарын/', 'Interest Rate /% monthly/')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={interestRate}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.]/g, '');
                      if (val.split('.').length <= 2) setInterestRate(val);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm bg-white
                      outline-none transition-all focus:border-[#0048BA] focus:ring-2 focus:ring-[#0048BA]/10 placeholder-gray-300"
                    placeholder="0.0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">%</span>
                </div>
                {selectedProduct && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t('Бүтээгдэхүүнээс автоматаар бөглөгдсөн', 'Auto-filled from product')}
                  </p>
                )}
              </div>

              {/* Зээлийн хугацаа */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('Зээлийн хугацаа /сараар/', 'Loan Term /months/')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={termMonths}
                    onChange={(e) => setTermMonths(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm bg-white
                      outline-none transition-all focus:border-[#0048BA] focus:ring-2 focus:ring-[#0048BA]/10 placeholder-gray-300"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">
                    {t('сар', 'mo')}
                  </span>
                </div>
                {selectedProduct && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t('Бүтээгдэхүүнээс автоматаар бөглөгдсөн', 'Auto-filled from product')}
                  </p>
                )}
              </div>

              {/* Зээл авах огноо */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('Зээл авах огноо', 'Loan Start Date')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm bg-white
                    outline-none transition-all focus:border-[#0048BA] focus:ring-2 focus:ring-[#0048BA]/10"
                />
              </div>

              {/* Сард төлөх дүн (calculated) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('Сард төлөх дүн /₮/', 'Monthly Payment /₮/')}
                </label>
                <div className="px-4 py-3 rounded-xl border-2 border-dashed border-[#0048BA]/20 bg-blue-50/30 text-[#0048BA] font-bold text-lg sm:text-xl">
                  {monthlyPayment > 0 ? (
                    <span>{formatNum(monthlyPayment)} ₮</span>
                  ) : (
                    <span className="text-gray-300 font-normal text-sm">{t('Мэдээлэл оруулна уу', 'Enter details above')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <div className="mt-8">
              <button
                onClick={handleCalculate}
                disabled={!canCalculate}
                className="w-full py-3.5 bg-[#0048BA] text-white font-semibold text-sm rounded-xl
                  hover:bg-[#003894] disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-200 hover:shadow-lg hover:shadow-[#0048BA]/25 active:scale-[0.98]"
              >
                {t('Тооцоолох', 'Calculate')}
              </button>
            </div>
          </div>

          {/* Schedule Section */}
          {showSchedule && schedule.length > 0 && (
            <div className="border-t border-gray-100">

              {/* Summary bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-100">
                <div className="bg-white p-5 sm:p-6 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('Нийт төлөлт', 'Total Payment')}</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{formatNum(scheduleTotals.totalPayment)} ₮</p>
                </div>
                <div className="bg-white p-5 sm:p-6 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('Үндсэн зээл', 'Principal')}</p>
                  <p className="text-lg sm:text-xl font-bold text-[#0048BA]">{formatNum(scheduleTotals.totalPrincipal)} ₮</p>
                </div>
                <div className="bg-white p-5 sm:p-6 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('Нийт хүү', 'Total Interest')}</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-600">{formatNum(scheduleTotals.totalInterest)} ₮</p>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="px-6 sm:px-8 lg:px-10 pt-6">
                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                  <button
                    onClick={() => setScheduleType('annuity')}
                    className={`px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200
                      ${scheduleType === 'annuity'
                        ? 'bg-white text-[#0048BA] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t('НИЙТ ТӨЛӨЛТ ТЭНЦҮҮ', 'EQUAL TOTAL PAYMENT')}
                  </button>
                  <button
                    onClick={() => setScheduleType('equal_principal')}
                    className={`px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200
                      ${scheduleType === 'equal_principal'
                        ? 'bg-white text-[#0048BA] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t('ҮНДСЭН ТӨЛӨЛТ ТЭНЦҮҮ', 'EQUAL PRINCIPAL')}
                  </button>
                </div>
              </div>

              {/* Schedule heading */}
              <div className="px-6 sm:px-8 lg:px-10 pt-5 pb-3">
                <h3 className="font-bold text-gray-900 text-base">
                  {t('Эргэн төлөх хуваарь', 'Repayment Schedule')}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {scheduleType === 'annuity'
                    ? t('Нийт төлөлт тэнцүү аргаар', 'Equal total payment method')
                    : t('Үндсэн төлөлт тэнцүү аргаар', 'Equal principal payment method')}
                </p>
              </div>

              {/* Table */}
              <div className="px-4 sm:px-8 lg:px-10 pb-8 overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t('Д/д', '#')}</th>
                      <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t('Хоног', 'Days')}</th>
                      <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t('Нийт төлөлт', 'Total')}</th>
                      <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t('Үндсэн зээл', 'Principal')}</th>
                      <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t('Хүү', 'Interest')}</th>
                      <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t('Үлдэгдэл', 'Balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.index} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                        <td className="py-2.5 px-3 text-gray-500 font-medium">{row.index}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{row.days}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-gray-900">{formatNum(row.totalPayment)}</td>
                        <td className="py-2.5 px-3 text-right text-[#0048BA]">{formatNum(row.principal)}</td>
                        <td className="py-2.5 px-3 text-right text-amber-600">{formatNum(row.interest)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-700 font-medium">{formatNum(row.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50/50">
                      <td className="py-3 px-3 font-bold text-gray-700" colSpan={2}>{t('Нийт', 'Total')}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">{formatNum(scheduleTotals.totalPayment)}</td>
                      <td className="py-3 px-3 text-right font-bold text-[#0048BA]">{formatNum(scheduleTotals.totalPrincipal)}</td>
                      <td className="py-3 px-3 text-right font-bold text-amber-600">{formatNum(scheduleTotals.totalInterest)}</td>
                      <td className="py-3 px-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-6 px-4">
          {t(
            'Энэхүү тооцоолуур нь зөвхөн мэдээллийн зорилготой бөгөөд бодит зээлийн нөхцөл өөр байж болно.',
            'This calculator is for informational purposes only. Actual loan terms may vary.'
          )}
        </p>
      </section>
    </main>
  );
}
