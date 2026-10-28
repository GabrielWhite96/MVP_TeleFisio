import { Library } from 'lucide-react'
import { pt } from '@/shared/config/i18n/pt'

export function LandingTools() {
  return (
    <section
      id="ferramentas"
      className="scroll-mt-20 border-y border-[color-mix(in_oklab,var(--landing-ink)_10%,transparent)] bg-[color-mix(in_oklab,var(--landing-mist)_55%,var(--landing-paper))] py-16 sm:py-20"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-[var(--landing-teal)]">
            <Library className="h-4 w-4" aria-hidden />
            {pt.landing.toolsCount}
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-landing-display)] text-3xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-4xl">
            {pt.landing.toolsTitle}
          </h2>
          <p className="mt-3 text-lg text-[var(--landing-ink-muted)]">{pt.landing.toolsSubtitle}</p>
        </div>
        <p className="rounded-2xl border border-[color-mix(in_oklab,var(--landing-ink)_10%,transparent)] bg-[var(--landing-paper)] p-6 text-base leading-relaxed text-[var(--landing-ink)] sm:p-8 sm:text-lg">
          {pt.landing.toolsCategories}
        </p>
      </div>
    </section>
  )
}
