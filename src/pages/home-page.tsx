import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getDashboardRoute } from '@/features/auth/api/auth-api'
import { LandingPage } from '@/pages/landing/landing-page'
import { NativeAuthBootScreen } from '@/pages/auth/native-auth-layout'
import { isNativeUi } from '@/shared/native'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'

export function HomePage() {
  const { isAuthenticated, profile, isLoading } = useAuth()

  if (isLoading && isNativeUi()) {
    return <NativeAuthBootScreen />
  }

  if (isAuthenticated && profile) {
    return <Navigate to={getDashboardRoute(profile.role)} replace />
  }

  if (isNativeUi()) {
    return <Navigate to={ROUTES.login} replace />
  }

  return <LandingPage />
}

export function NotFoundPage() {
  const homeHref = isNativeUi() ? ROUTES.login : ROUTES.home
  const homeLabel = isNativeUi() ? pt.auth.login : 'Voltar ao início'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-[var(--color-muted-foreground)]">Página não encontrada</p>
      <Link to={homeHref} className="text-[var(--color-primary)] hover:underline">
        {homeLabel}
      </Link>
    </div>
  )
}
