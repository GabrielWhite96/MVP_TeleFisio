import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/config/routes'
import { getWhatsAppUrl, WHATSAPP_DEMO_MESSAGE } from '@/shared/config/site'
import {
  trackDemoRequest,
  trackSubscribeClick,
  trackWhatsAppClick,
} from '@/shared/lib/analytics'

interface SubscribeCtaProps {
  placement: string
  className?: string
  children: ReactNode
}

export function SubscribeCtaLink({ placement, className, children }: SubscribeCtaProps) {
  return (
    <Link to={ROUTES.subscribe} className={className} onClick={() => trackSubscribeClick(placement)}>
      {children}
    </Link>
  )
}

export function DemoCtaLink({ placement, className, children }: SubscribeCtaProps) {
  const whatsapp = getWhatsAppUrl(WHATSAPP_DEMO_MESSAGE)

  if (whatsapp) {
    return (
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={() => {
          trackWhatsAppClick(placement)
          trackDemoRequest(placement, 'whatsapp')
        }}
      >
        {children}
      </a>
    )
  }

  return (
    <Link
      to={`${ROUTES.subscribe}?intent=demo`}
      className={className}
      onClick={() => trackDemoRequest(placement, 'subscribe_page')}
    >
      {children}
    </Link>
  )
}

export function WhatsAppCtaLink({ placement, className, children }: SubscribeCtaProps) {
  const whatsapp = getWhatsAppUrl(WHATSAPP_DEMO_MESSAGE)
  if (!whatsapp) return null

  return (
    <a
      href={whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        trackWhatsAppClick(placement)
        trackDemoRequest(placement, 'whatsapp')
      }}
    >
      {children}
    </a>
  )
}
