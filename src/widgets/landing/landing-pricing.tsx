import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { ROUTES } from '@/shared/config/routes'
import { SAAS_PLAN } from '@/shared/config/saas-plan'
import { pt } from '@/shared/config/i18n/pt'

const bullets = [
  pt.landing.pricingBullet1,
  pt.landing.pricingBullet2,
  pt.landing.pricingBullet3,
] as const

export function LandingPricing() {
  return (
    <section
      id="assinatura"
      className="scroll-mt-20 border-y border-[color-mix(in_oklab,var(--landing-ink)_10%,transparent)] bg-[color-mix(in_oklab,var(--landing-mist)_40%,var(--landing-paper))] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-4xl">
            {pt.landing.pricingTitle}
          </h2>
          <p className="mt-3 text-lg text-[var(--landing-ink-muted)]">{pt.landing.pricingSubtitle}</p>
        </div>

        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-[color-mix(in_oklab,var(--landing-ink)_12%,transparent)] bg-[var(--landing-paper)] p-8 shadow-[0_20px_50px_-40px_rgba(15,50,60,0.5)]">
          <p className="text-sm font-medium text-[var(--landing-teal)]">{SAAS_PLAN.name}</p>
          <p className="mt-3 flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-landing-display)] text-5xl font-semibold text-[var(--landing-ink)]">
              {SAAS_PLAN.amountLabel}
            </span>
            <span className="text-[var(--landing-ink-muted)]">{pt.landing.pricingAmountSuffix}</span>
          </p>
          <ul className="mt-6 space-y-3">
            {bullets.map((item) => (
              <li key={item} className="flex gap-3 text-[var(--landing-ink)]">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-teal)]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 w-full bg-[var(--landing-teal)] text-white hover:opacity-90">
            <Link to={ROUTES.signup}>{pt.landing.pricingCta}</Link>
          </Button>
          <p className="mt-4 text-center text-sm text-[var(--landing-ink-muted)]">{pt.landing.pricingNote}</p>
        </div>
      </div>
    </section>
  )
}
