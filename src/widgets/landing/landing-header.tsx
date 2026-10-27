import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Menu, X } from 'lucide-react'
import { Button, buttonVariants } from '@/shared/ui/button'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { cn } from '@/shared/lib/utils'

const anchors = [
  { href: '#funcionalidades', label: pt.landing.navFeatures },
  { href: '#ferramentas', label: pt.landing.navTools },
  { href: '#vantagens', label: pt.landing.navBenefits },
  { href: '#assinatura', label: pt.landing.navPricing },
  { href: '#faq', label: pt.landing.navFaq },
] as const

export function LandingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="landing-header sticky top-0 z-40 border-b border-[color-mix(in_oklab,var(--landing-ink)_12%,transparent)] bg-[color-mix(in_oklab,var(--landing-paper)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#topo" className="flex items-center gap-2 text-[var(--landing-ink)]">
          <Activity className="h-6 w-6 text-[var(--landing-teal)]" aria-hidden />
          <span className="font-[family-name:var(--font-landing-display)] text-xl font-semibold tracking-tight">
            {pt.landing.heroBrand}
          </span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Seções">
          {anchors.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--landing-ink-muted)] transition-colors hover:text-[var(--landing-ink)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            to={ROUTES.login}
            className={cn(buttonVariants({ variant: 'ghost' }), 'text-[var(--landing-ink)]')}
          >
            {pt.landing.login}
          </Link>
          <Link
            to={ROUTES.signup}
            className={cn(buttonVariants(), 'bg-[var(--landing-teal)] text-white hover:opacity-90')}
          >
            {pt.landing.signup}
          </Link>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="landing-mobile-nav"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div
        id="landing-mobile-nav"
        className={cn(
          'border-t border-[color-mix(in_oklab,var(--landing-ink)_10%,transparent)] bg-[var(--landing-paper)] px-4 py-4 lg:hidden',
          open ? 'block' : 'hidden'
        )}
      >
        <nav className="flex flex-col gap-2" aria-label="Seções mobile">
          {anchors.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-3 text-base font-medium text-[var(--landing-ink)] hover:bg-[var(--landing-mist)]"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-4 flex flex-col gap-2 sm:hidden">
          <Link to={ROUTES.login} className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
            {pt.landing.login}
          </Link>
          <Link
            to={ROUTES.signup}
            className={cn(buttonVariants(), 'w-full bg-[var(--landing-teal)] text-white hover:opacity-90')}
          >
            {pt.landing.signup}
          </Link>
        </div>
      </div>
    </header>
  )
}
