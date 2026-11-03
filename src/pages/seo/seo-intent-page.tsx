import { Link } from 'react-router-dom'
import { buttonVariants } from '@/shared/ui/button'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { BrandMark } from '@/shared/ui/brand'
import { cn } from '@/shared/lib/utils'
import { DemoCtaLink, SubscribeCtaLink } from '@/widgets/landing/tracked-cta'
import { LandingFooter } from '@/widgets/landing/landing-footer'

type SeoIntentKey = 'sistema' | 'clinicas' | 'prontuario' | 'ferramentas'

const INTENT_KEYS: SeoIntentKey[] = ['sistema', 'clinicas', 'prontuario', 'ferramentas']

export function SeoIntentPage({ intent }: { intent: SeoIntentKey }) {
  const page = pt.seoPages[intent]
  const related = INTENT_KEYS.filter((key) => key !== intent).map((key) => pt.seoPages[key])

  return (
    <div className="landing-root min-h-screen bg-[var(--landing-paper)] font-[family-name:var(--font-landing-sans)] text-[var(--landing-ink)] antialiased">
      <a
        href="#conteudo"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:m-0 focus:inline-flex focus:h-auto focus:w-auto focus:overflow-visible focus:whitespace-normal focus:rounded-md focus:bg-[var(--landing-teal)] focus:px-4 focus:py-2 focus:text-white"
      >
        {pt.landing.skipToContent}
      </a>

      <header className="border-b border-[color-mix(in_oklab,var(--landing-teal)_14%,transparent)] bg-[color-mix(in_oklab,var(--landing-paper)_92%,white)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to={ROUTES.home} className="min-w-0">
            <BrandMark layout="horizontal" size="md" className="max-h-9" />
          </Link>
          <Link
            to={ROUTES.home}
            className="text-sm font-medium text-[var(--landing-ink-muted)] transition-colors hover:text-[var(--landing-ink)]"
          >
            {pt.seoPages.backHome}
          </Link>
        </div>
      </header>

      <main id="conteudo" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-[family-name:var(--font-landing-display)] text-3xl font-semibold leading-tight tracking-tight text-[var(--landing-ink)] sm:text-4xl">
          {page.h1}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-[var(--landing-ink-muted)]">{page.intro}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <SubscribeCtaLink
            placement={`seo-${intent}`}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'landing-cta landing-cta-primary bg-[var(--landing-teal)] text-white hover:opacity-90'
            )}
          >
            {pt.seoPages.ctaTrial}
          </SubscribeCtaLink>
          <DemoCtaLink
            placement={`seo-${intent}`}
            className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'landing-cta border-white/50 bg-white/40')}
          >
            {pt.seoPages.ctaDemo}
          </DemoCtaLink>
        </div>

        <div className="mt-12 space-y-10">
          {page.sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-[family-name:var(--font-landing-display)] text-2xl font-semibold tracking-tight text-[var(--landing-ink)]">
                {section.title}
              </h2>
              <p className="mt-3 leading-relaxed text-[var(--landing-ink-muted)]">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-14 border-t border-[color-mix(in_oklab,var(--landing-teal)_14%,transparent)] pt-10">
          <h2 className="font-[family-name:var(--font-landing-display)] text-2xl font-semibold tracking-tight text-[var(--landing-ink)]">
            {pt.seoPages.relatedTitle}
          </h2>
          <ul className="mt-4 space-y-2">
            {related.map((item) => (
              <li key={item.path}>
                <Link to={item.path} className="font-medium text-[var(--landing-teal)] underline-offset-4 hover:underline">
                  {item.h1}
                </Link>
              </li>
            ))}
            <li>
              <Link to={ROUTES.home} className="font-medium text-[var(--landing-teal)] underline-offset-4 hover:underline">
                {pt.landing.heroTitle}
              </Link>
            </li>
          </ul>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}

export function SistemaParaFisioterapeutasPage() {
  return <SeoIntentPage intent="sistema" />
}

export function SoftwareClinicasPage() {
  return <SeoIntentPage intent="clinicas" />
}

export function ProntuarioEletronicoPage() {
  return <SeoIntentPage intent="prontuario" />
}

export function FerramentasFisioterapeutasPage() {
  return <SeoIntentPage intent="ferramentas" />
}
