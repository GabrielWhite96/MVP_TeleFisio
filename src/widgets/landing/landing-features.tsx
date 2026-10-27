import {
  CalendarDays,
  ClipboardList,
  Target,
  Dumbbell,
  HeartPulse,
  FileText,
  Wallet,
  Users,
} from 'lucide-react'
import { pt } from '@/shared/config/i18n/pt'

const features = [
  { icon: CalendarDays, title: pt.landing.featureAgendaTitle, body: pt.landing.featureAgendaBody },
  { icon: ClipboardList, title: pt.landing.featureChartTitle, body: pt.landing.featureChartBody },
  { icon: Target, title: pt.landing.featurePlanTitle, body: pt.landing.featurePlanBody },
  { icon: Dumbbell, title: pt.landing.featureExercisesTitle, body: pt.landing.featureExercisesBody },
  { icon: HeartPulse, title: pt.landing.featureCheckInTitle, body: pt.landing.featureCheckInBody },
  { icon: FileText, title: pt.landing.featureReportsTitle, body: pt.landing.featureReportsBody },
  { icon: Wallet, title: pt.landing.featureBillingTitle, body: pt.landing.featureBillingBody },
  { icon: Users, title: pt.landing.featurePortalTitle, body: pt.landing.featurePortalBody },
] as const

export function LandingFeatures() {
  return (
    <section id="funcionalidades" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-4xl">
            {pt.landing.featuresTitle}
          </h2>
          <p className="mt-3 text-lg text-[var(--landing-ink-muted)]">{pt.landing.featuresSubtitle}</p>
        </div>

        <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-2">
          {features.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4 border-t border-[color-mix(in_oklab,var(--landing-ink)_10%,transparent)] pt-6">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--landing-mist)] text-[var(--landing-teal)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-[var(--landing-ink)]">{title}</h3>
                <p className="mt-1.5 text-[var(--landing-ink-muted)]">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
