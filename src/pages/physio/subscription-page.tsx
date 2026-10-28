import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Activity, Check } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { signOut } from '@/features/auth/api/auth-api'
import { getPhysiotherapistByProfileId } from '@/entities/physiotherapist/api/physiotherapist-api'
import { startSaasCheckout } from '@/entities/physiotherapist/api/saas-checkout-api'
import { canManagePractice } from '@/entities/physiotherapist/model/subscription-access'
import { queryKeys } from '@/shared/api/query-keys'
import { SAAS_PLAN } from '@/shared/config/saas-plan'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { LoadingSpinner } from '@/shared/ui/states'

const planBullets = [
  pt.landing.pricingBullet1,
  pt.landing.pricingBullet2,
  pt.landing.pricingBullet3,
] as const

export function PhysioSubscriptionPage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const checkoutState = params.get('checkout')

  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
    refetchInterval: checkoutState === 'success' ? 2500 : false,
  })

  useEffect(() => {
    if (checkoutState === 'success') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.physiotherapist(user?.id ?? '') })
    }
  }, [checkoutState, queryClient, user?.id])

  const checkout = useMutation({
    mutationFn: startSaasCheckout,
  })

  if (!user || physioQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  const active = physioQuery.data ? canManagePractice(physioQuery.data) : false

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <span className="font-bold">{pt.app.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await signOut()
            window.location.assign(ROUTES.login)
          }}
        >
          {pt.auth.logout}
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{pt.saas.pageTitle}</h1>
          <p className="mt-2 text-[var(--color-muted-foreground)]">{pt.saas.pageDescription}</p>
        </div>

        {checkoutState === 'success' && !active && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {pt.saas.checkoutSuccess}
          </p>
        )}
        {checkoutState === 'cancel' && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {pt.saas.checkoutCancel}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{SAAS_PLAN.name}</CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold text-[var(--color-foreground)]">{SAAS_PLAN.amountLabel}</span>
              <span className="text-[var(--color-muted-foreground)]">/{SAAS_PLAN.interval}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-medium">{pt.saas.planIncludes}</p>
            <ul className="space-y-2">
              {planBullets.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {active ? (
              <div className="space-y-3">
                <p className="text-sm text-emerald-700">{pt.saas.alreadyActive}</p>
                <Button asChild className="w-full">
                  <Link to={ROUTES.physio.dashboard}>{pt.saas.goToDashboard}</Link>
                </Button>
              </div>
            ) : (
              <>
                <Button
                  className="w-full"
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending}
                >
                  {checkout.isPending ? pt.common.loading : pt.saas.subscribe}
                </Button>
                {checkout.error && (
                  <p className="text-sm text-red-600">{(checkout.error as Error).message}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
