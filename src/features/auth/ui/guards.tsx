import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { LoadingSpinner } from '@/shared/ui/states'
import type { UserRole } from '@/shared/types/database'
import { ROUTES } from '@/shared/config/routes'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[]
  children: React.ReactNode
}) {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <>{children}</>
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (isAuthenticated && profile) {
    const routes: Record<UserRole, string> = {
      patient: ROUTES.patient.dashboard,
      physiotherapist: ROUTES.physio.dashboard,
      admin: ROUTES.admin.dashboard,
      caregiver: ROUTES.caregiver.dashboard,
    }
    return <Navigate to={routes[profile.role]} replace />
  }

  return <>{children}</>
}
