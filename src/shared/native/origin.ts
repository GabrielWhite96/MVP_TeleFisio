import { getSiteUrl } from '@/shared/config/site'
import { isNativeApp } from './platform'

/**
 * Canonical public origin for emails, invites, Stripe return URLs and OAuth.
 * Native shells always use the public site URL (never capacitor:// or https://localhost).
 * Local web keeps window.location.origin so auth redirects still work in development.
 */
export function getPublicOrigin(): string {
  if (isNativeApp()) return getSiteUrl()

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.origin
    }
  }

  return getSiteUrl()
}

export function buildPublicUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getPublicOrigin()}${normalized}`
}
