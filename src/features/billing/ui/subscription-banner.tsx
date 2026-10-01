import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { startSaasCheckout } from '@/entities/physiotherapist/api/saas-checkout-api'
import { getPhysiotherapistByProfileId } from '@/entities/physiotherapist/api/physiotherapist-api'
import { canManagePractice, trialDaysLeft } from '@/entities/physiotherapist/model/subscription-access'
import { queryKeys } from '@/shared/api/query-keys'
import { pt } from '@/shared/config/i18n/pt'
import { Button } from '@/shared/ui/button'

export function SubscriptionBanner() {
  const { profile, user } = useAuth()
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: profile?.role === 'physiotherapist' && !!user?.id,
  })

  const checkout = useMutation({
    mutationFn: startSaasCheckout,
  })

  if (profile?.role !== 'physiotherapist' || !physioQuery.data) return null
  if (physioQuery.data.subscription_status === 'active') return null

  const days = trialDaysLeft(physioQuery.data.trial_ends_at)
  const locked = !canManagePractice(physioQuery.data)
  const message = locked
    ? pt.saas.locked
    : pt.saas.trialDays.replace('{days}', String(Math.max(days ?? 0, 0)))

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>{message}</p>
      <Button size="sm" onClick={() => checkout.mutate()} disabled={checkout.isPending}>
        {checkout.isPending ? pt.common.loading : pt.saas.subscribe}
      </Button>
      {checkout.error && <p className="w-full text-red-700">{(checkout.error as Error).message}</p>}
    </div>
  )
}
