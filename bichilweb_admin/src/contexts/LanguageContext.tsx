'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'mn' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (mn: string, en: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('mn')

  useEffect(() => {
    // Deferred to after mount deliberately: localStorage doesn't exist
    // during SSR, and the page is server-rendered with the 'mn' default
    // (matching <html lang="mn"> in the root layout) — reading the saved
    // language during the initial render would mismatch the server HTML
    // whenever the stored preference is 'en'.
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'mn' || saved === 'en')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (mn: string, en: string) => {
    return language === 'mn' ? mn : en
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
