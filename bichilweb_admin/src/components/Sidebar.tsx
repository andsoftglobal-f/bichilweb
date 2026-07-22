'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  HomeIcon,
  CurrencyDollarIcon,
  CubeIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  NewspaperIcon,
  RectangleStackIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  CalculatorIcon,
  MegaphoneIcon,
  UsersIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'
import {axiosInstance} from '@/lib/axios'
import { useAdminSettings } from '@/contexts/AdminSettingsContext'
import { useAuth } from '@/contexts/AuthContext'

interface ProductTranslation {
  id: number
  language: number
  label: string
}

interface Product {
  id: number
  product_type: number
  translations: ProductTranslation[]
}

interface ServiceTranslation {
  id: number
  language: number
  title: string
  description: string | null
}

interface Service {
  id: number
  translations: ServiceTranslation[]
  cards: any[]
  collaterals: any[]
  conditions: any[]
  documents: any[]
}

const staticNavigation = [
  { name: 'Хянах самбар', href: '/', icon: HomeIcon },
  {
    name: 'Сайтын бүтэц',
    icon: RectangleStackIcon,
    children: [
      { name: 'Толгой хэсэг', href: '/admin/header' },
      { name: 'Баннер слайдер', href: '/admin/hero' },
      { name: 'CTA слайдер', href: '/admin/cta' },
      { name: 'Хөвөгч цэс', href: '/admin/floating-menu' },
      { name: 'Хөл хэсэг', href: '/admin/footer' },
      { name: 'Апп татах', href: '/admin/app-download' },
      { name: 'Хамтрагчид', href: '/admin/partners' },
      { name: 'Үзүүлэлтүүд', href: '/admin/stats' },
      { name: 'Бүтээгдэхүүний заавар', href: '/admin/product-tutorials' },
      { name: 'Хуудас холбох', href: '/admin/page-links' },
    ],
  },
  {
    name: 'Байгууллага',
    icon: BuildingOfficeIcon,
    children: [
      { name: 'Бидний тухай', href: '/admin/about' },
      { name: 'Салбарууд', href: '/admin/branches' },
    ],
  },
  { name: 'Мэдээ нийтлэл', href: '/admin/news', icon: NewspaperIcon },
  { name: 'Зар', href: '/admin/ads', icon: MegaphoneIcon },
  { name: 'Хуудас удирдах', href: '/admin/pages', icon: DocumentDuplicateIcon },
  {
    name: 'Хүний нөөц',
    icon: UserGroupIcon,
    children: [
      { name: 'HR Тохиргоо', href: '/admin/hr' },
      { name: 'CV Өргөдлүүд', href: '/admin/cv-applications' },
    ],
  },
  {
    name: 'Санхүү',
    icon: CurrencyDollarIcon,
    children: [
      { name: 'Валютын ханш', href: '/admin/rates' },
    ],
  },
  {
    name: 'Хэрэглэгдэхүүн',
    icon: CurrencyDollarIcon,
    children: [{ name: 'Мэдээлэл', href: '/admin/utilities' }],
  },
  {
    name: 'Тохиргоо',
    icon: Cog6ToothIcon,
    children: [
      { name: 'Лого', href: '/admin/config?tab=logo' },
      { name: 'Өнгө', href: '/admin/config?tab=color' },
      { name: 'Цэс тохиргоо', href: '/admin/config?tab=menu' },
    ],
  },
]

function getProductLabel(product: Product): string {
  try {
    const translations = Array.isArray(product?.translations) ? product.translations : []
    const mn = translations.find((t) => t.language === 2)
    const en = translations.find((t) => t.language === 1)
    return mn?.label || en?.label || `Бүтээгдэхүүн #${product?.id || '?'}`
  } catch {
    return `Бүтээгдэхүүн #${product?.id || '?'}`
  }
}

function getServiceTitle(service: Service): string {
  try {
    const translations = Array.isArray(service?.translations) ? service.translations : []
    const mn = translations.find((t) => t.language === 2)
    const en = translations.find((t) => t.language === 1)
    return mn?.title || en?.title || `Үйлчилгээ #${service?.id || '?'}`
  } catch {
    return `Үйлчилгээ #${service?.id || '?'}`
  }
}

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as any).results)) return (data as any).results
  return []
}

export default function Sidebar() {
  const pathname = usePathname()
  const { settings } = useAdminSettings()
  const { user, logout } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingServices, setLoadingServices] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get('/product/')
        const raw = response.data
        setProducts(safeArray<Product>(raw))
      } catch (error) {
        console.error('Бүтээгдэхүүн татахад алдаа гарлаа:', error)
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axiosInstance.get('/services/')
        const raw = response.data
        setServices(safeArray<Service>(raw))
      } catch (error) {
        console.error('Үйлчилгээ татахад алдаа гарлаа:', error)
      } finally {
        setLoadingServices(false)
      }
    }
    fetchServices()
  }, [])

  let productChildren: { name: string; href: string }[] = [
    { name: 'Бүтээгдхүүн удирдлага', href: '/admin/products-setting' },
    { name: 'Бүтээгдхүүн нэмэх', href: '/admin/product-add' },
    { name: 'Баннер', href: '/admin/product-banner' },
  ]
  try {
    productChildren = [
      ...productChildren,
      ...safeArray<Product>(products).map((product) => ({
        name: getProductLabel(product),
        href: `/admin/products/${product.id}`,
      })),
    ]
  } catch (e) {
    console.error('Product nav build error:', e)
  }

  const productNavItem = {
    name: 'Бүтээгдэхүүн',
    icon: CubeIcon,
    children: productChildren,
  }

  let serviceChildren: { name: string; href: string }[] = [
    { name: 'Үйлчилгээ нэмэх', href: '/admin/service-add' },
  ]
  try {
    serviceChildren = [
      ...serviceChildren,
      ...safeArray<Service>(services).map((service) => ({
        name: getServiceTitle(service),
        href: `/admin/services/${service.id}`,
      })),
    ]
  } catch (e) {
    console.error('Service nav build error:', e)
  }

  const serviceNavItem = {
    name: 'Үйлчилгээ',
    icon: BriefcaseIcon,
    children: serviceChildren,
  }

const navigation = [
    staticNavigation[0],  // Хянах самбар
    staticNavigation[1],  // Сайтын бүтэц
    productNavItem,       // Бүтээгдэхүүн
    serviceNavItem,       // Үйлчилгээ
    staticNavigation[8],  // Хэрэглэгдэхүүн (Индекс 8 болсон)
    staticNavigation[2],  // Байгууллага
    staticNavigation[3],  // Мэдээ нийтлэл
    staticNavigation[4],  // Зар (Шинээр нэмэгдсэн тул индекс 4)
    staticNavigation[5],  // Хуудас удирдах (Индекс 5 болсон)
    staticNavigation[6],  // Хүний нөөц (Индекс 6 болсон)
    staticNavigation[7],  // Санхүү (Индекс 7 болсон)
    staticNavigation[9],  // Тохиргоо (Индекс 9 болсон - ЭНЭ ХЭСЭГТ АНХААРНА УУ)
    { name: 'Зээлийн хүсэлт', href: '/admin/loan-requests', icon: ClipboardDocumentListIcon },
    { name: 'Зээлийн тооцоолуур', href: '/admin/calculator', icon: CalculatorIcon },
  ]

  // Хэрэглэгч, эрхийн удирдлага — зөвхөн Super Admin-д харагдана
  if (user?.is_superuser) {
    navigation.push(
      { name: 'Хэрэглэгчид', href: '/admin/users', icon: UsersIcon },
      { name: 'Эрхийн түвшин', href: '/admin/roles', icon: KeyIcon },
    )
  }

  // Цэсийн нэрсийг menuLabels-аар солих
  const menuLabels = settings.menuLabels || {}
  const getLabel = (defaultName: string) => menuLabels[defaultName] || defaultName

  const getInitialExpanded = () => {
    const expanded: string[] = []
    navigation.forEach((item) => {
      if ('children' in item && item.children) {
        const match = item.children.some((child) =>
          pathname?.startsWith(child.href.split('?')[0])
        )
        if (match) expanded.push(item.name)
      }
    })
    return expanded
  }

  const [expandedItems, setExpandedItems] = useState<string[]>(getInitialExpanded)

  // pathname өөрчлөгдөхөд тухайн цэсийг нээлттэй байлгах
  useEffect(() => {
    const needed = getInitialExpanded()
    setExpandedItems((prev) => {
      const merged = new Set([...prev, ...needed])
      return Array.from(merged)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    )
  }

  return (
    <div className="flex h-full w-64 flex-col px-3 py-4" style={{ background: settings.sidebarColor }}>
      <div className="mb-6 flex items-center justify-center px-3 py-2">
        {settings.logoUrl ? (
          <Image
            src={settings.logoUrl}
            alt="Logo"
            width={160}
            height={40}
            className="h-10 w-auto object-contain"
            unoptimized
          />
        ) : (
          <div className="h-8 w-8 rounded-lg" style={{ background: settings.accentColor }} />
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const hasChildren = 'children' in item && item.children
          const isExpanded = expandedItems.includes(item.name)
          const isActive = 'href' in item && item.href
            ? pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href))
            : hasChildren &&
              item.children?.some((child) => pathname?.startsWith(child.href.split('?')[0]))

          const isLoadingItem = 
            (item.name === 'Бүтээгдэхүүн' && loadingProducts) ||
            (item.name === 'Үйлчилгээ' && loadingServices)

          return (
            <div key={item.name}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white border-l-2 border-white/60'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{getLabel(item.name)}</span>
                      {isLoadingItem && (
                        <svg
                          className="h-3 w-3 animate-spin text-white/60"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      )}
                    </div>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
                      {item.children.map((child) => {
                        const childPath = child.href.split('?')[0]
                        const isChildActive = pathname?.startsWith(childPath)
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`block rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                              isChildActive
                                ? 'bg-white/20 text-white font-medium'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {getLabel(child.name)}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href!}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white border-l-2 border-white/60'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{getLabel(item.name)}</span>
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="mt-4 border-t border-white/20 pt-4">
        {user && (
          <div className="px-3 pb-2">
            <p className="text-sm font-medium text-white truncate">{user.username}</p>
            <p className="text-xs text-white/50 truncate">
              {user.is_superuser ? 'Super Admin' : user.groups.map((g) => g.name).join(', ') || 'Эрхгүй'}
            </p>
          </div>
        )}
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span>Гарах</span>
        </button>
      </div>
    </div>
  )
}
