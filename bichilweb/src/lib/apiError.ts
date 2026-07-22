export function getApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Unknown API error'

  const maybeError = error as {
    code?: string
    message?: string
    response?: { status?: number; statusText?: string }
  }

  const status = maybeError.response?.status
  const statusText = maybeError.response?.statusText
  const message = maybeError.message || 'Request failed'

  return [status, statusText, message].filter(Boolean).join(' ')
}

export function logApiWarning(scope: string, error: unknown): void {
  if (process.env.NODE_ENV === 'production') return

  console.warn(`[API Warning] ${scope}: ${getApiErrorMessage(error)}`)
}
