import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { BrandMark } from '@/shared/ui/brand'
import { DemoCtaLink, SubscribeCtaLink, WhatsAppCtaLink } from '@/widgets/landing/tracked-cta'

const exploreLinks = [
  { to: ROUTES.seo.sistema, label: 'Sistema para fisioterapeutas' },
  { to: ROUTES.seo.clinicas, label: 'Software para clínicas' },
  { to: ROUTES.seo.prontuario, label: 'Prontuário eletrônico' },
  { to: ROUTES.seo.ferramentas, label: 'Ferramentas clínicas' },
] as const

export function LandingFooter() {
  return (
    <footer className="landing-footer relative overflow-hidden border-t border-[color-mix(in_oklab,var(--landing-cyan)_28%,transparent)] text-[color-mix(in_oklab,white_86%,transparent)]">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="landing-glass-dark flex flex-col gap-8 rounded-2xl px-5 py-8 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-md">
              <BrandMark layout="horizontal" size="md" tone="onDark" />
              <p className="mt-3 text-sm leading-relaxed">{pt.landing.footerTagline}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{pt.landing.footerExplore}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {exploreLinks.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors duration-150 ease-[var(--ease-out)] hover:text-white hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to={ROUTES.login} className="transition-colors duration-150 ease-[var(--ease-out)] hover:text-white hover:underline">
              {pt.landing.footerLogin}
            </Link>
            <SubscribeCtaLink
              placement="footer"
              className="transition-colors duration-150 ease-[var(--ease-out)] hover:text-white hover:underline"
            >
              {pt.landing.footerSignup}
            </SubscribeCtaLink>
            <DemoCtaLink
              placement="footer"
              className="transition-colors duration-150 ease-[var(--ease-out)] hover:text-white hover:underline"
            >
              {pt.landing.footerDemo}
            </DemoCtaLink>
            <WhatsAppCtaLink
              placement="footer"
              className="transition-colors duration-150 ease-[var(--ease-out)] hover:text-white hover:underline"
            >
              {pt.landing.footerWhatsApp}
            </WhatsAppCtaLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
