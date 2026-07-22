/**
 * Locale primitives shared by Server and Client Components alike. No
 * 'use client' and no 'server-only' guard here on purpose — this file must
 * be importable from both. Reading/writing the cookie itself lives in
 * src/lib/serverLocale.ts (server) and src/actions/locale.ts (server
 * action), not here.
 */

export type Locale = 'mn' | 'en'

export const DEFAULT_LOCALE: Locale = 'mn'

export const LOCALE_COOKIE = 'locale'

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'mn' || value === 'en'
}

export function t(locale: Locale, mn: string, en: string): string {
  return locale === 'mn' ? mn : en
}
