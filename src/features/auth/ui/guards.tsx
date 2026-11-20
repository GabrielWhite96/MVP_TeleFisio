import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/use-auth'
import { getDashboardRoute } from '../api/auth-api'
import { getPhysiotherapistByProfileId } from '@/entities/physiotherapist/api/physiotherapist-api'
import { canManagePractice, isPhysioHubPath } from '@/entities/physiotherapist/model/subscription-access'
import { queryKeys } from '@/shared/api/query-keys'
import { LoadingSpinner } from '@/shared/ui/states'
import type { UserRole } from '@/shared/types/database'
import { ROUTES } from '@/shared/config/routes'
import { isNativeUi } from '@/shared/native'
import { NativeAuthBootScreen } from '@/pages/auth/native-auth-layout'
import { isPasswordRecovery } from '../lib/password-recovery'

function AuthLoading() {
  if (isNativeUi()) return <NativeAuthBootScreen />
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  )
}

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoading />

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />
  }

  if (isPasswordRecovery() && location.pathname !== ROUTES.resetPassword) {
    return <Navigate to={ROUTES.resetPassword} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[]
  children?: ReactNode
}) {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    if (isNativeUi()) return <NativeAuthBootScreen />
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    if (isNativeUi()) {
      if (!profile) return <Navigate to={ROUTES.login} replace />
      return <Navigate to={getDashboardRoute(profile.role)} replace />
    }
    return <Navigate to={ROUTES.home} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export function GuestRoute({ children }: { children?: ReactNode }) {
  const { isAuthenticated, profile, isLoading } = useAuth()

  if (isLoading) return <AuthLoading />

  if (isAuthenticated && profile) {
    if (isPasswordRecovery()) {
      return <Navigate to={ROUTES.resetPassword} replace />
    }

    return <Navigate to={getDashboardRoute(profile.role)} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export function SubscriptionGuard({ children }: { children?: ReactNode }) {
  const { user, profile, isLoading } = useAuth()
  const location = useLocation()
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: profile?.role === 'physiotherapist' && !!user?.id,
  })

  if (profile?.role !== 'physiotherapist') {
    return children ? <>{children}</> : <Outlet />
  }

  if (isLoading || physioQuery.isLoading) {
    if (isNativeUi()) return <NativeAuthBootScreen />
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const active = physioQuery.data ? canManagePractice(physioQuery.data) : false
  if (active || isPhysioHubPath(location.pathname)) {
    return children ? <>{children}</> : <Outlet />
  }

  return <Navigate to={ROUTES.physio.dashboard} replace />
}
