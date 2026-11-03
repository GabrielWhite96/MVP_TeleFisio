import { BRAND_NAME } from './brand'

export const DEFAULT_SITE_URL = 'https://fisionotes.com.br'
export const GA_MEASUREMENT_ID = 'G-V45DLTPDXD'
export const SITE_LOCALE = 'pt_BR'

export const SEO_TITLE = `${BRAND_NAME} | Sistema de organização para fisioterapeutas`
export const SEO_DESCRIPTION =
  'Fisionotes é o sistema de organização para fisioterapeutas: agenda, prontuário, financeiro e portal do paciente. Software para fisios organizarem pacientes e tratamentos.'
export const SEO_KEYWORDS = [
  'sistema de organização para fisioterapeutas',
  'software para fisioterapeutas',
  'agenda para fisioterapeutas',
  'prontuário eletrônico fisioterapia',
  'organização para fisioterapeutas',
  'tele-fisioterapia',
  'Fisionotes',
] as const

export const OG_IMAGE_PATH = '/og-image.png'
export const OG_IMAGE_ALT = `${BRAND_NAME} — sistema de organização para fisioterapeutas`
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export const WHATSAPP_DEMO_MESSAGE =
  'Olá! Quero uma demonstração do Fisionotes, sistema de organização para fisioterapeutas.'

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

