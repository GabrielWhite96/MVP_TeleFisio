import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPackageCheckout,
  getPatientInvoices,
  getPatientPackagePurchases,
  getRecoveryPackages,
  packageUsageLabel,
} from '@/entities/package/api/package-api'
import { queryKeys } from '@/shared/api/query-keys'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { EmptyState, LoadingSpinner } from '@/shared/ui/states'

export function RecoveryPackagesPanel({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient()
  const packagesQuery = useQuery({
    queryKey: queryKeys.recoveryPackages,
    queryFn: getRecoveryPackages,
  })
  const purchasesQuery = useQuery({
    queryKey: queryKeys.packagePurchases(patientId),
    queryFn: () => getPatientPackagePurchases(patientId),
  })
  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices(patientId),
    queryFn: () => getPatientInvoices(patientId),
  })

  const checkoutMutation = useMutation({
    mutationFn: (pkg: { id: string; price_cents: number }) =>
      createPackageCheckout({ packageId: pkg.id, amountCents: pkg.price_cents }),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url
      queryClient.invalidateQueries({ queryKey: queryKeys.packagePurchases(patientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices(patientId) })
    },
  })

  if (packagesQuery.isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {packagesQuery.data?.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <CardTitle className="text-base">{pkg.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-[var(--color-muted-foreground)]">{pkg.description}</p>
              <p className="text-lg font-semibold">{formatMoney(pkg.price_cents, pkg.currency)}</p>
              <ul className="text-sm space-y-1 text-[var(--color-muted-foreground)]">
                <li>{pkg.duration_weeks} semanas</li>
                <li>{pkg.home_visits_included} visitas domiciliares</li>
                <li>{pkg.virtual_sessions_included} teleconsultas</li>
                {pkg.exercise_monitoring && <li>Monitoramento de exercícios</li>}
              </ul>
              <Button
                onClick={() => checkoutMutation.mutate(pkg)}
                disabled={checkoutMutation.isPending}
              >
                Comprar programa
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Meus pacotes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {purchasesQuery.isLoading ? (
            <LoadingSpinner />
          ) : !purchasesQuery.data?.length ? (
            <EmptyState title="Nenhum pacote" description="Compre um Recovery Program para acompanhar o uso." />
          ) : (
            purchasesQuery.data.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{p.package?.name ?? 'Pacote'}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{packageUsageLabel(p)}</p>
                </div>
                <Badge variant="secondary">{p.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Faturas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!invoicesQuery.data?.length ? (
            <EmptyState title="Sem faturas" description="Faturas aparecem após pagamentos." />
          ) : (
            invoicesQuery.data.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{inv.invoice_number}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {formatMoney(inv.amount_cents, inv.currency)}
                  </p>
                </div>
                <Badge>{inv.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
