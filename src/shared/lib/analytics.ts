import { GA_MEASUREMENT_ID } from '@/shared/config/site'

type GtagCommand = 'js' | 'config' | 'event' | 'set' | 'consent'
type AnalyticsParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (command: GtagCommand, ...args: unknown[]) => void
  }
}

export const ANALYTICS_EVENTS = {
  pageView: 'page_view',
  subscribeClick: 'subscribe_click',
  demoRequest: 'demo_request',
  whatsappClick: 'whatsapp_click',
  generateLead: 'generate_lead',
  beginCheckout: 'begin_checkout',
  checkoutSuccess: 'purchase',
} as const

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
const LONG_TOKEN_RE = /\/[A-Za-z0-9_-]{20,}(?=\/|$)/g

export function sanitizeAnalyticsPath(pathname: string): string {
  return pathname.replace(UUID_RE, ':id').replace(LONG_TOKEN_RE, '/:id')
}

function gtag(command: GtagCommand, ...args: unknown[]) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag(command, ...args)
}

export function trackEvent(name: string, params?: AnalyticsParams) {
  gtag('event', name, params)
}

export function trackPageView(input: { path: string; title: string; location: string }) {
  const pagePath = sanitizeAnalyticsPath(input.path)
  gtag('event', ANALYTICS_EVENTS.pageView, {
    page_path: pagePath,
    page_title: input.title,
    page_location: input.location,
    send_to: GA_MEASUREMENT_ID,
  })
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: input.title,
    send_page_view: false,
  })
}

export function trackSubscribeClick(placement: string) {
  trackEvent(ANALYTICS_EVENTS.subscribeClick, { placement })
}

export function trackDemoRequest(placement: string, method: 'whatsapp' | 'subscribe_form' | 'subscribe_page' = 'subscribe_page') {
  trackEvent(ANALYTICS_EVENTS.demoRequest, { placement, method })
  trackEvent(ANALYTICS_EVENTS.generateLead, { placement, method })
}

export function trackWhatsAppClick(placement: string) {
  trackEvent(ANALYTICS_EVENTS.whatsappClick, {
    placement,
    method: 'whatsapp',
    transport_type: 'beacon',
  })
}

export function trackBeginCheckout() {
  trackEvent(ANALYTICS_EVENTS.beginCheckout, {
    currency: 'BRL',
    value: 29.9,
    items: 'Fisionotes Profissional',
  })
}

export function trackCheckoutSuccess() {
  trackEvent(ANALYTICS_EVENTS.checkoutSuccess, {
    currency: 'BRL',
    value: 29.9,
    transaction_id: 'saas_checkout',
  })
}
