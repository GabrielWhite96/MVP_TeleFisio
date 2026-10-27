import { AlertTriangle, GitCompareArrows, ChartNoAxesColumn, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'

const benefits = [
  { icon: AlertTriangle, title: pt.landing.benefitRiskTitle, body: pt.landing.benefitRiskBody },
  { icon: GitCompareArrows, title: pt.landing.benefitCompareTitle, body: pt.landing.benefitCompareBody },
  { icon: ChartNoAxesColumn, title: pt.landing.benefitAdhereTitle, body: pt.landing.benefitAdhereBody },
  { icon: Smartphone, title: pt.landing.benefitPwaTitle, body: pt.landing.benefitPwaBody },
] as const

export function LandingBenefits() {
  return (
    <section id="vantagens" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-4xl">
            {pt.landing.benefitsTitle}
          </h2>
          <p className="mt-3 text-lg text-[var(--landing-ink-muted)]">{pt.landing.benefitsSubtitle}</p>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {benefits.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-2xl border border-[color-mix(in_oklab,var(--landing-ink)_10%,transparent)] bg-[color-mix(in_oklab,var(--landing-paper)_80%,white)] p-6"
            >
              <Icon className="h-6 w-6 text-[var(--landing-teal)]" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-[var(--landing-ink)]">{title}</h3>
              <p className="mt-2 text-[var(--landing-ink-muted)]">{body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-14 rounded-2xl bg-[var(--landing-ink)] px-6 py-10 text-center sm:px-10">
          <h3 className="font-[family-name:var(--font-landing-display)] text-2xl font-semibold text-white sm:text-3xl">
            {pt.landing.midCtaTitle}
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-[color-mix(in_oklab,white_78%,transparent)]">
            {pt.landing.midCtaBody}
          </p>
          <Button asChild size="lg" className="mt-6 bg-[var(--landing-cyan)] text-[var(--landing-ink)] hover:opacity-90">
            <Link to={ROUTES.signup}>{pt.landing.midCtaButton}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
