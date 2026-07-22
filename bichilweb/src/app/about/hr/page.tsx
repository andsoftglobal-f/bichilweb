import { logApiWarning } from "@/lib/apiError";
import { getApiBase } from "@/lib/apiBase";
import HRPageClient, {
  UNCATEGORIZED_POLICY_CATEGORY_ID,
  type Job,
  type Policy,
  type PolicyCategory,
  type SectionStyle,
} from "./HRPageClient";

/* ───────── API Types ───────── */
interface PolicyTranslation {
  id?: number;
  language: number;
  language_code?: string;
  language_name?: string;
  name: string;
  desc: string;
}
interface PolicyCategoryAPI {
  id?: number;
  key: string;
  sort_order: number;
  active: boolean;
  translations: PolicyTranslation[];
}
interface SectionTranslation {
  language?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  btn_text?: string;
}
interface PolicyAPI {
  id?: number;
  category?: number | null;
  key: string;
  visual_type: string;
  visual_preset: string;
  font_color: string;
  bg_color: string;
  fontsize: string;
  fontfamily: string;
  active: boolean;
  icon_image?: string;
  icon_url?: string;
  translations: PolicyTranslation[];
}
interface JobTranslation {
  id?: number;
  language: number;
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
  icon_image?: string;
  icon_url?: string;
  translations: JobTranslation[];
}

/* ───────── Helper: hex to rgba ───────── */
const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
};

// This page's locale was never wired to the site-wide language system —
// it always renders Mongolian regardless of the visitor's chosen locale.
// Pre-existing behavior, left as-is (see i18n migration plan notes).
// Returned from a function (rather than a plain const) so TS keeps the
// "en" | "mn" union instead of narrowing to the literal "mn", which would
// make the language === "en" branches below a compile error.
function getPageLanguage(): "en" | "mn" {
  return "mn";
}
const language = getPageLanguage();

const toPolicyCategory = (api: PolicyCategoryAPI): PolicyCategory => {
  const tr = api.translations.find((t) => t.language === (language === "en" ? 1 : 2));
  return {
    id: api.id ? String(api.id) : api.key,
    name: tr?.name || api.key,
  };
};

const toPolicy = (api: PolicyAPI): Policy => {
  const tr = api.translations.find((t) => t.language === (language === "en" ? 1 : 2));
  const accent = api.bg_color || '#0048BA';
  return {
    key: api.key,
    categoryId: api.category ? String(api.category) : UNCATEGORIZED_POLICY_CATEGORY_ID,
    title: tr?.name || "",
    content: tr?.desc || "",
    accentColor: accent,
    glowColor: hexToRgba(accent, 0.15),
    iconBg: `linear-gradient(135deg,${accent},${accent}dd)`,
    iconSrc: api.icon_url || api.icon_image || '',
    fontfamily: api.fontfamily || '',
    font_color: api.font_color || '',
    fontsize: api.fontsize || '',
  };
};

const toJob = (api: JobAPI): Job => {
  const tr = api.translations.find((t) => t.language === (language === "en" ? 1 : 2));
  const typeMap: Record<number, string> = { 1: "Бүтэн цагийн", 2: "Хагас цагийн", 3: "Гэрээт" };
  return {
    id: String(api.id || ""),
    title: tr?.title || "",
    department: tr?.department || "",
    type: typeMap[api.type] || "Бүтэн цагийн",
    location: api.location,
    description: tr?.desc || "",
    requirements: tr?.requirements || "",
    deadline: api.deadline,
    status: api.status === 1 ? "active" : "closed",
    icon_image: api.icon_image || '',
    icon_url: api.icon_url || '',
  };
};

const defaultSection: SectionStyle = {
  title_fontfamily: '', title_fontsize: '48', title_color: '#0f172a', title_weight: '800',
  subtitle_fontfamily: '', subtitle_fontsize: '16', subtitle_color: '#0048BA', subtitle_weight: '600',
  desc_fontfamily: '', desc_fontsize: '16', desc_color: '#64748b',
  btn_bg: '#0048BA', btn_color: '#ffffff', btn_radius: '9999', btn_fontfamily: '', btn_fontsize: '15', btn_fontweight: '600',
  section_bg: 'transparent', section_border_radius: '0', section_border_color: 'transparent', section_border_width: '0',
  title_mn: '', title_en: '', subtitle_mn: '', subtitle_en: '', desc_mn: '', desc_en: '', btn_mn: '', btn_en: '',
  banner_image: '', banner_url: '',
  banner_desktop_image: '', banner_desktop_url: '',
  banner_tablet_image: '', banner_tablet_url: '',
  banner_mobile_image: '', banner_mobile_url: '',
  icon_image: '', icon_url: '',
  policy_title_fontfamily: '', policy_title_fontsize: '', policy_title_color: '', policy_title_weight: '',
  policy_desc_fontsize: '', policy_desc_color: '',
  policy_card_bg: '', policy_card_border_color: '', policy_card_border_radius: '',
  jobs_title_fontfamily: '', jobs_title_fontsize: '', jobs_title_color: '', jobs_title_weight: '',
  jobs_desc_fontsize: '', jobs_desc_color: '',
  jobs_card_bg: '', jobs_card_border_color: '', jobs_card_border_radius: '',
  jobs_badge_bg: '', jobs_badge_color: '',
  btn_icon_image: '', btn_icon_url: '',
  policy_tab_icon_image: '', policy_tab_icon_url: '',
  jobs_tab_icon_image: '', jobs_tab_icon_url: '',
  policy_tab_active_bg: '#0048BA', policy_tab_active_color: '#ffffff',
  jobs_tab_active_bg: '#0048BA', jobs_tab_active_color: '#ffffff',
};

async function getHRData(): Promise<{
  jobs: Job[];
  policies: Record<string, Policy>;
  policyCategories: PolicyCategory[];
  sec: SectionStyle;
}> {
  try {
    const API_URL = getApiBase();
    const [catRes, polRes, jobRes, secRes] = await Promise.all([
      fetch(`${API_URL}/hrpolicy-category/`, { next: { revalidate: 60 } }).catch(() => null),
      fetch(`${API_URL}/hrpolicy/`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/jobs/`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/hr-section/`, { next: { revalidate: 60 } }).catch(() => null),
    ]);

    const catRaw = catRes?.ok ? await catRes.json() : []
    const categoriesArray: PolicyCategoryAPI[] = Array.isArray(catRaw) ? catRaw : catRaw?.results ?? []
    const policyCategories = categoriesArray.filter((x) => x.active).map((x) => toPolicyCategory(x));

    const polRaw = polRes.ok ? await polRes.json() : []
    const policiesArray: PolicyAPI[] = Array.isArray(polRaw) ? polRaw : polRaw?.results ?? []
    const policies: Record<string, Policy> = {};
    policiesArray.filter((x) => x.active).forEach((x) => (policies[x.key] = toPolicy(x)));

    const jobRaw = jobRes.ok ? await jobRes.json() : []
    const jobsArray: JobAPI[] = Array.isArray(jobRaw) ? jobRaw : jobRaw?.results ?? []
    const jobs = jobsArray.filter((j) => j.status === 1).map((j) => toJob(j));

    let sec = defaultSection;
    const secData = secRes?.ok ? await secRes.json() : null
    if (secData && secData.id) {
      const trEn = (secData.translations as SectionTranslation[] | undefined)?.find((item) => item.language === 1) || {};
      const trMn = (secData.translations as SectionTranslation[] | undefined)?.find((item) => item.language === 2) || {};
      sec = {
        ...defaultSection,
        ...secData,
        title_mn: trMn.title,
        title_en: trEn.title,
        subtitle_mn: trMn.subtitle,
        subtitle_en: trEn.subtitle,
        desc_mn: trMn.description,
        desc_en: trEn.description,
        btn_mn: trMn.btn_text,
        btn_en: trEn.btn_text,
      };
    }

    return { jobs, policies, policyCategories, sec };
  } catch (e) {
    logApiWarning("HR page", e);
    return { jobs: [], policies: {}, policyCategories: [], sec: defaultSection };
  }
}

export default async function HRPage() {
  const { jobs, policies, policyCategories, sec } = await getHRData();

  return (
    <HRPageClient jobs={jobs} policies={policies} policyCategories={policyCategories} sec={sec} />
  );
}
