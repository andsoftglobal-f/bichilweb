'use server'

import { cookies } from 'next/headers'
import { LOCALE_COOKIE, type Locale } from '@/lib/i18n'

/**
 * Sets the visitor's locale cookie. Called from Header.tsx's language
 * toggle and from its one-time localStorage migration shim. Not httpOnly —
 * this is a UI preference, not sensitive, and the migration shim needs to
 * read its presence client-side via document.cookie.
 */
export async function setLocale(locale: Locale): Promise<void> {
  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}
