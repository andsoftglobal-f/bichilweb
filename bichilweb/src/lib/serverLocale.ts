import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './i18n'

/**
 * Resolves the visitor's locale from the `locale` cookie. Server Components
 * call this directly (layout and each page independently — cheap, and
 * memoized per-request via React's cache() so repeated calls cost nothing).
 * Client Components never call this — they receive `locale` as a prop from
 * their nearest Server Component ancestor.
 *
 * Defaults to 'mn' when the cookie is absent, matching the pre-cookie
 * behavior exactly so first-time visitors see identical output.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
})
