"use client";

import { useState, useRef, type CSSProperties } from "react";
import Container from "@/components/Container";
import { axiosInstance } from "@/lib/axios";
import { getFontStyle } from "@/lib/fontUtils";

/* ───────── Frontend Types ───────── */
export interface Policy {
  key: string;
  categoryId: string;
  title: string;
  content: string;
  accentColor: string;
  glowColor: string;
  iconBg: string;
  iconSrc?: string;
  fontfamily?: string;
  font_color?: string;
  fontsize?: string;
}
export interface PolicyCategory {
  id: string;
  name: string;
}
export interface Job {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  description: string;
  requirements?: string;
  deadline: string;
  status: string;
  icon_image?: string;
  icon_url?: string;
}

export interface SectionStyle {
  title_fontfamily: string; title_fontsize: string; title_color: string; title_weight: string;
  subtitle_fontfamily: string; subtitle_fontsize: string; subtitle_color: string; subtitle_weight: string;
  desc_fontfamily: string; desc_fontsize: string; desc_color: string;
  btn_bg: string; btn_color: string; btn_radius: string; btn_fontfamily: string; btn_fontsize: string; btn_fontweight: string;
  section_bg: string; section_border_radius: string; section_border_color: string; section_border_width: string;
  title_mn: string; title_en: string;
  subtitle_mn: string; subtitle_en: string;
  desc_mn: string; desc_en: string;
  btn_mn: string; btn_en: string;
  banner_image: string; banner_url: string;
  banner_desktop_image: string; banner_desktop_url: string;
  banner_tablet_image: string; banner_tablet_url: string;
  banner_mobile_image: string; banner_mobile_url: string;
  icon_image: string; icon_url: string;
  policy_title_fontfamily: string; policy_title_fontsize: string; policy_title_color: string; policy_title_weight: string;
  policy_desc_fontsize: string; policy_desc_color: string;
  policy_card_bg: string; policy_card_border_color: string; policy_card_border_radius: string;
  jobs_title_fontfamily: string; jobs_title_fontsize: string; jobs_title_color: string; jobs_title_weight: string;
  jobs_desc_fontsize: string; jobs_desc_color: string;
  jobs_card_bg: string; jobs_card_border_color: string; jobs_card_border_radius: string;
  jobs_badge_bg: string; jobs_badge_color: string;
  btn_icon_image: string; btn_icon_url: string;
  policy_tab_icon_image: string; policy_tab_icon_url: string;
  jobs_tab_icon_image: string; jobs_tab_icon_url: string;
  policy_tab_active_bg: string; policy_tab_active_color: string;
  jobs_tab_active_bg: string; jobs_tab_active_color: string;
}

export const UNCATEGORIZED_POLICY_CATEGORY_ID = "uncategorized";

/* ───────── Default icon SVG ───────── */
const DefaultPolicyIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

// This page's locale was never wired to the site-wide language system —
// it always renders Mongolian regardless of the visitor's chosen locale.
// Pre-existing behavior, left as-is (see i18n migration plan notes).
const language: "en" | "mn" = "mn";

export default function HRPageClient({ jobs, policies, policyCategories, sec }: {
  jobs: Job[];
  policies: Record<string, Policy>;
  policyCategories: PolicyCategory[];
  sec: SectionStyle;
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("policy");
  const contentRef = useRef<HTMLDivElement>(null);

  /* ── form state ── */
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", position: "", experience: "", message: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("first_name", form.firstName);
      fd.append("last_name", form.lastName);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("position", form.position || selectedJob?.title || "");
      fd.append("experience", form.experience);
      fd.append("message", form.message);
      if (selectedJob?.id) fd.append("job", selectedJob.id);
      if (cvFile) fd.append("cv_file", cvFile);
      await axiosInstance.post("/cv-applications/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setShowForm(false);
        setForm({ firstName: "", lastName: "", email: "", phone: "", position: "", experience: "", message: "" });
        setCvFile(null);
        setSelectedJob(null);
      }, 2200);
    } catch {
      setSubmitError("Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSubmitting(false);
    }
  };

  const policyKeys = Object.keys(policies);
  const activeCategoryId = activeTab.startsWith("category:") ? activeTab.replace("category:", "") : null;
  const bannerDesktop = sec.banner_desktop_url || sec.banner_desktop_image || sec.banner_url || sec.banner_image;
  const bannerTablet = sec.banner_tablet_url || sec.banner_tablet_image || bannerDesktop;
  const bannerMobile = sec.banner_mobile_url || sec.banner_mobile_image || bannerTablet;
  const heroBanner = bannerDesktop || bannerTablet || bannerMobile;
  const visiblePolicyKeys = policyKeys.filter((key) => {
    if (activeTab === "policy") {
      return policies[key].categoryId === UNCATEGORIZED_POLICY_CATEGORY_ID;
    }
    if (activeCategoryId) {
      return policies[key].categoryId === activeCategoryId;
    }
    return false;
  });
  const hasPolicyContent = policyKeys.length > 0;
  const hasJobs = jobs.length > 0;

  const formatDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return d;
    }
  };

  /* ══════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <main className="min-h-screen bg-white relative -mt-20 overflow-x-hidden pt-0 pb-20 lg:-mt-24">

      {/* Background Soft Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-100/40 to-cyan-50/20 blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#0048BA]/5 to-transparent blur-[100px]" />
      </div>

      <Container>
        <div className="max-w-5xl mx-auto">

          {/* ═══════ HERO SECTION ═══════ */}
          <div
            className={`text-center flex flex-col items-center justify-center ${heroBanner ? 'relative left-1/2 w-screen -translate-x-1/2 min-h-[520px] overflow-hidden rounded-none px-4 pb-16 pt-28 shadow-sm sm:min-h-[560px] sm:px-8 sm:pb-20 sm:pt-32 lg:min-h-[620px] lg:px-12 lg:pt-36' : 'py-12 sm:py-20'}`}
            style={heroBanner ? undefined : {
              background: sec.section_bg && sec.section_bg !== 'transparent' ? sec.section_bg : undefined,
            }}
          >
            {heroBanner && (
              <>
                <div className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat lg:block" style={{ backgroundImage: `url("${bannerDesktop}")` }} />
                <div className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat sm:block lg:hidden" style={{ backgroundImage: `url("${bannerTablet}")` }} />
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat sm:hidden" style={{ backgroundImage: `url("${bannerMobile}")` }} />
              </>
            )}
            <div className={heroBanner ? "relative z-10 max-w-3xl rounded-[28px] bg-white/25 px-5 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/30 backdrop-blur-sm sm:px-9 sm:py-8" : "contents"}>

            {/* Title */}
            <h1 className={`text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] max-w-4xl ${heroBanner ? 'mb-4' : 'mb-6'}`}
              style={{
                ...getFontStyle(sec.title_fontfamily),
                fontSize: sec.title_fontsize ? `${sec.title_fontsize}px` : undefined,
                color: sec.title_color || '#0f172a',
                fontWeight: (sec.title_weight || '800') as CSSProperties["fontWeight"],
              }}>
              {language === 'mn' ? sec.title_mn : sec.title_en}
            </h1>

            {/* Description */}
            <p className={`text-base sm:text-lg max-w-2xl text-slate-600 leading-relaxed text-justify ${heroBanner ? 'mb-0' : 'mb-10'}`}
              style={{
                ...getFontStyle(sec.desc_fontfamily),
                fontSize: sec.desc_fontsize ? `${sec.desc_fontsize}px` : undefined,
                color: sec.desc_color || '#475569',
              }}>
              {language === 'mn' ? sec.desc_mn : sec.desc_en}
            </p>
            </div>

            {/* Primary Action Button */}
            {(language === 'mn' ? sec.btn_mn : sec.btn_en) && (
              <button
                onClick={() => { setForm({ ...form, position: "" }); setShowForm(true); }}
                className={`group relative inline-flex items-center justify-center gap-2 px-8 py-4 transition-all hover:-translate-y-1 overflow-hidden ${heroBanner ? 'mt-7 shadow-lg shadow-blue-950/20' : ''}`}
                style={{
                  ...getFontStyle(sec.btn_fontfamily),
                  backgroundColor: sec.btn_bg || '#0048BA',
                  color: sec.btn_color || '#ffffff',
                  borderRadius: sec.btn_radius ? `${sec.btn_radius}px` : '9999px',
                  fontSize: sec.btn_fontsize ? `${sec.btn_fontsize}px` : undefined,
                  fontWeight: (sec.btn_fontweight || '600') as CSSProperties["fontWeight"],
                }}
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />

                {(sec.btn_icon_url || sec.btn_icon_image) && (
                  <span className="relative z-10 -ml-2 mr-0 inline-flex h-5 w-5 items-center justify-center overflow-visible">
                    <img src={sec.btn_icon_url || sec.btn_icon_image} alt="" className="h-8 w-8 max-w-none object-contain" />
                  </span>
                )}
                <span className="relative z-10">{language === 'mn' ? sec.btn_mn : sec.btn_en}</span>
                <svg className="w-6 h-6 ml-2 transition-transform group-hover:translate-x-1.5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>

          {/* ═══════ MODERN TABS ═══════ */}
          {(hasPolicyContent || policyCategories.length > 0 || hasJobs) && (
            <div className="-mx-4 mt-8 mb-10 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mt-10 sm:mb-14 sm:flex sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex min-w-max flex-nowrap gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200 backdrop-blur-sm shadow-inner sm:gap-1.5 sm:p-1.5 sm:rounded-[28px]">
                {hasPolicyContent && (
                  <button
                    onClick={() => { setActiveTab("policy"); setSelectedJob(null); }}
                    className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs transition-all duration-300 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm ${
                      activeTab === "policy"
                        ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-[#0048BA]"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                    style={activeTab === "policy" && sec.policy_tab_active_bg ? { color: sec.policy_tab_active_bg } : undefined}
                  >
                    {(sec.policy_tab_icon_url || sec.policy_tab_icon_image) && (
                      <img src={sec.policy_tab_icon_url || sec.policy_tab_icon_image} alt="" className="h-3.5 w-3.5 object-contain sm:h-4 sm:w-4" />
                    )}
                    Хүний нөөцийн бодлого
                  </button>
                )}
                {policyCategories.map((category) => {
                  const tabKey = `category:${category.id}`;
                  const policyCount = policyKeys.filter((key) => policies[key].categoryId === category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => { setActiveTab(tabKey); setSelectedJob(null); setActivePolicy(null); }}
                      className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs transition-all duration-300 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm ${
                        activeTab === tabKey
                          ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-[#0048BA]"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      }`}
                      style={activeTab === tabKey && sec.policy_tab_active_bg ? { color: sec.policy_tab_active_bg } : undefined}
                    >
                      {category.name}
                      <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] sm:ml-1 sm:px-2 ${activeTab === tabKey ? 'bg-blue-100 text-[#0048BA]' : 'bg-slate-200 text-slate-500'}`}>
                        {policyCount}
                      </span>
                    </button>
                  );
                })}
                {hasJobs && (
                  <button
                    onClick={() => { setActiveTab("jobs"); setActivePolicy(null); }}
                    className={`flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs transition-all duration-300 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm ${
                      activeTab === "jobs"
                        ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-[#0048BA]"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                    style={activeTab === "jobs" && sec.jobs_tab_active_bg ? { color: sec.jobs_tab_active_bg } : undefined}
                  >
                    {(sec.jobs_tab_icon_url || sec.jobs_tab_icon_image) && (
                      <img src={sec.jobs_tab_icon_url || sec.jobs_tab_icon_image} alt="" className="h-3.5 w-3.5 object-contain sm:h-4 sm:w-4" />
                    )}
                    Нээлттэй ажлын байр
                    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] sm:ml-1 sm:px-2 ${activeTab === 'jobs' ? 'bg-blue-100 text-[#0048BA]' : 'bg-slate-200 text-slate-500'}`}>
                      {jobs.length}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ═══════ CONTENT ═══════ */}
          <div ref={contentRef} className="min-h-[400px]">

            {/* ─── POLICIES TAB (MODERN GRID) ─── */}
            {(activeTab === "policy" || activeCategoryId) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visiblePolicyKeys.map((key) => {
                  const p = policies[key];
                  if (!p) return null;
                  const isActive = activePolicy === key;

                  return (
                    <div key={key} className={`col-span-1 transition-all duration-500`}>
                      <div
                        className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                          isActive ? 'border-blue-200 shadow-xl shadow-blue-900/5 ring-1 ring-blue-100' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100'
                        }`}
                        onClick={() => setActivePolicy(isActive ? null : key)}
                      >
                        {/* Header Area */}
                        <div className={`p-6 sm:p-8 flex items-center gap-5 ${isActive ? 'bg-slate-50/50' : ''}`}>
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                            style={{ background: p.iconBg }}
                          >
                            {p.iconSrc ? (
                              <img src={p.iconSrc} alt="" className="w-7 h-7 object-contain" />
                            ) : (
                              <DefaultPolicyIcon />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate" style={{
                              ...getFontStyle(sec.policy_title_fontfamily || p.fontfamily),
                              ...(sec.policy_title_color ? { color: sec.policy_title_color } : {}),
                            }}>
                              {p.title}
                            </h3>
                            {!isActive && (
                              <p className="text-sm text-slate-500 mt-1 truncate">
                                {p.content.slice(0, 80)}...
                              </p>
                            )}
                          </div>

                          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 shrink-0 transition-transform duration-300 ${isActive ? 'rotate-180 bg-blue-50 text-[#0048BA]' : 'text-slate-400'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded Content Area */}
                        <div className={`grid transition-all duration-500 ease-in-out ${isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden">
                            <div className="p-6 sm:p-8 pt-0 text-slate-600 leading-relaxed text-base whitespace-pre-line border-t border-slate-100 mt-2 text-justify">
                              {p.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {visiblePolicyKeys.length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                    <p className="text-slate-400">Бодлого бүртгэгдээгүй байна.</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── JOBS TAB (CLEAN LIST) ─── */}
            {activeTab === "jobs" && (
              <div className="space-y-6">
                {jobs.map((job) => {
                  const isExpanded = selectedJob?.id === job.id;
                  return (
                    <div
                      key={job.id}
                      className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                        isExpanded ? 'border-blue-200 shadow-xl shadow-blue-900/5 ring-1 ring-blue-100' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100'
                      }`}
                    >
                      {/* Job Header (Clickable) */}
                      <div className="p-6 sm:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6" onClick={() => setSelectedJob(isExpanded ? null : job)}>

                        <div className="flex items-start gap-5">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/50">
                            {job.icon_url || job.icon_image ? (
                              <img src={job.icon_url || job.icon_image} alt="" className="w-7 h-7 object-contain" />
                            ) : (
                              <svg className="w-6 h-6 text-[#0048BA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                                {job.department}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                                {job.type}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                                {job.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 md:flex-col md:items-end justify-between md:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                          <div className="text-sm font-medium text-slate-500">
                            Анкет хүлээж авах: <span className="text-slate-800">{formatDate(job.deadline)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#0048BA]">
                            {isExpanded ? 'Хураах' : 'Дэлгэрэнгүй'}
                            <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <div className="p-6 sm:p-8 pt-0 border-t border-slate-100 bg-slate-50/50 mt-4">
                            <div className="grid md:grid-cols-2 gap-8 mb-8 mt-6">
                              <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Ажлын тайлбар</h4>
                                <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line text-justify">{job.description}</p>
                              </div>
                              {job.requirements && (
                                <div>
                                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Тавигдах шаардлага</h4>
                                  <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line text-justify">{job.requirements}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setForm({ ...form, position: job.title }); setShowForm(true); }}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                                style={{ backgroundColor: sec.btn_bg || '#0048BA' }}
                              >
                                {(sec.btn_icon_url || sec.btn_icon_image) && (
                                  <span className="-ml-2 inline-flex h-5 w-5 items-center justify-center overflow-visible">
                                    <img src={sec.btn_icon_url || sec.btn_icon_image} alt="" className="h-7 w-7 max-w-none object-contain" />
                                  </span>
                                )}
                                Анкет илгээх
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {jobs.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                    <p className="text-slate-400">Одоогоор нээлттэй ажлын байр байхгүй байна.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* ═══════ APPLICATION MODAL (MODERNIZED) ═══════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowForm(false)} />

          <div className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">

            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-start bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Анкет илгээх</h3>
                {(selectedJob?.title || form.position) && (
                  <p className="text-sm font-medium text-[#0048BA] mt-1">{selectedJob?.title || form.position}</p>
                )}
              </div>
              {/* Энд байсан X товчийг устгасан */}
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto flex-1">
              {sent ? (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-2">Амжилттай!</div>
                  <p className="text-slate-500">Таны анкет амжилттай илгээгдлээ. Бид удахгүй холбогдох болно.</p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Нэр *</label>
                      <input name="firstName" value={form.firstName} onChange={handleChange} required
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0048BA]/20 focus:border-[#0048BA] transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Овог *</label>
                      <input name="lastName" value={form.lastName} onChange={handleChange} required
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0048BA]/20 focus:border-[#0048BA] transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Имэйл *</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} required
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0048BA]/20 focus:border-[#0048BA] transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Утасны дугаар *</label>
                      <input name="phone" value={form.phone} onChange={handleChange} required
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0048BA]/20 focus:border-[#0048BA] transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Ажлын туршлага *</label>
                    <select name="experience" value={form.experience} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0048BA]/20 focus:border-[#0048BA] transition-all cursor-pointer">
                      <option value="">Сонгох...</option>
                      <option value="0-1">0-1 жил (Шинэ төгсөгч)</option>
                      <option value="1-3">1-3 жил</option>
                      <option value="3-5">3-5 жил</option>
                      <option value="5+">5-аас дээш жил</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Товч танилцуулга</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0048BA]/20 focus:border-[#0048BA] transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">CV хавсаргах (PDF)</label>
                    <div className="relative">
                      <input type="file" accept=".pdf" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" id="cv-upload" />
                      <label htmlFor="cv-upload" className="flex items-center gap-3 w-full px-4 py-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-[#0048BA]/50 cursor-pointer transition-all">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-[#0048BA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          {cvFile ? (
                            <p className="text-sm font-bold text-slate-900 truncate">{cvFile.name}</p>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-slate-700">Файл сонгох</p>
                              <p className="text-xs text-slate-500 mt-0.5">Зөвхөн PDF форматтай байна</p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {submitError && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-lg">{submitError}</p>}

                  {/* Modal Footer actions */}
                  <div className="flex gap-3 pt-6 mt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-1/3">
                      Болих
                    </button>
                    <button type="submit" disabled={submitting} className="px-6 py-3.5 rounded-xl font-bold text-white transition-all hover:shadow-lg active:scale-[0.98] w-2/3 flex items-center justify-center disabled:opacity-70" style={{ backgroundColor: sec.btn_bg || '#0048BA' }}>
                      {submitting ? (
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : "Анкет илгээх"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </main>
  );
}
