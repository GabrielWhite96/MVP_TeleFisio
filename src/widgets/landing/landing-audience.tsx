import { Home, Stethoscope, Users } from 'lucide-react'
import { LandingReveal } from '@/widgets/landing/landing-reveal'
import { pt } from '@/shared/config/i18n/pt'
import { cn } from '@/shared/lib/utils'

const audiences = [
  { icon: Stethoscope, title: pt.landing.audienceSoloTitle, body: pt.landing.audienceSoloBody, tone: 'landing-tone-teal' },
  { icon: Users, title: pt.landing.audienceClinicTitle, body: pt.landing.audienceClinicBody, tone: 'landing-tone-cyan' },
  { icon: Home, title: pt.landing.audienceHomeTitle, body: pt.landing.audienceHomeBody, tone: 'landing-tone-mint' },
] as const

export function LandingAudience() {
  return (
    <section id="para-quem" className="scroll-mt-28 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-4xl">
              {pt.landing.audienceTitle}
            </h2>
            <p className="mt-3 text-lg text-[var(--landing-ink-muted)]">{pt.landing.audienceSubtitle}</p>
          </div>

          <ul className="landing-stagger mt-10 grid gap-4 sm:grid-cols-3">
            {audiences.map(({ icon: Icon, title, body, tone }) => (
              <li key={title} className={cn('landing-glass-card rounded-2xl p-5', tone)}>
                <span className="landing-icon-well inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--landing-tone)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--landing-ink)]">{title}</h3>
                <p className="mt-2 text-[var(--landing-ink-muted)]">{body}</p>
              </li>
            ))}
          </ul>

          <div className="landing-glass mt-8 rounded-2xl p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-[var(--landing-ink)]">{pt.landing.audienceProblemTitle}</h3>
            <p className="mt-2 text-[var(--landing-ink-muted)]">{pt.landing.audienceProblemBody}</p>
          </div>
        </LandingReveal>
      </div>
    </section>
  )
}
