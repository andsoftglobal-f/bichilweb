import { logApiWarning } from '@/lib/apiError'
import { getApiBase } from '@/lib/apiBase'
import type { Locale } from '@/lib/i18n'
import FloatingMenuClient, {
  type CallButtonData,
  type FloatMenuItem,
  type SocialLink,
} from './FloatingMenuClient'

async function getMenuData(): Promise<FloatMenuItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/float-menu/`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    logApiWarning('Floating menu', error)
    return []
  }
}

async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const res = await fetch(`${getApiBase()}/float-menu-socials/`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.filter((s: SocialLink) => s.active)
  } catch (error) {
    logApiWarning('Floating menu social links', error)
    return []
  }
}

async function getCallButton(): Promise<{ callButton: CallButtonData | null; arrowColor: string }> {
  try {
    const res = await fetch(`${getApiBase()}/call-button/`, { next: { revalidate: 60 } })
    if (!res.ok) return { callButton: null, arrowColor: '#9ca3af' }
    const data = await res.json()
    return {
      callButton: data.active ? data : null,
      arrowColor: data.arrow_color || '#9ca3af',
    }
  } catch (error) {
    logApiWarning('Floating menu call button', error)
    return { callButton: null, arrowColor: '#9ca3af' }
  }
}

export default async function FloatingMenu({ locale }: { locale: Locale }) {
  const [menuData, socialLinks, { callButton, arrowColor }] = await Promise.all([
    getMenuData(),
    getSocialLinks(),
    getCallButton(),
  ])

  // Matches the original component's behavior: with no menu items and no
  // socials, nothing renders — even if a call button exists on its own.
  if (menuData.length === 0 && socialLinks.length === 0) return null

  return (
    <FloatingMenuClient
      menuData={menuData}
      socialLinks={socialLinks}
      callButton={callButton}
      arrowColor={arrowColor}
      locale={locale}
    />
  )
}
