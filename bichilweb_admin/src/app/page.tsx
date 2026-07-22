'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import VisitorsChart from '@/components/admin/VisitorsChart'
import {
  NewspaperIcon,
  EyeIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
  CubeIcon,
  BanknotesIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

/* ---------- helpers ---------- */

const typeIconMap: Record<string, { icon: React.ElementType; color: string }> = {
  'Мэдээ':                 { icon: NewspaperIcon,        color: 'text-violet-500'  },
  'Ажлын зар':             { icon: BriefcaseIcon,        color: 'text-amber-500'   },
  'Үйлчилгээ':            { icon: CubeIcon,             color: 'text-emerald-500' },
  'Валютын ханш':          { icon: BanknotesIcon,        color: 'text-blue-500'    },
  'Зээлийн тооцоолуур':   { icon: CalculatorIcon,       color: 'text-indigo-500'  },
  'Хуудас':                { icon: EyeIcon,              color: 'text-cyan-500'    },
  'Зар сурталчилгаа':      { icon: NewspaperIcon,        color: 'text-orange-500'  },
  'Бидний тухай ангилал':  { icon: WrenchScrewdriverIcon, color: 'text-sky-500'     },
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Дөнгөж сая'
  if (mins < 60) return `${mins} минутын өмнө`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} цагийн өмнө`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Өчигдөр'
  return `${days} өдрийн өмнө`
}

/* ---------- types ---------- */

interface RecentItem {
  id: string
  type: string
  title: string
  href: string
  updatedAt: string | null
}

/* ------------------ PAGE ------------------ */

export default function AdminDashboard() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    fetch('/api/analytics/recent-updates?limit=10')
      .then(r => r.json())
      .then(data => setRecentItems(data.items || []))
      .catch(() => setRecentItems([]))
      .finally(() => setLoading(false))
  }, [])
  return (
    <AdminLayout title="Хянах самбар">

      {/* ================= VISITORS CHART ================= */}
      <div className="mb-8">
        <VisitorsChart />
      </div>

      {/* ================= RECENTLY UPDATED ================= */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-medium text-gray-600">
            Сүүлд шинэчилсэн
          </h2>
        </div>

        <div className="bg-white border border-gray-100 divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Ачааллаж байна...
            </div>
          ) : recentItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Шинэчлэлт олдсонгүй
            </div>
          ) : (
            recentItems.map((item) => {
              const mapping = typeIconMap[item.type] || {
                icon: WrenchScrewdriverIcon,
                color: 'text-gray-400',
              }
              const Icon = mapping.icon
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${mapping.color}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{item.type}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <p className="text-sm text-gray-600 truncate">
                        {item.title}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {item.updatedAt ? timeAgo(item.updatedAt) : '—'}
                  </span>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* ================= PREVIEW ================= */}
      <div className="bg-white border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-medium text-gray-600">
              Вэбсайт урьдчилж харах
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Frontend-ийн одоогийн төлөв
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Device toggles */}
            <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg">
              <button
                onClick={() => setPreviewDevice('desktop')}
                title="Desktop"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
                Desktop
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                title="Tablet"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${previewDevice === 'tablet' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/>
                </svg>
                Tablet
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                title="Гар утас"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/>
                </svg>
                Утас
              </button>
            </div>

            <a
              href={process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}
              target="_blank"
              className="group flex items-center gap-2 px-3 py-1.5 text-xs
                text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg"
            >
              <EyeIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              Шинэ цонхонд
            </a>
          </div>
        </div>

        {/* Device frame */}
        <div className={`transition-all duration-300 ${previewDevice === 'desktop' ? 'w-full' : 'mx-auto'}`}
          style={{
            width: previewDevice === 'mobile' ? '390px' : previewDevice === 'tablet' ? '768px' : '100%',
          }}
        >
          {(previewDevice === 'mobile' || previewDevice === 'tablet') && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 rounded-t-xl">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <span className="text-[10px] text-gray-400">
                {previewDevice === 'mobile' ? '390px — Гар утас' : '768px — Tablet'}
              </span>
              <div className="w-12" />
            </div>
          )}
          <div
            className={`border border-gray-200 overflow-hidden ${previewDevice !== 'desktop' ? 'border-t-0 rounded-b-xl' : ''}`}
            style={{ height: previewDevice === 'mobile' ? '720px' : '600px' }}
          >
            <iframe
              src={process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
