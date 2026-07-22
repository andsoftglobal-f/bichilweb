"use client";

import dynamic from "next/dynamic";
import type { BranchSettings } from "@/app/branches/BranchesPageClient";
import type { Locale } from "@/lib/i18n";

interface PhoneItem {
  id: number;
  phone: string;
}

interface Branch {
  id: number;
  name: string;
  name_en: string;
  location: string;
  location_en: string;
  image: string;
  image_url: string;
  area: string;
  area_en: string;
  city: string;
  city_en: string;
  district: string;
  district_en: string;
  open: string;
  open_en: string;
  time: string;
  latitude: string;
  longitude: string;
  phones: PhoneItem[];
  category_id: number | null;
  category_name: string | null;
  category_name_en: string | null;
}

type Props = {
  branches: Branch[];
  selectedBranch: Branch | null;
  onSelect: (b: Branch) => void;
  settings: BranchSettings;
  locale: Locale;
};

// Leaflet must be loaded client-side only
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export default function BranchesMap({ branches, selectedBranch, onSelect, settings, locale }: Props) {
  return (
    <LeafletMap
      branches={branches}
      selectedBranch={selectedBranch}
      onSelect={onSelect}
      settings={settings}
      locale={locale}
    />
  );
}