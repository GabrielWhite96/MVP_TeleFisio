import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'

export function LandingFooter() {
  return (
    <footer className="border-t border-[color-mix(in_oklab,var(--landing-ink)_12%,transparent)] bg-[var(--landing-ink)] text-[color-mix(in_oklab,white_86%,transparent)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-[var(--landing-cyan)]" aria-hidden />
            <span className="font-[family-name:var(--font-landing-display)] text-lg font-semibold">
              {pt.landing.footerRights}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">{pt.landing.footerTagline}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link to={ROUTES.login} className="hover:text-white hover:underline">
            {pt.landing.footerLogin}
          </Link>
          <Link to={ROUTES.signup} className="hover:text-white hover:underline">
            {pt.landing.footerSignup}
          </Link>
        </div>
      </div>
    </footer>
  )
}
