'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Modal from '@/components/Modal';
import { Input, Textarea, Button, PageHeader } from '@/components/FormElements';
import { PlusIcon, TrashIcon, PencilIcon, BriefcaseIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { axiosInstance } from '@/lib/axios';
import { FontSelect } from '@/lib/fontOptions';
import ImageUpload from '@/components/ImageUpload';

interface Translation {
  id?: number;
  language: number;
  language_code?: string;
  language_name?: string;
  name: string;
  desc: string;
}

interface PolicyCategory {
  id?: number | string;
  key: string;
  sort_order: number;
  active: boolean;
  created_at?: string | null;
  translations: Translation[];
}

interface SectionTranslation {
  language?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  btn_text?: string;
}

interface JobTranslation {
  id?: number;
  language: number;
  language_code?: string;
  language_name?: string;
  title: string;
  department: string;
  desc: string;
  requirements: string;
}

interface JobAPI {
  id?: number;
  type: number;
  location: string;
  deadline: string;
  status: number;
  date?: string;
  icon_image?: string;
  icon_url?: string;
  translations: JobTranslation[];
}

interface Job {
  id: string;
  title: string;
  title_en?: string;
  department: string;
  department_en?: string;
  type: string;
  location: string;
  description: string;
  description_en?: string;
  requirements?: string;
  requirements_en?: string;
  deadline: string;
  status: string;
  icon_image?: string;
  icon_url?: string;
}

interface Policy {
  id?: number;
  category?: number | null;
  category_detail?: PolicyCategory | null;
  key: string;
  visual_type: string;
  visual_preset: string;
  font_color: string;
  bg_color: string;
  fontsize: string;
  fontfamily: string;
  active: boolean;
  created_at?: string | null;
  translations: Translation[];
  icon_image?: string;
  icon_url?: string;
  gradient?: string;
  glowColor?: string;
  iconBg?: string;
  icon?: string;
}

const UNCATEGORIZED_POLICY_CATEGORY_ID = 'uncategorized';

const POLICY_ICONS: Record<string, React.ReactNode> = {
  equal: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
  training: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>),
  benefits: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  health: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>),
  insurance: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>),
  retirement: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  vacation: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
  flexible: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  childcare: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  wellness: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m-9-1a9 9 0 0118 0 9 9 0 01-18 0z" /></svg>),
  transport: (<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>),
};

const transformAPIToJob = (apiJob: JobAPI): Job => {
  const enTranslation = apiJob.translations.find(t => t.language === 1);
  const mnTranslation = apiJob.translations.find(t => t.language === 2);
  
  const typeMap: Record<number, string> = { 1: 'Бүтэн цагийн', 2: 'Хагас цагийн', 3: 'Гэрээт' };
  const statusMap: Record<number, string> = { 1: 'active', 2: 'closed' };
  
  return {
    id: String(apiJob.id || ''),
    type: typeMap[apiJob.type] || 'Бүтэн цагийн',
    location: apiJob.location,
    deadline: apiJob.deadline,
    status: statusMap[apiJob.status] || 'active',
    title: mnTranslation?.title || '',
    title_en: enTranslation?.title || '',
    department: mnTranslation?.department || '',
    department_en: enTranslation?.department || '',
    description: mnTranslation?.desc || '',
    description_en: enTranslation?.desc || '',
    requirements: mnTranslation?.requirements || '',
    requirements_en: enTranslation?.requirements || '',
    icon_image: apiJob.icon_image || '',
    icon_url: apiJob.icon_url || '',
  };
};

const transformJobToAPI = (job: Job): Omit<JobAPI, 'id' | 'date'> => {
  const typeMap: Record<string, number> = { 'Бүтэн цагийн': 1, 'Хагас цагийн': 2, 'Гэрээт': 3 };
  const statusMap: Record<string, number> = { 'active': 1, 'closed': 2 };
  
  return {
    type: typeMap[job.type] || 1,
    location: job.location,
    deadline: job.deadline,
    status: statusMap[job.status] || 1,
    icon_image: job.icon_image || '',
    icon_url: job.icon_url || '',
    translations: [
      { language: 1, title: job.title_en || job.title, department: job.department_en || job.department, desc: job.description_en || job.description, requirements: job.requirements_en || job.requirements || '' },
      { language: 2, title: job.title, department: job.department, desc: job.description, requirements: job.requirements || '' },
    ],
  };
};

export default function HRPage() {
  const { language, setLanguage, t } = useLanguage();
  const [policies, setPolicies] = useState<Record<string, Policy>>({});
  const [policyCategories, setPolicyCategories] = useState<PolicyCategory[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [policySettingsOpen, setPolicySettingsOpen] = useState(false);
  const [jobsSettingsOpen, setJobsSettingsOpen] = useState(false);
  const [sectionSaving, setSectionSaving] = useState(false);

  interface SectionSettings {
    id?: number;
    title_fontfamily: string; title_fontsize: string; title_color: string; title_weight: string;
    subtitle_fontfamily: string; subtitle_fontsize: string; subtitle_color: string; subtitle_weight: string;
    desc_fontfamily: string; desc_fontsize: string; desc_color: string;
    btn_bg: string; btn_color: string; btn_radius: string; btn_fontfamily: string; btn_fontsize: string; btn_fontweight: string;
    section_bg: string; section_border_radius: string; section_border_color: string; section_border_width: string;
    accent_gradient: string;
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
    title_mn: string; title_en: string;
    subtitle_mn: string; subtitle_en: string;
    desc_mn: string; desc_en: string;
    btn_mn: string; btn_en: string;
  }
  type SectionStringKey = Exclude<keyof SectionSettings, 'id'>;

  const [section, setSection] = useState<SectionSettings>({
    title_fontfamily: '', title_fontsize: '32', title_color: '#0f172a', title_weight: '700',
    subtitle_fontfamily: '', subtitle_fontsize: '14', subtitle_color: '#64748b', subtitle_weight: '500',
    desc_fontfamily: '', desc_fontsize: '15', desc_color: '#475569',
    btn_bg: '#1e293b', btn_color: '#ffffff', btn_radius: '12', btn_fontfamily: '', btn_fontsize: '14', btn_fontweight: '600',
    section_bg: 'rgba(255,255,255,0.7)', section_border_radius: '16', section_border_color: 'transparent', section_border_width: '0',
    accent_gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    banner_image: '', banner_url: '',
    banner_desktop_image: '', banner_desktop_url: '',
    banner_tablet_image: '', banner_tablet_url: '',
    banner_mobile_image: '', banner_mobile_url: '',
    icon_image: '', icon_url: '',
    policy_title_fontfamily: '', policy_title_fontsize: '18', policy_title_color: '#334155', policy_title_weight: '600',
    policy_desc_fontsize: '14', policy_desc_color: '#64748b',
    policy_card_bg: '#ffffff', policy_card_border_color: '#e2e8f0', policy_card_border_radius: '12',
    jobs_title_fontfamily: '', jobs_title_fontsize: '18', jobs_title_color: '#0f172a', jobs_title_weight: '600',
    jobs_desc_fontsize: '14', jobs_desc_color: '#475569',
    jobs_card_bg: '#ffffff', jobs_card_border_color: '#e2e8f0', jobs_card_border_radius: '12',
    jobs_badge_bg: '#f0fdf4', jobs_badge_color: '#15803d',
    btn_icon_image: '', btn_icon_url: '',
    policy_tab_icon_image: '', policy_tab_icon_url: '',
    jobs_tab_icon_image: '', jobs_tab_icon_url: '',
    policy_tab_active_bg: '#1e293b', policy_tab_active_color: '#ffffff',
    jobs_tab_active_bg: '#1e293b', jobs_tab_active_color: '#ffffff',
    title_mn: 'Хүний нөөц', title_en: 'Human Resources',
    subtitle_mn: 'Human Resources', subtitle_en: 'Human Resources',
    desc_mn: 'Ажилтнаа дэмжсэн бодлого, сургалт болон урамшуулалтай. Хамтран ажиллах чадвартай шинэ хүнийг урьж байна.',
    desc_en: 'Employee support policies, training, and incentives. We invite capable new people to work together.',
    btn_mn: 'Анкет бөглөх', btn_en: 'Apply Now',
  });

  const fetchSection = async () => {
    try {
      const res = await axiosInstance.get('/hr-section/');
      if (res.data && res.data.id) {
        const d = res.data;
        const trEn = (d.translations as SectionTranslation[] | undefined)?.find((item) => item.language === 1) || {};
        const trMn = (d.translations as SectionTranslation[] | undefined)?.find((item) => item.language === 2) || {};
        setSection({
          id: d.id,
          title_fontfamily: d.title_fontfamily || '', title_fontsize: d.title_fontsize || '32', title_color: d.title_color || '#0f172a', title_weight: d.title_weight || '700',
          subtitle_fontfamily: d.subtitle_fontfamily || '', subtitle_fontsize: d.subtitle_fontsize || '14', subtitle_color: d.subtitle_color || '#64748b', subtitle_weight: d.subtitle_weight || '500',
          desc_fontfamily: d.desc_fontfamily || '', desc_fontsize: d.desc_fontsize || '15', desc_color: d.desc_color || '#475569',
          btn_bg: d.btn_bg || '#1e293b', btn_color: d.btn_color || '#ffffff', btn_radius: d.btn_radius || '12', btn_fontfamily: d.btn_fontfamily || '', btn_fontsize: d.btn_fontsize || '14', btn_fontweight: d.btn_fontweight || '600',
          section_bg: d.section_bg || 'rgba(255,255,255,0.7)', section_border_radius: d.section_border_radius || '16', section_border_color: d.section_border_color || 'transparent', section_border_width: d.section_border_width || '0',
          accent_gradient: d.accent_gradient || '',
          banner_image: d.banner_image || '', banner_url: d.banner_url || '',
          banner_desktop_image: d.banner_desktop_image || d.banner_image || '', banner_desktop_url: d.banner_desktop_url || d.banner_url || '',
          banner_tablet_image: d.banner_tablet_image || '', banner_tablet_url: d.banner_tablet_url || '',
          banner_mobile_image: d.banner_mobile_image || '', banner_mobile_url: d.banner_mobile_url || '',
          icon_image: d.icon_image || '', icon_url: d.icon_url || '',
          policy_title_fontfamily: d.policy_title_fontfamily || '', policy_title_fontsize: d.policy_title_fontsize || '18', policy_title_color: d.policy_title_color || '#334155', policy_title_weight: d.policy_title_weight || '600',
          policy_desc_fontsize: d.policy_desc_fontsize || '14', policy_desc_color: d.policy_desc_color || '#64748b',
          policy_card_bg: d.policy_card_bg || '#ffffff', policy_card_border_color: d.policy_card_border_color || '#e2e8f0', policy_card_border_radius: d.policy_card_border_radius || '12',
          jobs_title_fontfamily: d.jobs_title_fontfamily || '', jobs_title_fontsize: d.jobs_title_fontsize || '18', jobs_title_color: d.jobs_title_color || '#0f172a', jobs_title_weight: d.jobs_title_weight || '600',
          jobs_desc_fontsize: d.jobs_desc_fontsize || '14', jobs_desc_color: d.jobs_desc_color || '#475569',
          jobs_card_bg: d.jobs_card_bg || '#ffffff', jobs_card_border_color: d.jobs_card_border_color || '#e2e8f0', jobs_card_border_radius: d.jobs_card_border_radius || '12',
          jobs_badge_bg: d.jobs_badge_bg || '#f0fdf4', jobs_badge_color: d.jobs_badge_color || '#15803d',
          btn_icon_image: d.btn_icon_image || '', btn_icon_url: d.btn_icon_url || '',
          policy_tab_icon_image: d.policy_tab_icon_image || '', policy_tab_icon_url: d.policy_tab_icon_url || '',
          jobs_tab_icon_image: d.jobs_tab_icon_image || '', jobs_tab_icon_url: d.jobs_tab_icon_url || '',
          policy_tab_active_bg: d.policy_tab_active_bg || '#1e293b', policy_tab_active_color: d.policy_tab_active_color || '#ffffff',
          jobs_tab_active_bg: d.jobs_tab_active_bg || '#1e293b', jobs_tab_active_color: d.jobs_tab_active_color || '#ffffff',
          title_mn: trMn.title || 'Хүний нөөц', title_en: trEn.title || 'Human Resources',
          subtitle_mn: trMn.subtitle || 'Human Resources', subtitle_en: trEn.subtitle || 'Human Resources',
          desc_mn: trMn.description || '', desc_en: trEn.description || '',
          btn_mn: trMn.btn_text || 'Анкет бөглөх', btn_en: trEn.btn_text || 'Apply Now',
        });
      }
    } catch (e) { console.error('Error fetching hr section:', e); }
  };

  const saveSection = async () => {
    setSectionSaving(true);
    try {
      const payload = {
        title_fontfamily: section.title_fontfamily, title_fontsize: section.title_fontsize, title_color: section.title_color, title_weight: section.title_weight,
        subtitle_fontfamily: section.subtitle_fontfamily, subtitle_fontsize: section.subtitle_fontsize, subtitle_color: section.subtitle_color, subtitle_weight: section.subtitle_weight,
        desc_fontfamily: section.desc_fontfamily, desc_fontsize: section.desc_fontsize, desc_color: section.desc_color,
        btn_bg: section.btn_bg, btn_color: section.btn_color, btn_radius: section.btn_radius, btn_fontfamily: section.btn_fontfamily, btn_fontsize: section.btn_fontsize, btn_fontweight: section.btn_fontweight,
        section_bg: section.section_bg, section_border_radius: section.section_border_radius, section_border_color: section.section_border_color, section_border_width: section.section_border_width,
        accent_gradient: section.accent_gradient,
        banner_image: section.banner_desktop_image || section.banner_image, banner_url: section.banner_desktop_url || section.banner_url,
        banner_desktop_image: section.banner_desktop_image, banner_desktop_url: section.banner_desktop_url,
        banner_tablet_image: section.banner_tablet_image, banner_tablet_url: section.banner_tablet_url,
        banner_mobile_image: section.banner_mobile_image, banner_mobile_url: section.banner_mobile_url,
        icon_image: section.icon_image, icon_url: section.icon_url,
        policy_title_fontfamily: section.policy_title_fontfamily, policy_title_fontsize: section.policy_title_fontsize, policy_title_color: section.policy_title_color, policy_title_weight: section.policy_title_weight,
        policy_desc_fontsize: section.policy_desc_fontsize, policy_desc_color: section.policy_desc_color,
        policy_card_bg: section.policy_card_bg, policy_card_border_color: section.policy_card_border_color, policy_card_border_radius: section.policy_card_border_radius,
        jobs_title_fontfamily: section.jobs_title_fontfamily, jobs_title_fontsize: section.jobs_title_fontsize, jobs_title_color: section.jobs_title_color, jobs_title_weight: section.jobs_title_weight,
        jobs_desc_fontsize: section.jobs_desc_fontsize, jobs_desc_color: section.jobs_desc_color,
        jobs_card_bg: section.jobs_card_bg, jobs_card_border_color: section.jobs_card_border_color, jobs_card_border_radius: section.jobs_card_border_radius,
        jobs_badge_bg: section.jobs_badge_bg, jobs_badge_color: section.jobs_badge_color,
        btn_icon_image: section.btn_icon_image, btn_icon_url: section.btn_icon_url,
        policy_tab_icon_image: section.policy_tab_icon_image, policy_tab_icon_url: section.policy_tab_icon_url,
        jobs_tab_icon_image: section.jobs_tab_icon_image, jobs_tab_icon_url: section.jobs_tab_icon_url,
        policy_tab_active_bg: section.policy_tab_active_bg, policy_tab_active_color: section.policy_tab_active_color,
        jobs_tab_active_bg: section.jobs_tab_active_bg, jobs_tab_active_color: section.jobs_tab_active_color,
        translations: [
          { language: 1, title: section.title_en, subtitle: section.subtitle_en, description: section.desc_en, btn_text: section.btn_en },
          { language: 2, title: section.title_mn, subtitle: section.subtitle_mn, description: section.desc_mn, btn_text: section.btn_mn },
        ],
      };
      if (section.id) {
        await axiosInstance.put(`/hr-section/${section.id}/`, payload);
      } else {
        const res = await axiosInstance.post('/hr-section/', payload);
        setSection(prev => ({ ...prev, id: res.data.id }));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Error saving hr section:', e);
      alert(t('Хадгалахад алдаа гарлаа', 'Error saving section'));
    } finally {
      setSectionSaving(false);
    }
  };

  const updateSection = (key: keyof SectionSettings, val: string) => {
    setSection(prev => ({ ...prev, [key]: val }));
  };

  const bannerDeviceConfigs: Array<{
    id: 'desktop' | 'tablet' | 'mobile';
    label: string;
    size: string;
    note: string;
    aspectClass: string;
    imageKey: SectionStringKey;
    urlKey: SectionStringKey;
    safeZoneClass: string;
  }> = [
    {
      id: 'desktop',
      label: 'Desktop',
      size: '1920 x 620 px',
      note: t('Том дэлгэц / laptop дээр яг тохирно', 'Best for desktop and laptop'),
      aspectClass: 'aspect-[1920/620]',
      imageKey: 'banner_desktop_image',
      urlKey: 'banner_desktop_url',
      safeZoneClass: 'left-[30%] right-[30%] top-[28%] bottom-[34%]',
    },
    {
      id: 'tablet',
      label: 'Tablet',
      size: '1200 x 640 px',
      note: t('iPad/tablet хэмжээ дээр crop бага байна', 'Keeps tablet crop predictable'),
      aspectClass: 'aspect-[1200/640]',
      imageKey: 'banner_tablet_image',
      urlKey: 'banner_tablet_url',
      safeZoneClass: 'left-[22%] right-[22%] top-[28%] bottom-[34%]',
    },
    {
      id: 'mobile',
      label: 'Phone',
      size: '750 x 900 px',
      note: t('Гар утас дээр босоо зураг хамгийн цэвэр харагдана', 'Portrait image works best on phones'),
      aspectClass: 'aspect-[750/900]',
      imageKey: 'banner_mobile_image',
      urlKey: 'banner_mobile_url',
      safeZoneClass: 'left-[10%] right-[10%] top-[24%] bottom-[46%]',
    },
  ];

  const getBannerSource = (device?: (typeof bannerDeviceConfigs)[number]) => {
    if (!device) {
      return section.banner_desktop_url || section.banner_desktop_image || section.banner_url || section.banner_image;
    }
    return String(section[device.urlKey] || section[device.imageKey] || section.banner_desktop_url || section.banner_desktop_image || section.banner_url || section.banner_image || '');
  };

  const renderBannerSafePreview = (device: (typeof bannerDeviceConfigs)[number]) => {
    const src = getBannerSource(device);

    return (
      <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${device.aspectClass}`}>
        {src ? (
          <img
            src={src}
            alt={`${device.label} banner preview`}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400">
            {t('Зураг оруулаагүй', 'No image selected')}
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:12.5%_25%]" />
        <div className={`absolute ${device.safeZoneClass} rounded-2xl border-2 border-blue-500 bg-blue-500/15 shadow-[0_0_0_999px_rgba(15,23,42,0.2)] backdrop-blur-[1px]`}>
          <div className="absolute left-1/2 top-1/2 w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/70 px-3 py-2 text-center text-[11px] font-bold text-blue-700 shadow-sm">
            {t('TEXT SAFE ZONE', 'TEXT SAFE ZONE')}
          </div>
        </div>
        <div className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white">
          {t('Энд гол зураг / хоосон хэсэг', 'Artwork / empty zone')}
        </div>
      </div>
    );
  };

  const trans = {
    title: t('Хүний нөөц удирдлага', 'HR Management'),
    addPolicy: t('Шинэ бодлого нэмэх', 'Add New Policy'),
    addJob: t('Шинэ зар нэмэх', 'Add New Job'),
    jobListings: t('Ажлын байрны зар', 'Job Listings'),
    policyListings: t('HR Бодлого', 'HR Policies'),
    save: t('Хадгалах', 'Save'),
    cancel: t('Цуцлах', 'Cancel'),
    edit: t('Засах', 'Edit'),
    delete: t('Устгах', 'Delete'),
    deadline: t('Хүлээн авах хугацаа', 'Deadline'),
    status: t('Статус', 'Status'),
    active: t('Идэвхтэй', 'Active'),
    closed: t('Хаагдсан', 'Closed'),
    type: t('Төрөл', 'Type'),
    location: t('Байршил', 'Location'),
  };

  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [editingCategory, setEditingCategory] = useState<PolicyCategory | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [modalMode, setModalMode] = useState<'job' | 'policy'>('job');
  const [activePolicyCategory, setActivePolicyCategory] = useState<string | null>(null);

  const [jobFormData, setJobFormData] = useState<Job>({
    id: '', title: '', title_en: '', department: '', department_en: '', type: 'Бүтэн цагийн',
    location: '', description: '', description_en: '', requirements: '', requirements_en: '', deadline: '', status: 'active',
  });

  const [policyFormData, setPolicyFormData] = useState<Policy>({
    key: '', visual_type: 'card', visual_preset: 'modern', font_color: '#334155', bg_color: '#FFFFFF', fontsize: '16', fontfamily: '', active: true,
    translations: [{ language: 1, name: '', desc: '' }, { language: 2, name: '', desc: '' }],
    gradient: 'from-blue-500 via-indigo-500 to-purple-500', glowColor: 'rgba(99, 102, 241, 0.4)', iconBg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', icon: 'equal',
  });
  const [categoryFormData, setCategoryFormData] = useState<PolicyCategory>({
    key: '',
    sort_order: 0,
    active: true,
    translations: [{ language: 1, name: '', desc: '' }, { language: 2, name: '', desc: '' }],
  });

  const fetchPolicyCategories = async () => {
    try {
      const response = await axiosInstance.get('/hrpolicy-category/');
      const raw = response.data;
      const categories: PolicyCategory[] = Array.isArray(raw) ? raw : (raw?.results ?? []);
      setPolicyCategories(categories);
    } catch (error) {
      console.error('Error fetching policy categories:', error);
      setPolicyCategories([]);
    }
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/hrpolicy/');
      const raw = response.data;
      const arr: Policy[] = Array.isArray(raw) ? raw : (raw?.results ?? []);
      const policiesData: Record<string, Policy> = {};
      arr.forEach((policy: Policy) => {
        const iconMapping: Record<string, string> = { 'm': 'equal', 'modern': 'equal', 'training': 'training', 't': 'training', 'benefits': 'benefits', 'b': 'benefits', 'health': 'health', 'h': 'health', 'insurance': 'insurance', 'i': 'insurance', 'retirement': 'retirement', 'r': 'retirement', 'vacation': 'vacation', 'v': 'vacation', 'flexible': 'flexible', 'f': 'flexible', 'childcare': 'childcare', 'c': 'childcare', 'wellness': 'wellness', 'w': 'wellness', 'transport': 'transport' };
        const icon = iconMapping[policy.visual_preset?.toLowerCase()] || policy.key;
        const gradientMapping: Record<string, string> = { 'equal': 'from-blue-500 via-indigo-500 to-purple-500', 'training': 'from-emerald-500 via-teal-500 to-cyan-500', 'benefits': 'from-amber-500 via-orange-500 to-rose-500', 'health': 'from-rose-500 via-pink-500 to-fuchsia-500', 'insurance': 'from-violet-500 via-purple-500 to-indigo-500', 'retirement': 'from-cyan-500 via-blue-500 to-indigo-500', 'vacation': 'from-lime-500 via-green-500 to-emerald-500', 'flexible': 'from-yellow-500 via-orange-500 to-red-500', 'childcare': 'from-pink-500 via-rose-500 to-red-500', 'wellness': 'from-teal-500 via-cyan-500 to-blue-500', 'transport': 'from-orange-500 via-amber-500 to-yellow-500' };
        const glowMapping: Record<string, string> = { 'equal': 'rgba(99, 102, 241, 0.4)', 'training': 'rgba(0, 178, 231, 0.4)', 'benefits': 'rgba(249, 115, 22, 0.4)', 'health': 'rgba(236, 72, 153, 0.4)', 'insurance': 'rgba(139, 92, 246, 0.4)', 'retirement': 'rgba(34, 211, 238, 0.4)', 'vacation': 'rgba(0, 178, 231, 0.4)', 'flexible': 'rgba(234, 179, 8, 0.4)', 'childcare': 'rgba(244, 63, 94, 0.4)', 'wellness': 'rgba(0, 178, 231, 0.4)', 'transport': 'rgba(251, 146, 60, 0.4)' };
        const iconBgMapping: Record<string, string> = { 'equal': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 'training': 'linear-gradient(135deg, #00B2E7 0%, #00B2E7 100%)', 'benefits': 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', 'health': 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)', 'insurance': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', 'retirement': 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)', 'vacation': 'linear-gradient(135deg, #84cc16 0%, #00B2E7 100%)', 'flexible': 'linear-gradient(135deg, #eab308 0%, #f97316 100%)', 'childcare': 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', 'wellness': 'linear-gradient(135deg, #00B2E7 0%, #06b6d4 100%)', 'transport': 'linear-gradient(135deg, #fb923c 0%, #f59e0b 100%)' };
        policiesData[policy.key] = { ...policy, gradient: gradientMapping[icon] || 'from-blue-500 via-indigo-500 to-purple-500', glowColor: glowMapping[icon] || 'rgba(99, 102, 241, 0.4)', iconBg: iconBgMapping[icon] || 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', icon: icon };
      });
      setPolicies(policiesData);
      setActivePolicyCategory((current) => {
        if (current) return current;
        const hasUncategorized = arr.some((policy: Policy) => !policy.category);
        return hasUncategorized ? UNCATEGORIZED_POLICY_CATEGORY_ID : null;
      });
    } catch (error) {
      console.error('Error fetching policies:', error);
      setPolicies({});
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/jobs/');
      const raw = response.data;
      const transformedJobs = (Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []).map(transformAPIToJob);
      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert(t('Ажлын байр ачаалахад алдаа гарлаа', 'Error loading jobs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs()
    fetchPolicyCategories();
    fetchPolicies();
    fetchSection();
  }, []);

  const getPolicyName = (policy: Policy): string => {
    const translation = policy.translations.find((t) => t.language === (language === 'en' ? 1 : 2));
    return translation?.name || '';
  };

  const getPolicyDesc = (policy: Policy): string => {
    const translation = policy.translations.find((t) => t.language === (language === 'en' ? 1 : 2));
    return translation?.desc || '';
  };

  const getCategoryName = (category: PolicyCategory): string => {
    const translation = category.translations.find((tr) => tr.language === (language === 'en' ? 1 : 2));
    return translation?.name || category.key;
  };

  const getPolicyCategoryId = (policy: Policy): string => {
    return policy.category ? String(policy.category) : UNCATEGORIZED_POLICY_CATEGORY_ID;
  };

  const policyCategoryTabs = [
    ...(Object.values(policies).some((policy) => !policy.category)
      ? [{
          id: UNCATEGORIZED_POLICY_CATEGORY_ID,
          key: UNCATEGORIZED_POLICY_CATEGORY_ID,
          sort_order: -1,
          active: true,
          translations: [
            { language: 1, name: 'HR Policies', desc: '' },
            { language: 2, name: 'Хүний нөөцийн бодлого', desc: '' },
          ],
        } as PolicyCategory]
      : []),
    ...policyCategories.filter((category) => category.active),
  ];

  const selectedPolicyCategoryId =
    activePolicyCategory && policyCategoryTabs.some((category) => String(category.id) === activePolicyCategory)
      ? activePolicyCategory
      : (policyCategoryTabs[0]?.id ? String(policyCategoryTabs[0].id) : null);

  const selectedPolicyKeys = Object.keys(policies).filter((key) => {
    if (!selectedPolicyCategoryId) return true;
    return getPolicyCategoryId(policies[key]) === selectedPolicyCategoryId;
  });

  const selectedPolicyCategory =
    selectedPolicyCategoryId
      ? policyCategoryTabs.find((category) => String(category.id) === selectedPolicyCategoryId)
      : null;

  const createPolicyCategory = async (categoryData: PolicyCategory) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/hrpolicy-category/', categoryData);
      const newCategory = response.data as PolicyCategory;
      setPolicyCategories((prev) => [...prev, newCategory]);
      setActivePolicyCategory(newCategory.id ? String(newCategory.id) : null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return newCategory;
    } catch (error) {
      console.error('Error creating policy category:', error);
      alert(t('Ангилал хадгалахад алдаа гарлаа!', 'Error saving category!'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePolicyCategory = async (categoryData: PolicyCategory) => {
    if (!categoryData.id || categoryData.id === UNCATEGORIZED_POLICY_CATEGORY_ID) return;

    try {
      setLoading(true);
      const response = await axiosInstance.put(`/hrpolicy-category/${categoryData.id}/`, categoryData);
      const updatedCategory = response.data as PolicyCategory;
      setPolicyCategories((prev) => prev.map((category) => category.id === updatedCategory.id ? updatedCategory : category));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return updatedCategory;
    } catch (error) {
      console.error('Error updating policy category:', error);
      alert(t('Ангилал хадгалахад алдаа гарлаа!', 'Error saving category!'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deletePolicyCategory = async (category: PolicyCategory) => {
    if (!category.id || category.id === UNCATEGORIZED_POLICY_CATEGORY_ID) return;
    if (!confirm(t('Энэ ангиллыг устгах уу? Доторх бодлогууд Ерөнхий ангилал руу шилжинэ.', 'Delete this category? Policies inside it will move to General.'))) return;

    try {
      setLoading(true);
      await axiosInstance.delete(`/hrpolicy-category/${category.id}/`);
      setPolicyCategories((prev) => prev.filter((item) => item.id !== category.id));
      setActivePolicyCategory(null);
      await fetchPolicies();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error deleting policy category:', error);
      alert(t('Ангилал устгахад алдаа гарлаа!', 'Error deleting category!'));
    } finally {
      setLoading(false);
    }
  };

  const toPolicyPayload = (policyData: Policy) => ({
    category: policyData.category ?? null,
    key: policyData.key,
    visual_type: policyData.visual_type,
    visual_preset: policyData.visual_preset,
    font_color: policyData.font_color,
    bg_color: policyData.bg_color,
    fontsize: policyData.fontsize,
    fontfamily: policyData.fontfamily,
    active: policyData.active,
    icon_image: policyData.icon_image || '',
    icon_url: policyData.icon_url || '',
    translations: policyData.translations,
  });

  const createPolicy = async (policyData: Policy) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/hrpolicy/', toPolicyPayload(policyData));
      const newPolicy = { ...response.data };
      setPolicies((prev) => ({ ...prev, [newPolicy.key]: newPolicy }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return response.data;
    } catch (error) {
      console.error('Error creating policy:', error);
      alert(t('Алдаа гарлаа!', 'Error occurred!'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePolicy = async (policyData: Policy) => {
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/hrpolicy/${policyData.id}/`, toPolicyPayload(policyData));
      const updatedPolicy = { ...response.data };
      setPolicies((prev) => ({ ...prev, [updatedPolicy.key]: updatedPolicy }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return response.data;
    } catch (error) {
      console.error('Error updating policy:', error);
      alert(t('Алдаа гарлаа!', 'Error occurred!'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deletePolicy = async (policyId: number, policyKey: string) => {
    if (!confirm(t('Устгах уу?', 'Delete this policy?'))) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/hrpolicy/${policyId}/`);
      setPolicies((prev) => {
        const newPolicies = { ...prev };
        delete newPolicies[policyKey];
        return newPolicies;
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error deleting policy:', error);
      alert(t('Алдаа гарлаа!', 'Error occurred!'));
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData: Job) => {
    try {
      setLoading(true);
      const apiData = transformJobToAPI(jobData);
      const response = await axiosInstance.post('/jobs/', apiData);
      const newJob = transformAPIToJob(response.data);
      setJobs((prev) => [...prev, newJob]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchJobs();

      return response.data;

    } catch (error) {
      console.error('Error creating job:', error);
      alert(t('Алдаа гарлаа!', 'Error occurred!'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (jobData: Job) => {
    try {
      setLoading(true);
      const apiData = transformJobToAPI(jobData);
      const response = await axiosInstance.put(`/jobs/${jobData.id}/`, apiData);
      const updatedJob = transformAPIToJob(response.data);
      setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return response.data;
    } catch (error) {
      console.error('Error updating job:', error);
      alert(t('Алдаа гарлаа!', 'Error occurred!'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm(t('Устгах уу?', 'Delete this job?'))) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/jobs/${jobId}/`);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(t('Алдаа гарлаа!', 'Error occurred!'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPolicyModal = (policy?: Policy, categoryId: string | null = selectedPolicyCategoryId) => {
    setModalMode('policy');
    if (policy) {
      setEditingPolicy(policy);
      setPolicyFormData(policy);
    } else {
      setEditingPolicy(null);
      const category = categoryId && categoryId !== UNCATEGORIZED_POLICY_CATEGORY_ID ? Number(categoryId) : null;
      setPolicyFormData({ category, key: '', visual_type: 'card', visual_preset: 'modern', font_color: '#334155', bg_color: '#FFFFFF', fontsize: '16', fontfamily: '', active: true, translations: [{ language: 1, name: '', desc: '' }, { language: 2, name: '', desc: '' }], icon_image: '', icon_url: '' });
    }
    setModalOpen(true);
  };

  const handleOpenCategoryModal = (category?: PolicyCategory) => {
    if (category && category.id !== UNCATEGORIZED_POLICY_CATEGORY_ID) {
      setEditingCategory(category);
      setCategoryFormData(category);
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        key: '',
        sort_order: policyCategories.length + 1,
        active: true,
        translations: [{ language: 1, name: '', desc: '' }, { language: 2, name: '', desc: '' }],
      });
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory && editingCategory.id) {
        await updatePolicyCategory({ ...categoryFormData, id: editingCategory.id });
      } else {
        await createPolicyCategory(categoryFormData);
      }
      setCategoryModalOpen(false);
    } catch (error) {}
  };

  const handleSavePolicy = async () => {
    try {
      if (editingPolicy && editingPolicy.id) {
        await updatePolicy({ ...policyFormData, id: editingPolicy.id });
      } else {
        await createPolicy(policyFormData);
      }
      setModalOpen(false);
    } catch (error) {}
  };

  const handleDeletePolicy = async (key: string) => {
    const policy = policies[key];
    if (policy && policy.id) {
      await deletePolicy(policy.id, key);
    }
  };

  const handleOpenJobModal = (job?: Job) => {
    setModalMode('job');
    if (job) {
      setEditingJob(job);
      setJobFormData(job);
    } else {
      setEditingJob(null);
      setJobFormData({ id: '', title: '', title_en: '', department: '', department_en: '', type: 'Бүтэн цагийн', location: '', description: '', description_en: '', requirements: '', requirements_en: '', deadline: '', status: 'active', icon_image: '', icon_url: '' });
    }
    setModalOpen(true);
  };

  const handleSaveJob = async () => {
    try {
      if (editingJob && editingJob.id) {
        await updateJob(jobFormData);
      } else {
        await createJob(jobFormData);
      }
      setModalOpen(false);
    } catch (error) {}
  };

  const handleDeleteJob = async (id: string) => {
    await deleteJob(id);
  };

  const renderPolicyButton = (key: string) => {
    const policy = policies[key];
    if (!policy || !policy.active) return null;
    const glowColor = policy.bg_color ? `${policy.bg_color}66` : 'rgba(99, 102, 241, 0.4)';
    const iconBg = policy.bg_color ? `linear-gradient(135deg, ${policy.bg_color}, ${policy.bg_color}dd)` : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
    const policyName = getPolicyName(policy);
    const iconSrc = policy.icon_url || policy.icon_image || '';
    return (
      <button key={key} type="button" onClick={() => handleOpenPolicyModal(policy)} className="group relative">
        <div className="absolute inset-0 rounded-2xl blur-xl opacity-0 transition-all duration-500 group-hover:opacity-40 group-hover:scale-105" style={{ background: glowColor }} />
        <div className="relative p-4 rounded-lg text-left transition-all duration-300 border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 relative z-10">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0`} style={{ background: iconBg }}>
                {iconSrc ? <img src={iconSrc} alt="" className="w-5 h-5 object-contain" /> : POLICY_ICONS[policy.icon || key] || POLICY_ICONS.equal}
              </div>
              <div className="font-medium text-slate-700 text-sm">{policyName}</div>
            </div>
          </div>
          <div className="absolute bottom-3 left-5 right-5 h-0.5 rounded-full opacity-0 scale-x-0 transition-all duration-500 group-hover:opacity-50 group-hover:scale-x-100" style={{ transformOrigin: 'left', background: policy.bg_color || '#6366f1' }} />
        </div>
      </button>
    );
  };

  return (
    <AdminLayout title={trans.title}>
      <div className="min-h-screen bg-slate-50 relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-slate-200/40 via-slate-200/20 to-slate-100/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/4 -left-40 w-[400px] h-[400px] bg-gradient-to-br from-slate-200/30 via-slate-200/15 to-slate-100/5 rounded-full blur-[80px]" />
        </div>
        <div className="relative px-3 sm:px-4 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <PageHeader
              title={trans.title}
              action={
                <div className="bg-slate-100 rounded-lg p-1.5 border border-slate-300 shadow-sm w-fit">
                  <div className="flex gap-1">
                    <button onClick={() => setLanguage('mn')} className={`px-4 py-2 rounded font-semibold text-sm transition-all ${language === 'mn' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white'}`}>🇲🇳</button>
                    <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded font-semibold text-sm transition-all ${language === 'en' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white'}`}>🇺🇸 EN</button>
                  </div>
                </div>
              }
            />
            {saveSuccess && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">{t('Амжилттай хадгалагдлаа!', 'Saved successfully!')}</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">{t('Өөрчлөлтүүд хадгалагдсан.', 'Changes saved.')}</p>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Хэсгийн тохиргоо (Section Settings) ═══ */}
          <div className="mb-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button onClick={() => setSectionOpen(!sectionOpen)} className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">{t('Хэсгийн тохиргоо', 'Section Settings')}</h2>
              <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform ${sectionOpen ? 'rotate-180' : ''}`} />
            </button>
            {sectionOpen && (
              <div className="p-4 sm:p-5 pt-0 space-y-6 border-t border-slate-200">

                {/* Текстүүд */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('📝 Текстүүд', '📝 Texts')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label={t('Гарчиг (МН)', 'Title (MN)')} value={section.title_mn} onChange={(e) => updateSection('title_mn', e.target.value)} />
                    <Input label={t('Гарчиг (EN)', 'Title (EN)')} value={section.title_en} onChange={(e) => updateSection('title_en', e.target.value)} />
                    <Input label={t('Дэд гарчиг (МН)', 'Subtitle (MN)')} value={section.subtitle_mn} onChange={(e) => updateSection('subtitle_mn', e.target.value)} />
                    <Input label={t('Дэд гарчиг (EN)', 'Subtitle (EN)')} value={section.subtitle_en} onChange={(e) => updateSection('subtitle_en', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <Textarea label={t('Тайлбар (МН)', 'Description (MN)')} value={section.desc_mn} onChange={(e) => updateSection('desc_mn', e.target.value)} rows={3} />
                    <Textarea label={t('Тайлбар (EN)', 'Description (EN)')} value={section.desc_en} onChange={(e) => updateSection('desc_en', e.target.value)} rows={3} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <Input label={t('Товчны текст (МН)', 'Button text (MN)')} value={section.btn_mn} onChange={(e) => updateSection('btn_mn', e.target.value)} />
                    <Input label={t('Товчны текст (EN)', 'Button text (EN)')} value={section.btn_en} onChange={(e) => updateSection('btn_en', e.target.value)} />
                  </div>
                </div>

                {/* Responsive Banner */}
                <div>
                  <div className="mb-3 flex flex-col gap-1">
                    <h3 className="text-sm font-semibold text-slate-700">{t('🖼️ Responsive Banner зураг', '🖼️ Responsive Banner Image')}</h3>
                    <p className="text-xs text-slate-500">
                      {t('Desktop, Tablet, Phone тус бүрт тохирсон зураг оруулна. Preview дээр цэнхэр хэсэг нь текстийн safe zone, үлдсэн хэсэг нь зураг/хоосон талбай.', 'Upload separate images for Desktop, Tablet, and Phone. In preview, the blue area is the text safe zone and the rest is artwork/empty space.')}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    {bannerDeviceConfigs.map((device) => (
                      <div key={device.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{device.label}</h4>
                            <p className="mt-1 text-xs text-slate-500">{device.note}</p>
                          </div>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{device.size}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('Зураг оруулах', 'Upload Image')}</label>
                            <ImageUpload value={String(section[device.imageKey] || '')} onChange={(url) => updateSection(device.imageKey, url)} label="" />
                          </div>
                          <Input
                            label={t('Эсвэл зургийн линк (URL)', 'Or image URL')}
                            value={String(section[device.urlKey] || '')}
                            onChange={(e) => updateSection(device.urlKey, e.target.value)}
                            placeholder="https://..."
                          />
                          {renderBannerSafePreview(device)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Товчны icon */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('📄 Анкет бөглөх товчны icon', '📄 Button Icon')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Зураг оруулах', 'Upload Image')}</label>
                      <ImageUpload value={section.btn_icon_image} onChange={(url) => updateSection('btn_icon_image', url)} label="" />
                    </div>
                    <div>
                      <Input label={t('Эсвэл зургийн линк (URL)', 'Or image URL')} value={section.btn_icon_url} onChange={(e) => updateSection('btn_icon_url', e.target.value)} placeholder="https://..." />
                      {(section.btn_icon_image || section.btn_icon_url) && (
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-slate-500">{t('Урьдчилан харах:', 'Preview:')}</span>
                          <img src={section.btn_icon_url || section.btn_icon_image} alt="btn icon" className="w-8 h-8 rounded object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Гарчиг фонт */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('🔤 Гарчигийн фонт', '🔤 Title Font')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <FontSelect label={t('Фонт', 'Font')} value={section.title_fontfamily} onChange={(v) => updateSection('title_fontfamily', v)} />
                    <Input label={t('Хэмжээ (px)', 'Size (px)')} type="number" value={section.title_fontsize} onChange={(e) => updateSection('title_fontsize', e.target.value)} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Өнгө', 'Color')}</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={section.title_color} onChange={(e) => updateSection('title_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                        <input type="text" value={section.title_color} onChange={(e) => updateSection('title_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Жин', 'Weight')}</label>
                      <select value={section.title_weight} onChange={(e) => updateSection('title_weight', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="400">400 - Normal</option>
                        <option value="500">500 - Medium</option>
                        <option value="600">600 - Semibold</option>
                        <option value="700">700 - Bold</option>
                        <option value="800">800 - Extrabold</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Дэд гарчиг фонт */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('🔤 Дэд гарчигийн фонт', '🔤 Subtitle Font')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <FontSelect label={t('Фонт', 'Font')} value={section.subtitle_fontfamily} onChange={(v) => updateSection('subtitle_fontfamily', v)} />
                    <Input label={t('Хэмжээ (px)', 'Size (px)')} type="number" value={section.subtitle_fontsize} onChange={(e) => updateSection('subtitle_fontsize', e.target.value)} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Өнгө', 'Color')}</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={section.subtitle_color} onChange={(e) => updateSection('subtitle_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                        <input type="text" value={section.subtitle_color} onChange={(e) => updateSection('subtitle_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Жин', 'Weight')}</label>
                      <select value={section.subtitle_weight} onChange={(e) => updateSection('subtitle_weight', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="400">400 - Normal</option>
                        <option value="500">500 - Medium</option>
                        <option value="600">600 - Semibold</option>
                        <option value="700">700 - Bold</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Тайлбар фонт */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('🔤 Тайлбарын фонт', '🔤 Description Font')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FontSelect label={t('Фонт', 'Font')} value={section.desc_fontfamily} onChange={(v) => updateSection('desc_fontfamily', v)} />
                    <Input label={t('Хэмжээ (px)', 'Size (px)')} type="number" value={section.desc_fontsize} onChange={(e) => updateSection('desc_fontsize', e.target.value)} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Өнгө', 'Color')}</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={section.desc_color} onChange={(e) => updateSection('desc_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                        <input type="text" value={section.desc_color} onChange={(e) => updateSection('desc_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Товчны загвар */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('🔘 Товчны загвар', '🔘 Button Style')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Арын өнгө', 'Background')}</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={section.btn_bg} onChange={(e) => updateSection('btn_bg', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                        <input type="text" value={section.btn_bg} onChange={(e) => updateSection('btn_bg', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Текст өнгө', 'Text Color')}</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={section.btn_color} onChange={(e) => updateSection('btn_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                        <input type="text" value={section.btn_color} onChange={(e) => updateSection('btn_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                    <Input label={t('Булангийн радиус', 'Border Radius')} type="number" value={section.btn_radius} onChange={(e) => updateSection('btn_radius', e.target.value)} />
                    <Input label={t('Фонт хэмжээ', 'Font Size')} type="number" value={section.btn_fontsize} onChange={(e) => updateSection('btn_fontsize', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    <FontSelect label={t('Фонт', 'Font')} value={section.btn_fontfamily} onChange={(v) => updateSection('btn_fontfamily', v)} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Жин', 'Weight')}</label>
                      <select value={section.btn_fontweight} onChange={(e) => updateSection('btn_fontweight', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="400">400 - Normal</option>
                        <option value="500">500 - Medium</option>
                        <option value="600">600 - Semibold</option>
                        <option value="700">700 - Bold</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Хэсгийн хүрээ */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('🖼️ Хэсгийн хүрээ', '🖼️ Section Border')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Input label={t('Булангийн радиус', 'Border Radius')} type="number" value={section.section_border_radius} onChange={(e) => updateSection('section_border_radius', e.target.value)} />
                    <Input label={t('Хүрээний зузаан', 'Border Width')} type="number" value={section.section_border_width} onChange={(e) => updateSection('section_border_width', e.target.value)} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Хүрээний өнгө', 'Border Color')}</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={section.section_border_color === 'transparent' ? '#ffffff' : section.section_border_color} onChange={(e) => updateSection('section_border_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                        <input type="text" value={section.section_border_color} onChange={(e) => updateSection('section_border_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('Арын өнгө', 'Background')}</label>
                      <input type="text" value={section.section_bg} onChange={(e) => updateSection('section_bg', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>

                {/* Урьдчилан харах + хадгалах */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('👁️ Урьдчилан харах', '👁️ Preview')}</h3>
                  <div className="p-5 relative overflow-hidden" style={{
                    background: getBannerSource()
                      ? `url("${getBannerSource()}") center / cover no-repeat`
                      : section.section_bg,
                    borderRadius: `${section.section_border_radius}px`,
                    border: `${section.section_border_width}px solid ${section.section_border_color}`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  }}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />
                    <div className={getBannerSource() ? 'relative z-10 max-w-2xl rounded-2xl bg-white/25 p-4 shadow-lg ring-1 ring-white/30 backdrop-blur-sm' : 'relative z-10'}>
                      <h1 style={{
                        fontFamily: section.title_fontfamily || 'inherit',
                        fontSize: `${section.title_fontsize}px`,
                        color: section.title_color,
                        fontWeight: Number(section.title_weight),
                      }}>{language === 'en' ? section.title_en : section.title_mn}</h1>
                      <p style={{
                        fontFamily: section.subtitle_fontfamily || 'inherit',
                        fontSize: `${section.subtitle_fontsize}px`,
                        color: section.subtitle_color,
                        fontWeight: Number(section.subtitle_weight),
                        marginTop: '2px',
                      }}>{language === 'en' ? section.subtitle_en : section.subtitle_mn}</p>
                      <p style={{
                        fontFamily: section.desc_fontfamily || 'inherit',
                        fontSize: `${section.desc_fontsize}px`,
                        color: section.desc_color,
                        marginTop: '12px', lineHeight: 1.6, maxWidth: '600px',
                      }}>{language === 'en' ? section.desc_en : section.desc_mn}</p>
                    </div>
                    <button className="relative z-10" style={{
                      background: section.btn_bg,
                      color: section.btn_color,
                      borderRadius: `${section.btn_radius}px`,
                      fontFamily: section.btn_fontfamily || 'inherit',
                      fontSize: `${section.btn_fontsize}px`,
                      fontWeight: Number(section.btn_fontweight),
                      padding: '10px 20px',
                      marginTop: '16px',
                      border: 'none',
                      cursor: 'pointer',
                    }}>{language === 'en' ? section.btn_en : section.btn_mn}</button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={saveSection} variant="primary" disabled={sectionSaving}>
                    {sectionSaving ? t('Хадгалж байна...', 'Saving...') : t('Хадгалах', 'Save')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">{trans.policyListings}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedPolicyCategory ? `${getCategoryName(selectedPolicyCategory)} ангилал дотор бодлого нэмнэ` : t('Эхлээд ангилал нэмээд дотор нь бодлого үүсгэнэ', 'Add a category first, then create policies inside it')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => handleOpenCategoryModal()} variant="secondary"><PlusIcon className="h-5 w-5 mr-2" />{t('Ангилал нэмэх', 'Add Category')}</Button>
                <Button onClick={() => handleOpenPolicyModal(undefined, selectedPolicyCategoryId)} variant="primary"><PlusIcon className="h-5 w-5 mr-2" />{trans.addPolicy}</Button>
              </div>
            </div>
            {policyCategoryTabs.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {policyCategoryTabs.map((category) => {
                  const categoryId = category.id ? String(category.id) : UNCATEGORIZED_POLICY_CATEGORY_ID;
                  const isSelected = categoryId === selectedPolicyCategoryId;
                  const categoryPolicyCount = Object.values(policies).filter((policy) => getPolicyCategoryId(policy) === categoryId).length;
                  const isVirtual = categoryId === UNCATEGORIZED_POLICY_CATEGORY_ID;

                  return (
                    <button
                      key={categoryId}
                      onClick={() => { setActivePolicyCategory(categoryId); setActivePolicy(null); }}
                      className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${isSelected ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'}`}
                    >
                      <span>{getCategoryName(category)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{categoryPolicyCount}</span>
                      {!isVirtual && (
                        <span className="ml-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => { event.stopPropagation(); handleOpenCategoryModal(category); }}
                            onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); handleOpenCategoryModal(category); } }}
                            className="rounded-full p-1 text-teal-600 hover:bg-teal-100"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => { event.stopPropagation(); deletePolicyCategory(category); }}
                            onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); deletePolicyCategory(category); } }}
                            className="rounded-full p-1 text-red-600 hover:bg-red-100"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 text-sm text-slate-700">{selectedPolicyKeys.map(renderPolicyButton)}</div>
            {selectedPolicyKeys.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                {t('Энэ ангилалд бодлого алга. “Шинэ бодлого нэмэх” дарж нэмээрэй.', 'No policies in this category. Click “Add New Policy” to add one.')}
              </div>
            )}

            {/* ═══ Бодлого хэсгийн тохиргоо ═══ */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button onClick={() => setPolicySettingsOpen(!policySettingsOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <h3 className="text-sm font-semibold text-slate-700">{t('🛡️ Бодлого хэсгийн тохиргоо', '🛡️ Policy Section Settings')}</h3>
                <ChevronDownIcon className={`h-4 w-4 text-slate-500 transition-transform ${policySettingsOpen ? 'rotate-180' : ''}`} />
              </button>
              {policySettingsOpen && (
                <div className="p-4 pt-0 space-y-5 border-t border-slate-200">
                  {/* HR Бодлого таб icon */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('🛡️ HR Бодлого табны icon', '🛡️ Policy Tab Icon')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Зураг оруулах', 'Upload Image')}</label>
                        <ImageUpload value={section.policy_tab_icon_image} onChange={(url) => updateSection('policy_tab_icon_image', url)} label="" />
                      </div>
                      <div>
                        <Input label={t('Эсвэл зургийн линк (URL)', 'Or image URL')} value={section.policy_tab_icon_url} onChange={(e) => updateSection('policy_tab_icon_url', e.target.value)} placeholder="https://..." />
                        {(section.policy_tab_icon_image || section.policy_tab_icon_url) && (
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-xs text-slate-500">{t('Урьдчилан харах:', 'Preview:')}</span>
                            <img src={section.policy_tab_icon_url || section.policy_tab_icon_image} alt="policy tab icon" className="w-8 h-8 rounded object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* HR Бодлого табны идэвхтэй өнгө */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('🎨 Бодлого табны идэвхтэй өнгө', '🎨 Policy Tab Active Color')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Арын өнгө', 'Background')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.policy_tab_active_bg} onChange={(e) => updateSection('policy_tab_active_bg', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.policy_tab_active_bg} onChange={(e) => updateSection('policy_tab_active_bg', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Текст өнгө', 'Text Color')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.policy_tab_active_color} onChange={(e) => updateSection('policy_tab_active_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.policy_tab_active_color} onChange={(e) => updateSection('policy_tab_active_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HR Бодлого хэсгийн загвар */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('📋 HR Бодлого хэсгийн загвар', '📋 Policy Section Style')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <FontSelect label={t('Гарчиг фонт', 'Title Font')} value={section.policy_title_fontfamily} onChange={(v) => updateSection('policy_title_fontfamily', v)} />
                      <Input label={t('Гарчиг хэмжээ', 'Title Size')} type="number" value={section.policy_title_fontsize} onChange={(e) => updateSection('policy_title_fontsize', e.target.value)} />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Гарчиг өнгө', 'Title Color')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.policy_title_color} onChange={(e) => updateSection('policy_title_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.policy_title_color} onChange={(e) => updateSection('policy_title_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Гарчиг жин', 'Title Weight')}</label>
                        <select value={section.policy_title_weight} onChange={(e) => updateSection('policy_title_weight', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      <Input label={t('Тайлбар хэмжээ', 'Desc Size')} type="number" value={section.policy_desc_fontsize} onChange={(e) => updateSection('policy_desc_fontsize', e.target.value)} />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Тайлбар өнгө', 'Desc Color')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.policy_desc_color} onChange={(e) => updateSection('policy_desc_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.policy_desc_color} onChange={(e) => updateSection('policy_desc_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Карт арын өнгө', 'Card BG')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.policy_card_bg} onChange={(e) => updateSection('policy_card_bg', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.policy_card_bg} onChange={(e) => updateSection('policy_card_bg', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Карт хүрээ өнгө', 'Card Border')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.policy_card_border_color} onChange={(e) => updateSection('policy_card_border_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.policy_card_border_color} onChange={(e) => updateSection('policy_card_border_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <Input label={t('Карт булангийн радиус', 'Card Radius')} type="number" value={section.policy_card_border_radius} onChange={(e) => updateSection('policy_card_border_radius', e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={saveSection} variant="primary" disabled={sectionSaving}>
                      {sectionSaving ? t('Хадгалж байна...', 'Saving...') : t('Хадгалах', 'Save')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {activePolicy && policies[activePolicy] && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: policies[activePolicy].bg_color ? `linear-gradient(135deg, ${policies[activePolicy].bg_color}, ${policies[activePolicy].bg_color}dd)` : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                    {(policies[activePolicy].icon_url || policies[activePolicy].icon_image) ? <img src={policies[activePolicy].icon_url || policies[activePolicy].icon_image} alt="" className="w-5 h-5 object-contain" /> : POLICY_ICONS[policies[activePolicy].icon || activePolicy] || POLICY_ICONS.equal}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{getPolicyName(policies[activePolicy])}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenPolicyModal(policies[activePolicy])} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg"><PencilIcon className="h-4 w-4" /></button>
                  <button onClick={() => handleDeletePolicy(activePolicy)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: policies[activePolicy].font_color || '#334155', fontSize: `${policies[activePolicy].fontsize || 16}px` }}>{getPolicyDesc(policies[activePolicy])}</p>
            </div>
          )}

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">{trans.jobListings}</h2>
              <Button onClick={() => handleOpenJobModal()} variant="primary"><PlusIcon className="h-5 w-5 mr-2" />{trans.addJob}</Button>
            </div>
            {jobs.length > 0 && (
              <div className="space-y-4">
                {jobs.map((job: Job, index: number) => (
                  <div key={job.id} className="rounded-xl border border-slate-200 bg-white">
                    <div className="p-3 sm:p-5">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0" style={{ background: 'linear-gradient(135deg, #475569 0%, #334155 100%)' }}><BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" /></div>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                              <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-800 text-white text-[10px] sm:text-xs font-bold shrink-0">{index + 1}</span>
                              <h3 className="text-sm sm:text-xl font-semibold text-slate-900 truncate">{language === 'en' ? job.title_en || job.title : job.title}</h3>
                              <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium shrink-0 ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{job.status === 'active' ? trans.active : trans.closed}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 ml-10 sm:ml-13">
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/80 text-xs sm:text-sm rounded-full text-slate-600 border border-slate-200/50">{language === 'en' ? job.department_en || job.department : job.department}</span>
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/80 text-xs sm:text-sm rounded-full text-slate-600 border border-slate-200/50">{job.type}</span>
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/80 text-xs sm:text-sm rounded-full text-slate-600 border border-slate-200/50">{job.location}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 sm:gap-1.5 shrink-0">
                          <button onClick={() => handleOpenJobModal(job)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg"><PencilIcon className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteJob(job.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-200">
                        <span className="text-xs sm:text-sm text-slate-600">{trans.deadline}: {job.deadline}</span>
                      </div>
                    </div>
                    <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-0 border-t border-slate-200 bg-slate-50">
                      <div className="pt-3 sm:pt-5 space-y-3 sm:space-y-4">
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200">
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">{t('Ажлын тайлбар', 'Job Description')}</h4>
                          <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">{language === 'en' ? job.description_en || job.description : job.description}</p>
                        </div>
                        {(language === 'en' ? job.requirements_en : job.requirements) && (
                          <div className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200">
                            <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">{t('Шаардлага', 'Requirements')}</h4>
                            <div className="text-slate-600 leading-relaxed whitespace-pre-line text-xs sm:text-sm">{language === 'en' ? job.requirements_en : job.requirements}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ Ажлын байр хэсгийн тохиргоо ═══ */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button onClick={() => setJobsSettingsOpen(!jobsSettingsOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <h3 className="text-sm font-semibold text-slate-700">{t('💼 Ажлын байр хэсгийн тохиргоо', '💼 Jobs Section Settings')}</h3>
                <ChevronDownIcon className={`h-4 w-4 text-slate-500 transition-transform ${jobsSettingsOpen ? 'rotate-180' : ''}`} />
              </button>
              {jobsSettingsOpen && (
                <div className="p-4 pt-0 space-y-5 border-t border-slate-200">
                  {/* Ажлын байр таб icon */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('💼 Ажлын байр табны icon', '💼 Jobs Tab Icon')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Зураг оруулах', 'Upload Image')}</label>
                        <ImageUpload value={section.jobs_tab_icon_image} onChange={(url) => updateSection('jobs_tab_icon_image', url)} label="" />
                      </div>
                      <div>
                        <Input label={t('Эсвэл зургийн линк (URL)', 'Or image URL')} value={section.jobs_tab_icon_url} onChange={(e) => updateSection('jobs_tab_icon_url', e.target.value)} placeholder="https://..." />
                        {(section.jobs_tab_icon_image || section.jobs_tab_icon_url) && (
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-xs text-slate-500">{t('Урьдчилан харах:', 'Preview:')}</span>
                            <img src={section.jobs_tab_icon_url || section.jobs_tab_icon_image} alt="jobs tab icon" className="w-8 h-8 rounded object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ажлын байр табны идэвхтэй өнгө */}

                  {/* Ажлын байр табны идэвхтэй өнгө */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('🎨 Ажлын байр табны идэвхтэй өнгө', '🎨 Jobs Tab Active Color')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Арын өнгө', 'Background')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.jobs_tab_active_bg} onChange={(e) => updateSection('jobs_tab_active_bg', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.jobs_tab_active_bg} onChange={(e) => updateSection('jobs_tab_active_bg', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Текст өнгө', 'Text Color')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.jobs_tab_active_color} onChange={(e) => updateSection('jobs_tab_active_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.jobs_tab_active_color} onChange={(e) => updateSection('jobs_tab_active_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ажлын байр хэсгийн загвар */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('💼 Ажлын байр хэсгийн загвар', '💼 Jobs Section Style')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <FontSelect label={t('Гарчиг фонт', 'Title Font')} value={section.jobs_title_fontfamily} onChange={(v) => updateSection('jobs_title_fontfamily', v)} />
                      <Input label={t('Гарчиг хэмжээ', 'Title Size')} type="number" value={section.jobs_title_fontsize} onChange={(e) => updateSection('jobs_title_fontsize', e.target.value)} />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Гарчиг өнгө', 'Title Color')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.jobs_title_color} onChange={(e) => updateSection('jobs_title_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.jobs_title_color} onChange={(e) => updateSection('jobs_title_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Гарчиг жин', 'Title Weight')}</label>
                        <select value={section.jobs_title_weight} onChange={(e) => updateSection('jobs_title_weight', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      <Input label={t('Тайлбар хэмжээ', 'Desc Size')} type="number" value={section.jobs_desc_fontsize} onChange={(e) => updateSection('jobs_desc_fontsize', e.target.value)} />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Тайлбар өнгө', 'Desc Color')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.jobs_desc_color} onChange={(e) => updateSection('jobs_desc_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.jobs_desc_color} onChange={(e) => updateSection('jobs_desc_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Карт арын өнгө', 'Card BG')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.jobs_card_bg} onChange={(e) => updateSection('jobs_card_bg', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.jobs_card_bg} onChange={(e) => updateSection('jobs_card_bg', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Карт хүрээ өнгө', 'Card Border')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.jobs_card_border_color} onChange={(e) => updateSection('jobs_card_border_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.jobs_card_border_color} onChange={(e) => updateSection('jobs_card_border_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      <Input label={t('Карт булангийн радиус', 'Card Radius')} type="number" value={section.jobs_card_border_radius} onChange={(e) => updateSection('jobs_card_border_radius', e.target.value)} />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Badge арын өнгө', 'Badge BG')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.jobs_badge_bg} onChange={(e) => updateSection('jobs_badge_bg', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.jobs_badge_bg} onChange={(e) => updateSection('jobs_badge_bg', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Badge текст өнгө', 'Badge Color')}</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={section.jobs_badge_color} onChange={(e) => updateSection('jobs_badge_color', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <input type="text" value={section.jobs_badge_color} onChange={(e) => updateSection('jobs_badge_color', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={saveSection} variant="primary" disabled={sectionSaving}>
                      {sectionSaving ? t('Хадгалж байна...', 'Saving...') : t('Хадгалах', 'Save')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {modalOpen && (
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'policy' ? editingPolicy ? t('Бодлого засах', 'Edit Policy') : t('Шинэ бодлого нэмэх', 'Add New Policy') : editingJob ? t('Зар засах', 'Edit Job Listing') : t('Шинэ зар нэмэх', 'Add New Job')}>
              {modalMode === 'job' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('Нэр (Монгол)', 'Name (Mongolian)')}</label><Input value={jobFormData.title} onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })} placeholder={t('Зээлийн мэргэжилтэн', 'Loan Specialist')} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('Нэр (English)', 'Name (English)')}</label><Input value={jobFormData.title_en || ''} onChange={(e) => setJobFormData({ ...jobFormData, title_en: e.target.value })} placeholder="Loan Specialist" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('Хэлтэс (Монгол)', 'Department (Mongolian)')}</label><Input value={jobFormData.department} onChange={(e) => setJobFormData({ ...jobFormData, department: e.target.value })} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('Хэлтэс (English)', 'Department (English)')}</label><Input value={jobFormData.department_en || ''} onChange={(e) => setJobFormData({ ...jobFormData, department_en: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{trans.type}</label><select value={jobFormData.type} onChange={(e) => setJobFormData({ ...jobFormData, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option>Бүтэн цагийн</option><option>Хагас цагийн</option><option>Гэрээт</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{trans.location}</label><Input value={jobFormData.location} onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })} /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('Тайлбар (Монгол)', 'Description (Mongolian)')}</label><Textarea value={jobFormData.description} onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })} rows={3} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('Description (English)', 'Description (English)')}</label><Textarea value={jobFormData.description_en || ''} onChange={(e) => setJobFormData({ ...jobFormData, description_en: e.target.value })} rows={3} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('Шаардлага (Монгол)', 'Requirements (Mongolian)')}</label><Textarea value={jobFormData.requirements || ''} onChange={(e) => setJobFormData({ ...jobFormData, requirements: e.target.value })} rows={3} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('Requirements (English)', 'Requirements (English)')}</label><Textarea value={jobFormData.requirements_en || ''} onChange={(e) => setJobFormData({ ...jobFormData, requirements_en: e.target.value })} rows={3} /></div>
                  {/* Icon */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('🖼️ Зарын icon (дугаарын оронд)', '🖼️ Job Icon (replaces number)')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Зураг оруулах', 'Upload Image')}</label>
                        <ImageUpload value={jobFormData.icon_image || ''} onChange={(url) => setJobFormData({ ...jobFormData, icon_image: url })} label="" />
                      </div>
                      <div>
                        <Input label={t('Эсвэл зургийн линк (URL)', 'Or image URL')} value={jobFormData.icon_url || ''} onChange={(e) => setJobFormData({ ...jobFormData, icon_url: e.target.value })} placeholder="https://..." />
                        {(jobFormData.icon_image || jobFormData.icon_url) && (
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-xs text-slate-500">{t('Урьдчилан харах:', 'Preview:')}</span>
                            <img src={jobFormData.icon_url || jobFormData.icon_image} alt="job icon" className="w-8 h-8 rounded object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label={trans.deadline} type="date" value={jobFormData.deadline} onChange={(e) => setJobFormData({ ...jobFormData, deadline: e.target.value })} />
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{trans.status}</label><select value={jobFormData.status} onChange={(e) => setJobFormData({ ...jobFormData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="active">{trans.active}</option><option value="closed">{trans.closed}</option></select></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button onClick={() => setModalOpen(false)} variant="secondary">{trans.cancel}</Button>
                    <Button onClick={handleSaveJob} variant="primary" disabled={loading}>{loading ? t('Хадгалж байна...', 'Saving...') : trans.save}</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {/* FULL POLICY FORM - KEEPING ORIGINAL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('Ангилал', 'Category')}</label>
                    <select
                      value={policyFormData.category ? String(policyFormData.category) : ''}
                      onChange={(event) => setPolicyFormData({ ...policyFormData, category: event.target.value ? Number(event.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">{t('Ерөнхий', 'General')}</option>
                      {policyCategories.map((category) => (
                        <option key={category.id} value={category.id}>{getCategoryName(category)}</option>
                      ))}
                    </select>
                  </div>
                  <Input label={t('Key (англи үсэг)', 'Key')} value={policyFormData.key} onChange={(e) => setPolicyFormData({ ...policyFormData, key: e.target.value.toLowerCase().replace(/[^a-z]/g, '') })} disabled={!!editingPolicy} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('Нэр (English)', 'Name (English)')}</label><Input value={policyFormData.translations[0]?.name || ''} onChange={(e) => { const n = [...policyFormData.translations]; n[0] = { ...n[0], language: 1, name: e.target.value }; setPolicyFormData({ ...policyFormData, translations: n }); }} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('Нэр (Монгол)', 'Name (Mongolian)')}</label><Input value={policyFormData.translations[1]?.name || ''} onChange={(e) => { const n = [...policyFormData.translations]; n[1] = { ...n[1], language: 2, name: e.target.value }; setPolicyFormData({ ...policyFormData, translations: n }); }} /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('Тайлбар (English)', 'Description (English)')}</label><Textarea value={policyFormData.translations[0]?.desc || ''} onChange={(e) => { const n = [...policyFormData.translations]; n[0] = { ...n[0], language: 1, desc: e.target.value }; setPolicyFormData({ ...policyFormData, translations: n }); }} rows={3} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('Тайлбар (Монгол)', 'Description (Mongolian)')}</label><Textarea value={policyFormData.translations[1]?.desc || ''} onChange={(e) => { const n = [...policyFormData.translations]; n[1] = { ...n[1], language: 2, desc: e.target.value }; setPolicyFormData({ ...policyFormData, translations: n }); }} rows={3} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('Харагдах байдал', 'Visual Type')}</label><select value={policyFormData.visual_type} onChange={(e) => setPolicyFormData({ ...policyFormData, visual_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="card">Card</option><option value="banner">Banner</option><option value="list">List</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('Загвар', 'Preset')}</label><select value={policyFormData.visual_preset} onChange={(e) => setPolicyFormData({ ...policyFormData, visual_preset: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="m">m - Equal</option><option value="t">t - Training</option><option value="b">b - Benefits</option><option value="h">h - Health</option><option value="i">i - Insurance</option></select></div>
                  </div>
                  <Input label={t('Текстийн өнгө', 'Text Color')} type="color" value={policyFormData.font_color} onChange={(e) => setPolicyFormData({ ...policyFormData, font_color: e.target.value })} />
                  <Input label={t('Фонтын хэмжээ', 'Font Size')} type="number" value={policyFormData.fontsize} onChange={(e) => setPolicyFormData({ ...policyFormData, fontsize: e.target.value })} min="12" max="24" />
                  <FontSelect label={t('Фонт гарчиг', 'Font Family')} value={policyFormData.fontfamily} onChange={(v) => setPolicyFormData({ ...policyFormData, fontfamily: v })} />
                  <Input label={t('Фондын өнгө', 'Background')} type="color" value={policyFormData.bg_color} onChange={(e) => setPolicyFormData({ ...policyFormData, bg_color: e.target.value })} />
                  {/* Icon */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('🖼️ Бодлогын icon', '🖼️ Policy Icon')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('Зураг оруулах', 'Upload Image')}</label>
                        <ImageUpload value={policyFormData.icon_image || ''} onChange={(url) => setPolicyFormData({ ...policyFormData, icon_image: url })} label="" />
                      </div>
                      <div>
                        <Input label={t('Эсвэл зургийн линк (URL)', 'Or image URL')} value={policyFormData.icon_url || ''} onChange={(e) => setPolicyFormData({ ...policyFormData, icon_url: e.target.value })} placeholder="https://..." />
                        {(policyFormData.icon_image || policyFormData.icon_url) && (
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-xs text-slate-500">{t('Урьдчилан харах:', 'Preview:')}</span>
                            <img src={policyFormData.icon_url || policyFormData.icon_image} alt="policy icon" className="w-8 h-8 rounded object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="active" checked={policyFormData.active} onChange={(e) => setPolicyFormData({ ...policyFormData, active: e.target.checked })} className="rounded" />
                    <label htmlFor="active" className="text-sm font-medium text-gray-700">{t('Идэвхтэй', 'Active')}</label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button onClick={() => setModalOpen(false)} variant="secondary">{trans.cancel}</Button>
                    <Button onClick={handleSavePolicy} variant="primary" disabled={loading}>{loading ? t('Хадгалж байна...', 'Saving...') : trans.save}</Button>
                  </div>
                </div>
              )}
            </Modal>
          )}

          {categoryModalOpen && (
            <Modal
              isOpen={categoryModalOpen}
              onClose={() => setCategoryModalOpen(false)}
              title={editingCategory ? t('Ангилал засах', 'Edit Category') : t('Шинэ ангилал нэмэх', 'Add New Category')}
            >
              <div className="space-y-4">
                <Input
                  label={t('Key (англи үсэг)', 'Key')}
                  value={categoryFormData.key}
                  onChange={(event) => setCategoryFormData({ ...categoryFormData, key: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  disabled={!!editingCategory}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('Нэр (English)', 'Name (English)')}</label>
                    <Input
                      value={categoryFormData.translations[0]?.name || ''}
                      onChange={(event) => {
                        const nextTranslations = [...categoryFormData.translations];
                        nextTranslations[0] = { ...nextTranslations[0], language: 1, name: event.target.value };
                        setCategoryFormData({ ...categoryFormData, translations: nextTranslations });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('Нэр (Монгол)', 'Name (Mongolian)')}</label>
                    <Input
                      value={categoryFormData.translations[1]?.name || ''}
                      onChange={(event) => {
                        const nextTranslations = [...categoryFormData.translations];
                        nextTranslations[1] = { ...nextTranslations[1], language: 2, name: event.target.value };
                        setCategoryFormData({ ...categoryFormData, translations: nextTranslations });
                      }}
                    />
                  </div>
                </div>
                <Input
                  label={t('Дараалал', 'Sort Order')}
                  type="number"
                  value={String(categoryFormData.sort_order)}
                  onChange={(event) => setCategoryFormData({ ...categoryFormData, sort_order: Number(event.target.value) || 0 })}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="policy-category-active"
                    checked={categoryFormData.active}
                    onChange={(event) => setCategoryFormData({ ...categoryFormData, active: event.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="policy-category-active" className="text-sm font-medium text-gray-700">{t('Идэвхтэй', 'Active')}</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button onClick={() => setCategoryModalOpen(false)} variant="secondary">{trans.cancel}</Button>
                  <Button onClick={handleSaveCategory} variant="primary" disabled={loading}>{loading ? t('Хадгалж байна...', 'Saving...') : trans.save}</Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
