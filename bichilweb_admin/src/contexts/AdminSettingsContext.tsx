'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface AdminSettings {
  logoUrl: string
  sidebarColor: string    // Цэсийн өнгө (sidebar background)
  accentColor: string     // Хуудасуудын товчнуудын өнгө (buttons/accent)
  menuLabels: Record<string, string>  // Цэсийн нэрс (key: default name, value: custom name)
}

const DEFAULT_SETTINGS: AdminSettings = {
  logoUrl: '',
  sidebarColor: '#0048BA',
  accentColor: '#00B2E7',
  menuLabels: {},
}

interface AdminSettingsContextType {
  settings: AdminSettings
  updateSettings: (partial: Partial<AdminSettings>) => void
  saving: boolean
}

const AdminSettingsContext = createContext<AdminSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  saving: false,
})

export function useAdminSettings() {
  return useContext(AdminSettingsContext)
}

// CSS custom properties-ийг шинэчлэх
function applyColorsToDOM(settings: AdminSettings) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  // Sidebar color
  root.style.setProperty('--admin-sidebar-color', settings.sidebarColor)
  // Accent / button color
  root.style.setProperty('--admin-accent-color', settings.accentColor)

  // Generate lighter/darker variants for accent
  const hex = settings.accentColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  root.style.setProperty('--admin-accent-rgb', `${r}, ${g}, ${b}`)

  // Sidebar color RGB
  const sHex = settings.sidebarColor.replace('#', '')
  const sr = parseInt(sHex.substring(0, 2), 16)
  const sg = parseInt(sHex.substring(2, 4), 16)
  const sb = parseInt(sHex.substring(4, 6), 16)
  root.style.setProperty('--admin-sidebar-rgb', `${sr}, ${sg}, ${sb}`)
}

const STORAGE_KEY = 'admin-settings'

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount — deferred deliberately: localStorage
  // doesn't exist during SSR, so this must run post-hydration, not during
  // the initial (server-matching) render.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const merged = { ...DEFAULT_SETTINGS, ...parsed }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings(merged)
        applyColorsToDOM(merged)
      }
    } catch {}

    // Also fetch logo from header-menu API
    fetch('/api/admin/header-menu')
      .then(res => res.json())
      .then(data => {
        if (data?.logo) {
          setSettings(prev => {
            // Only use DB logo if no custom logo set in localStorage
            const stored = localStorage.getItem(STORAGE_KEY)
            const storedLogo = stored ? JSON.parse(stored).logoUrl : ''
            if (!storedLogo) {
              const next = { ...prev, logoUrl: data.logo }
              applyColorsToDOM(next)
              return next
            }
            return prev
          })
        }
      })
      .catch(() => {})

    setLoaded(true)
  }, [])

  const updateSettings = useCallback((partial: Partial<AdminSettings>) => {
    setSaving(true)
    setSettings(prev => {
      const next = { ...prev, ...partial }
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      applyColorsToDOM(next)
      return next
    })
    // Simulate save delay
    setTimeout(() => setSaving(false), 300)
  }, [])

  // Apply colors on initial load
  useEffect(() => {
    if (loaded) {
      applyColorsToDOM(settings)
    }
  }, [loaded])

  return (
    <AdminSettingsContext.Provider value={{ settings, updateSettings, saving }}>
      {children}
    </AdminSettingsContext.Provider>
  )
}
