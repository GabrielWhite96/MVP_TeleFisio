import { App, type URLOpenListenerEvent } from '@capacitor/app'
import { DEFAULT_SITE_URL, getSiteUrl } from '@/shared/config/site'
import { isNativeApp } from './platform'

type NavigateHandler = (to: string) => void

let navigateHandler: NavigateHandler | null = null
let listenerReady: Promise<void> | null = null

const APP_HOSTS = new Set([
  'fisionotes.com.br',
  'www.fisionotes.com.br',
  'tele-fisio.netlify.app',
])

export function registerDeepLinkNavigator(handler: NavigateHandler | null) {
  navigateHandler = handler
}

/** Convert an absolute deep-link URL into an in-app router path (pathname + search + hash). */
export function pathFromDeepLinkUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  try {
    if (trimmed.startsWith('/')) {
      return trimmed
    }

    const url = new URL(trimmed)

    if (url.protocol === 'fisionotes:') {
      // fisionotes://auth/login → host=auth, pathname=/login
      // fisionotes:///auth/login → host empty, pathname=/auth/login
      const hostPart = url.host ? `/${url.host}` : ''
      const pathPart = url.pathname && url.pathname !== '/' ? url.pathname : ''
      const combined = `${hostPart}${pathPart}` || '/'
      return `${combined.startsWith('/') ? combined : `/${combined}`}${url.search}${url.hash}`
    }

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      const siteHost = new URL(getSiteUrl() || DEFAULT_SITE_URL).hostname
      if (!APP_HOSTS.has(url.hostname) && url.hostname !== siteHost) {
        return null
      }
      return `${url.pathname}${url.search}${url.hash}` || '/'
    }
  } catch {
    return null
  }

  return null
}

export function navigateFromDeepLinkUrl(rawUrl: string): boolean {
  const path = pathFromDeepLinkUrl(rawUrl)
  if (!path || !navigateHandler) return false
  navigateHandler(path)
  return true
}

async function handleOpenUrl(event: URLOpenListenerEvent) {
  navigateFromDeepLinkUrl(event.url)
}

/** Subscribe to Capacitor App URL opens (Universal Links / App Links / custom scheme). */
export function startDeepLinkListener(): Promise<void> {
  if (!isNativeApp()) return Promise.resolve()
  if (listenerReady) return listenerReady

  listenerReady = (async () => {
    await App.addListener('appUrlOpen', handleOpenUrl)

    const launch = await App.getLaunchUrl().catch(() => undefined)
    if (launch?.url) {
      navigateFromDeepLinkUrl(launch.url)
    }
  })()

  return listenerReady
}
