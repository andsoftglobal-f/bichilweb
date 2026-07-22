'use client'

export function readJsonCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = window.localStorage.getItem(key)
    return cached ? JSON.parse(cached) as T : null
  } catch {
    return null
  }
}

export function writeJsonCache(key: string, value: unknown) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Cache is best-effort only.
  }
}

export function removeJsonCache(key: string) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}
