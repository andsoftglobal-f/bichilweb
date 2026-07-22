"use client";

import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Clock, Calendar, Phone } from "lucide-react";
import "leaflet/dist/leaflet.css";
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

const parseBranchCoordinate = (value: string | null | undefined) => {
  if (!value) return null;
  const numeric = Number.parseFloat(String(value).trim().replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
};

function makeIcon(color: string, size: "normal" | "selected") {
  if (size === "selected") {
    const svg = `<svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg"><path d="M20 2C11.72 2 5 8.72 5 17c0 11.25 15 30 15 30s15-18.75 15-30c0-8.28-6.72-15-15-15z" fill="${color}" stroke="white" stroke-width="2.5"/><circle cx="20" cy="17" r="6" fill="white"/></svg>`;
    return new L.Icon({
      iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
      iconSize: [40, 52],
      iconAnchor: [20, 52],
      popupAnchor: [0, -52],
    });
  }
  const svg = `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 2C9.37 2 4 7.37 4 14c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="16" cy="14" r="5" fill="white"/></svg>`;
  return new L.Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
}

// Component to handle map view changes
function MapController({ branches, selectedBranch }: { branches: Branch[]; selectedBranch: Branch | null }) {
  const map = useMap();

  useEffect(() => {
    const selectedLat = parseBranchCoordinate(selectedBranch?.latitude);
    const selectedLng = parseBranchCoordinate(selectedBranch?.longitude);

    // 1. Хэрэв салбар сонгогдсон бол түүн рүү очно
    if (selectedLat !== null && selectedLng !== null) {
      map.flyTo([selectedLat, selectedLng], 16, { duration: 0.8 });
      return;
    }

    // 2. Буруу координаттай салбаруудыг шүүх
    const validBranches = branches.filter((b) => {
      const latitude = parseBranchCoordinate(b.latitude);
      const longitude = parseBranchCoordinate(b.longitude);
      return latitude !== null && longitude !== null;
    });

    if (validBranches.length === 0) return;

    // 3. Салбаруудыг хотоор нь (эсвэл ойролцоо координатаар) бүлэглэх
    const groups: Record<string, Branch[]> = {};
    validBranches.forEach(b => {
      // Хот тодорхойлогдоогүй бол өргөргийн бүхэл хэсгээр багцална (ойролцоо байршил)
      const key = b.city ? b.city.trim().toLowerCase() : `${Math.floor(Number(b.latitude))}_${Math.floor(Number(b.longitude))}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });

    // 4. Хамгийн олон салбартай группыг олох
    let largestGroup: Branch[] = [];
    for (const key in groups) {
      if (groups[key].length > largestGroup.length) {
        largestGroup = groups[key];
      }
    }

    // Хэрэв групп олдохгүй бол бүх validBranches-г ашиглана (хамгаалалт)
    const targetBranches = largestGroup.length > 0 ? largestGroup : validBranches;

    // 5. Газрын зургийг тухайн группт тааруулах
    if (targetBranches.length === 1) {
      const latitude = parseBranchCoordinate(targetBranches[0].latitude);
      const longitude = parseBranchCoordinate(targetBranches[0].longitude);
      if (latitude !== null && longitude !== null) {
        map.setView([latitude, longitude], 15);
      }
    } else {
      const bounds = L.latLngBounds(
        targetBranches
          .map((b) => {
            const latitude = parseBranchCoordinate(b.latitude);
            const longitude = parseBranchCoordinate(b.longitude);
            return latitude !== null && longitude !== null ? [latitude, longitude] as [number, number] : null;
          })
          .filter((value): value is [number, number] => value !== null)
      );
      
      // maxZoom: 14 гэж өгснөөр хэт олон салбартай хэсэг рүү хэт ойртож орохоос сэргийлнэ
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [branches, selectedBranch, map]);

  return null;
}

export default function LeafletMap({ branches, selectedBranch, onSelect, settings, locale }: Props) {
  const markerRefs = useRef<Record<number, L.Marker>>({});
  const s = settings;
  const isEn = locale === 'en';

  const defaultMarker = useMemo(() => makeIcon(s.marker_color, "normal"), [s.marker_color]);
  const selectedMarker = useMemo(() => makeIcon(s.marker_selected_color, "selected"), [s.marker_selected_color]);

  // Open popup for selected branch
  useEffect(() => {
    if (selectedBranch && markerRefs.current[selectedBranch.id]) {
      markerRefs.current[selectedBranch.id].openPopup();
    }
  }, [selectedBranch]);

  return (
    <MapContainer
      center={[47.9184, 106.9177]}
      zoom={12}
      scrollWheelZoom={true}
      className="w-full h-full rounded-2xl"
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='Tiles &copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <TileLayer
        attribution='Labels &copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
      />
      <MapController branches={branches} selectedBranch={selectedBranch} />

      {branches.map((b) => {
        const latitude = parseBranchCoordinate(b.latitude);
        const longitude = parseBranchCoordinate(b.longitude);

        return latitude !== null && longitude !== null ? (
          <Marker
            key={b.id}
            position={[latitude, longitude]}
            icon={selectedBranch?.id === b.id ? selectedMarker : defaultMarker}
            ref={(ref) => {
              if (ref) markerRefs.current[b.id] = ref;
            }}
            eventHandlers={{
              click: () => onSelect(b),
            }}
          >
            {/* maxWidth, minWidth-ийг илүү өргөн болгох */}
          <Popup maxWidth={240} minWidth={200} closeButton={false} autoPan={true}>
            <div
              className="leaflet-popup-clean rounded-lg overflow-hidden flex flex-col"
              style={{ 
                background: s.popup_bg, 
                width: 220, /* Өргөнийг 250 байсныг 220 болгов */
                border: `1px solid ${s.popup_bg === '#ffffff' ? '#e5e7eb' : 'transparent'}` 
              }}
            >
              {/* Зургийн өндрийг h-20 (80px) болгож улам намхан болгосон */}
              {b.image_url && (
                <div className="relative w-full h-20 overflow-hidden shrink-0">
                  <img
                    src={b.image_url.startsWith('http') ? b.image_url : `${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${b.image_url}`}
                    alt={b.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                    }}
                  />
                  {b.category_name && (
                    <span
                      className="absolute top-1 left-1 px-1.5 py-0.5 text-white text-[8px] font-medium rounded-full backdrop-blur-sm"
                      style={{ background: `${s.popup_icon_color}e6` }}
                    >
                      {(isEn && b.category_name_en) ? b.category_name_en : b.category_name}
                    </span>
                  )}
                </div>
              )}

              {/* Доторх зайг p-2 (8px), мөр хоорондын зайг space-y-0.5 болгож шахав */}
              <div className="p-2 space-y-0.5 w-full">
                <h3
                  className="text-[13px] font-bold leading-tight mb-0.5"
                  style={{ color: s.popup_title_color }}
                >
                  {(isEn && b.name_en) ? b.name_en : b.name}
                </h3>

                {/* Location */}
                <div className="flex items-start gap-1">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" style={{ color: s.popup_icon_color }} />
                  <div className="text-[11px] leading-tight min-w-0" style={{ color: s.popup_text_color }}>
                    <p>{(isEn && b.location_en) ? b.location_en : b.location}</p>
                    {(b.area || b.city) && (
                      <p className="text-[9px] opacity-60 mt-0.5">
                        {isEn
                          ? [b.area_en || b.area, b.city_en || b.city, b.district_en || b.district].filter(Boolean).join(", ")
                          : [b.area, b.city, b.district].filter(Boolean).join(", ")
                        }
                      </p>
                    )}
                  </div>
                </div>

                {/* Working days */}
                {b.open && (
                  <div className="flex items-center gap-1" style={{ color: s.popup_text_color }}>
                    <Calendar className="w-3 h-3 shrink-0" style={{ color: s.popup_icon_color }} />
                    <p className="text-[11px]">{(isEn && b.open_en) ? b.open_en : b.open}</p>
                  </div>
                )}

                {/* Working hours */}
                {b.time && (
                  <div className="flex items-center gap-1" style={{ color: s.popup_text_color }}>
                    <Clock className="w-3 h-3 shrink-0" style={{ color: s.popup_icon_color }} />
                    <p className="text-[11px]">{b.time}</p>
                  </div>
                )}

                {/* Phones */}
                {b.phones && b.phones.length > 0 && (
                  <div className="pt-1 mt-1 border-t space-y-0.5" style={{ borderColor: '#e5e7eb' }}>
                    {b.phones.slice(0, 2).map((phone) => (
                      <div key={phone.id} className="flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 shrink-0" style={{ color: s.popup_icon_color }} />
                        <a
                          href={`tel:${phone.phone}`}
                          className="text-[11px]"
                          style={{ color: s.popup_text_color }}
                        >
                          {phone.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Direction button */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 w-full mt-1 px-2 py-1.5 rounded text-[10px] font-medium transition-all hover:opacity-90"
                  style={{ background: s.popup_btn_bg, color: s.popup_btn_text }}
                >
                  {(isEn && s.popup_btn_label_en) ? s.popup_btn_label_en : s.popup_btn_label}
                </a>
              </div>
            </div>
          </Popup>
          </Marker>
        ) : null;
      })}
    </MapContainer>
  );
}
