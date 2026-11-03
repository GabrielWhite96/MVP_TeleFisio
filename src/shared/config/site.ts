import { BRAND_NAME } from './brand'

export const DEFAULT_SITE_URL = 'https://fisionotes.com.br'
export const GA_MEASUREMENT_ID = 'G-V45DLTPDXD'
export const SITE_LOCALE = 'pt_BR'

export const SEO_TITLE = `${BRAND_NAME} | Sistema para Fisioterapeutas — Agenda, Prontuário e Gestão`
export const SEO_DESCRIPTION =
  'Sistema para fisioterapeutas com agenda, prontuário eletrônico, gestão de pacientes e financeiro. Software para clínicas e consultórios de fisioterapia. Comece com 7 dias grátis.'
export const SEO_KEYWORDS = [
  'sistema para fisioterapeutas',
  'software para clínicas de fisioterapia',
  'sistema de gestão para fisioterapia',
  'prontuário eletrônico para fisioterapeutas',
  'agenda para fisioterapeutas',
  'gestão de pacientes de fisioterapia',
  'ferramentas para fisioterapeutas',
  'software para consultório de fisioterapia',
  'Fisionotes',
] as const

export const OG_IMAGE_PATH = '/og-image.png'
export const OG_IMAGE_ALT = `${BRAND_NAME} — sistema para fisioterapeutas`
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export const WHATSAPP_DEMO_MESSAGE =
  'Olá! Quero uma demonstração do Fisionotes, sistema para fisioterapeutas.'

function readPublicEnv(key: 'VITE_SITE_URL' | 'VITE_WHATSAPP_PHONE'): string {
  const value = import.meta.env?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function getSiteUrl(): string {
  const fromEnv = readPublicEnv('VITE_SITE_URL')
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return DEFAULT_SITE_URL
}

export function getCanonicalUrl(path = '/'): string {
  const normalized = path === '/' ? '/' : path.replace(/\/$/, '')
  return `${getSiteUrl()}${normalized}`
}

export function getOgImageUrl(): string {
  return `${getSiteUrl()}${OG_IMAGE_PATH}`
}

export function getWhatsAppPhone(): string {
  return readPublicEnv('VITE_WHATSAPP_PHONE').replace(/\D/g, '')
}

export function getWhatsAppUrl(message = WHATSAPP_DEMO_MESSAGE): string | null {
  const phone = getWhatsAppPhone()
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
