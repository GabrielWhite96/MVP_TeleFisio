import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'

export function LandingHero() {
  return (
    <section
      id="topo"
      className="relative overflow-hidden border-b border-[color-mix(in_oklab,var(--landing-ink)_10%,transparent)]"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--landing-cyan)_22%,transparent),transparent_55%),linear-gradient(160deg,var(--landing-paper),color-mix(in_oklab,var(--landing-mist)_70%,var(--landing-paper)))]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(color-mix(in_oklab,var(--landing-ink)_6%,transparent)_1px,transparent_1px)] [background-size:100%_28px]"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:py-24">
        <div className="landing-hero-copy max-w-xl">
          <p className="font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight text-[var(--landing-teal)] sm:text-5xl lg:text-6xl">
            {pt.landing.heroBrand}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-landing-display)] text-3xl font-semibold leading-[1.15] tracking-tight text-[var(--landing-ink)] sm:text-4xl">
            {pt.landing.heroTitle}
          </h1>
          <p className="mt-5 max-w-prose text-lg text-[var(--landing-ink-muted)]">
            {pt.landing.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-[var(--landing-teal)] text-white hover:opacity-90">
              <Link to={ROUTES.signup}>{pt.landing.heroPrimary}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-[var(--landing-ink)]/20">
              <Link to={ROUTES.login}>{pt.landing.heroSecondary}</Link>
            </Button>
          </div>
        </div>

        <aside
          className="landing-care-sheet relative rounded-2xl border border-[color-mix(in_oklab,var(--landing-ink)_12%,transparent)] bg-[color-mix(in_oklab,var(--landing-paper)_92%,white)] p-5 shadow-[0_24px_60px_-36px_rgba(15,50,60,0.45)] sm:p-6"
          aria-label={pt.landing.careLineTitle}
        >
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--landing-teal)]">
            {pt.landing.careLineTitle}
          </p>
          <ol className="mt-5 space-y-0">
            {[
              pt.landing.careStepComplaint,
              pt.landing.careStepPlan,
              pt.landing.careStepSession,
              pt.landing.careStepCheckIn,
            ].map((step, index, list) => (
              <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                {index < list.length - 1 && (
                  <span
                    className="absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-px bg-[color-mix(in_oklab,var(--landing-teal)_35%,transparent)]"
                    aria-hidden
                  />
                )}
                <span className="landing-care-dot relative z-[1] mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--landing-teal)] bg-[var(--landing-mist)] text-xs font-semibold text-[var(--landing-teal)]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 rounded-lg border border-[color-mix(in_oklab,var(--landing-ink)_8%,transparent)] bg-white/70 px-3 py-2.5">
                  <p className="font-medium text-[var(--landing-ink)]">{step}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--landing-mist)]">
                    <div
                      className="landing-care-bar h-full rounded-full bg-[var(--landing-cyan)]"
                      style={{ width: `${35 + index * 18}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  )
}
