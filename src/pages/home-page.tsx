import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getDashboardRoute } from '@/features/auth/api/auth-api'
import { LoadingSpinner } from '@/shared/ui/states'
import { ROUTES } from '@/shared/config/routes'

export function HomePage() {
  const { isAuthenticated, profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />
  }

  if (profile) {
    return <Navigate to={getDashboardRoute(profile.role)} replace />
  }

  return <Navigate to={ROUTES.login} replace />
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-[var(--color-muted-foreground)]">Página não encontrada</p>
      <a href="/" className="text-[var(--color-primary)] hover:underline">Voltar ao início</a>
    </div>
  )
}
