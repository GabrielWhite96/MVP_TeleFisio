import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  chargeRemainingCents,
  createManualCharge,
  deleteReceipt,
  getPatientBillingSummary,
  markChargesPaid,
  markWeekPaid,
  openChargesForWeek,
  registerPayment,
  upsertBillingAgreement,
  weekBalanceCents,
  weekEndOf,
  weekStartOf,
  type BillingAgreement,
  type BillingCharge,
  type BillingMode,
  type PaymentMethodKind,
} from '@/entities/billing/api/billing-api'
import { queryKeys } from '@/shared/api/query-keys'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input, Label, Textarea } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Badge } from '@/shared/ui/badge'
import { EmptyState, ErrorState, LoadingSpinner } from '@/shared/ui/states'
import { BANKNOTE_METHOD_LABELS, BILLING_MODE_LABELS, CHARGE_STATUS_LABELS } from '@/shared/config/routes'

const agreementSchema = z.object({
  billingMode: z.enum(['per_session', 'weekly']),
  sessionPrice: z.coerce.number().min(0, 'Informe o valor da sessão'),
  preferredMethod: z.enum(['pix', 'cash', 'other']).optional(),
  notes: z.string().optional(),
})

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Informe um valor maior que zero'),
  method: z.enum(['pix', 'cash', 'other']),
  paidAt: z.string().min(1),
  note: z.string().optional(),
})

type AgreementForm = z.infer<typeof agreementSchema>
type PaymentForm = z.infer<typeof paymentSchema>

function money(cents: number, currency = 'BRL') {
  return formatMoney(cents, currency, 'pt-BR')
}

function statusVariant(status: BillingCharge['status']): 'default' | 'secondary' | 'success' | 'outline' | 'destructive' {
  if (status === 'paid') return 'success'
  if (status === 'partial') return 'secondary'
  if (status === 'waived') return 'outline'
  return 'destructive'
}

function AgreementReadOnly({
  agreement,
  currency,
  onEdit,
}: {
  agreement: BillingAgreement
  currency: string
  onEdit: () => void
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Acordo padrão</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>
          Atualizar acordo
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-[var(--color-muted-foreground)]">Como paga</p>
          <p className="font-medium">{BILLING_MODE_LABELS[agreement.billing_mode]}</p>
        </div>
        <div>
          <p className="text-[var(--color-muted-foreground)]">Valor por sessão</p>
          <p className="font-medium">{money(agreement.session_price_cents, currency)}</p>
        </div>
        <div>
          <p className="text-[var(--color-muted-foreground)]">Método preferido</p>
          <p className="font-medium">
            {agreement.preferred_method
              ? BANKNOTE_METHOD_LABELS[agreement.preferred_method]
              : 'Não definido'}
          </p>
        </div>
        {agreement.notes && (
          <div>
            <p className="text-[var(--color-muted-foreground)]">Observações</p>
            <p className="font-medium whitespace-pre-wrap">{agreement.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface PatientBillingPanelProps {
  patientId: string
  physiotherapistId: string
}

export function PatientBillingPanel({ patientId, physiotherapistId }: PatientBillingPanelProps) {
  const queryClient = useQueryClient()
  const [weekOf, setWeekOf] = useState(() => weekStartOf(new Date().toISOString()))
  const [weekMethod, setWeekMethod] = useState<PaymentMethodKind>('pix')
  const [editingAgreement, setEditingAgreement] = useState(false)

  const summaryQuery = useQuery({
    queryKey: queryKeys.patientBilling(patientId),
    queryFn: () => getPatientBillingSummary(patientId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patientBilling(patientId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.physioBillingOverview(physiotherapistId) })
  }

  const agreementForm = useForm<AgreementForm>({
    resolver: zodResolver(agreementSchema),
    values: summaryQuery.data?.agreement
      ? {
          billingMode: summaryQuery.data.agreement.billing_mode,
          sessionPrice: summaryQuery.data.agreement.session_price_cents / 100,
          preferredMethod: summaryQuery.data.agreement.preferred_method ?? undefined,
          notes: summaryQuery.data.agreement.notes ?? '',
        }
      : undefined,
    defaultValues: {
      billingMode: 'weekly',
      sessionPrice: 150,
      preferredMethod: 'pix',
      notes: '',
    },
  })

  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      method: 'pix',
      paidAt: new Date().toISOString().slice(0, 16),
      note: '',
    },
  })

  const saveAgreement = useMutation({
    mutationFn: (data: AgreementForm) =>
      upsertBillingAgreement({
        patientId,
        physiotherapistId,
        billingMode: data.billingMode as BillingMode,
        sessionPriceCents: Math.round(data.sessionPrice * 100),
        preferredMethod: (data.preferredMethod as PaymentMethodKind | undefined) ?? null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      setEditingAgreement(false)
      // Trigger backfills charges; refresh after a tick so DB work is visible
      invalidate()
    },
  })

  const weekPayMutation = useMutation({
    mutationFn: () =>
      markWeekPaid({
        patientId,
        physiotherapistId,
        weekOf,
        method: weekMethod,
      }),
    onSuccess: invalidate,
  })

  const partialPayMutation = useMutation({
    mutationFn: (data: PaymentForm) =>
      registerPayment({
        patientId,
        physiotherapistId,
        amountCents: Math.round(data.amount * 100),
        method: data.method,
        paidAt: new Date(data.paidAt).toISOString(),
        note: data.note || undefined,
      }),
    onSuccess: () => {
      paymentForm.reset({
        amount: undefined as unknown as number,
        method: 'pix',
        paidAt: new Date().toISOString().slice(0, 16),
        note: '',
      })
      invalidate()
    },
  })

  const payChargeMutation = useMutation({
    mutationFn: (chargeId: string) =>
      markChargesPaid({
        patientId,
        physiotherapistId,
        chargeIds: [chargeId],
        method: summaryQuery.data?.agreement?.preferred_method ?? 'pix',
      }),
    onSuccess: invalidate,
  })

  const manualChargeMutation = useMutation({
    mutationFn: (amount: number) =>
      createManualCharge({
        patientId,
        physiotherapistId,
        amountCents: Math.round(amount * 100),
        description: 'Cobrança avulsa',
      }),
    onSuccess: invalidate,
  })

  const deleteReceiptMutation = useMutation({
    mutationFn: deleteReceipt,
    onSuccess: invalidate,
  })

  const currency = summaryQuery.data?.agreement?.currency ?? 'BRL'
  const weekOpen = useMemo(
    () => openChargesForWeek(summaryQuery.data?.charges ?? [], weekOf),
    [summaryQuery.data?.charges, weekOf]
  )
  const weekDue = weekBalanceCents(summaryQuery.data?.charges ?? [], weekOf)

  if (summaryQuery.isLoading) return <LoadingSpinner />
  if (summaryQuery.error) return <ErrorState message="Não foi possível carregar o financeiro." />

  const summary = summaryQuery.data!
  const showAgreementForm = !summary.agreement || editingAgreement

  const agreementFormCard = (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-base">
          {summary.agreement ? 'Atualizar acordo' : 'Acordo padrão'}
        </CardTitle>
        {summary.agreement && editingAgreement && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditingAgreement(false)}>
            Cancelar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          onSubmit={agreementForm.handleSubmit((data) => saveAgreement.mutate(data))}
        >
          <div className="space-y-2">
            <Label>Como o paciente paga</Label>
            <Select
              value={agreementForm.watch('billingMode')}
              onValueChange={(v) => agreementForm.setValue('billingMode', v as BillingMode)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(BILLING_MODE_LABELS) as BillingMode[]).map((mode) => (
                  <SelectItem key={mode} value={mode}>{BILLING_MODE_LABELS[mode]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valor por sessão (R$)</Label>
            <Input type="number" step="0.01" min="0" {...agreementForm.register('sessionPrice')} />
            {agreementForm.formState.errors.sessionPrice && (
              <p className="text-sm text-[var(--color-destructive)]">
                {agreementForm.formState.errors.sessionPrice.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Método preferido</Label>
            <Select
              value={agreementForm.watch('preferredMethod') ?? 'pix'}
              onValueChange={(v) => agreementForm.setValue('preferredMethod', v as PaymentMethodKind)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(BANKNOTE_METHOD_LABELS) as PaymentMethodKind[]).map((m) => (
                  <SelectItem key={m} value={m}>{BANKNOTE_METHOD_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea placeholder="Ex.: paga toda sexta no Pix" rows={2} {...agreementForm.register('notes')} />
          </div>
          <div>
            <Button type="submit" disabled={saveAgreement.isPending}>
              {saveAgreement.isPending ? 'Salvando...' : 'Salvar acordo'}
            </Button>
            {saveAgreement.isError && (
              <p className="mt-2 text-sm text-[var(--color-destructive)]">
                {(saveAgreement.error as Error).message}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )

  const quickActionsCard = summary.agreement ? (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Ações rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          As cobranças são atualizadas automaticamente ao agendar, remarcar ou cancelar consultas.
        </p>

        {(summary.agreement.billing_mode === 'weekly' || weekOpen.length > 0) && (
          <div className="rounded-lg border p-3 space-y-3">
            <p className="font-medium text-sm">Marcar semana como paga</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Semana de</Label>
                <Input type="date" value={weekOf} onChange={(e) => setWeekOf(weekStartOf(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Método</Label>
                <Select value={weekMethod} onValueChange={(v) => setWeekMethod(v as PaymentMethodKind)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(BANKNOTE_METHOD_LABELS) as PaymentMethodKind[]).map((m) => (
                      <SelectItem key={m} value={m}>{BANKNOTE_METHOD_LABELS[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{money(weekDue, currency)}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {weekStartOf(weekOf)} a {weekEndOf(weekOf)} · {weekOpen.length} em aberto
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={weekDue <= 0 || weekPayMutation.isPending}
                onClick={() => weekPayMutation.mutate()}
              >
                {weekPayMutation.isPending ? 'Registrando...' : 'Confirmar semana paga'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  ) : null

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Esperado</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{money(summary.expectedCents, currency)}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">Total das sessões/cobranças</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Recebido</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{money(summary.paidCents, currency)}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">Já debitado no saldo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Em aberto</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${summary.balanceCents > 0 ? 'text-[var(--color-destructive)]' : ''}`}>
              {money(summary.balanceCents, currency)}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {summary.openChargesCount} cobrança(s) pendente(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {!summary.agreement ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            {agreementFormCard}
          </div>
          <EmptyState
            title="Configure o acordo"
            description="Defina se o paciente paga por sessão ou semanalmente e o valor de cada sessão."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
            {showAgreementForm ? (
              agreementFormCard
            ) : (
              <AgreementReadOnly
                agreement={summary.agreement}
                currency={currency}
                onEdit={() => setEditingAgreement(true)}
              />
            )}
            {quickActionsCard}
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Pagamento picado / fora de hora</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-3"
                  onSubmit={paymentForm.handleSubmit((data) => partialPayMutation.mutate(data))}
                >
                  <div className="space-y-2">
                    <Label>Valor recebido (R$)</Label>
                    <Input type="number" step="0.01" min="0.01" {...paymentForm.register('amount')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Método</Label>
                    <Select
                      value={paymentForm.watch('method')}
                      onValueChange={(v) => paymentForm.setValue('method', v as PaymentMethodKind)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(BANKNOTE_METHOD_LABELS) as PaymentMethodKind[]).map((m) => (
                          <SelectItem key={m} value={m}>{BANKNOTE_METHOD_LABELS[m]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quando recebeu</Label>
                    <Input type="datetime-local" {...paymentForm.register('paidAt')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <Input placeholder="Ex.: pagou metade atrasado" {...paymentForm.register('note')} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={partialPayMutation.isPending}>
                      {partialPayMutation.isPending ? 'Registrando...' : 'Registrar e debitar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={manualChargeMutation.isPending}
                      onClick={() => {
                        const raw = window.prompt('Valor da cobrança avulsa (R$):')
                        if (!raw) return
                        const value = Number(raw.replace(',', '.'))
                        if (!Number.isFinite(value) || value <= 0) return
                        manualChargeMutation.mutate(value)
                      }}
                    >
                      Cobrança avulsa
                    </Button>
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Debita automaticamente nas cobranças mais antigas em aberto.
                  </p>
                  {partialPayMutation.isError && (
                    <p className="text-sm text-[var(--color-destructive)]">
                      {(partialPayMutation.error as Error).message}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Cobranças (esperado)</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[28rem] space-y-3 overflow-y-auto">
                {!summary.charges.length ? (
                  <EmptyState
                    title="Nenhuma cobrança"
                    description="As cobranças aparecem automaticamente quando houver consultas agendadas."
                  />
                ) : (
                  summary.charges.map((charge) => (
                    <div
                      key={charge.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium text-sm">{charge.description ?? 'Cobrança'}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {money(charge.amount_cents, currency)}
                          {charge.amount_paid_cents > 0 && (
                            <> · pago {money(charge.amount_paid_cents, currency)}</>
                          )}
                          {chargeRemainingCents(charge) > 0 && charge.status !== 'waived' && (
                            <> · falta {money(chargeRemainingCents(charge), currency)}</>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(charge.status)}>
                          {CHARGE_STATUS_LABELS[charge.status]}
                        </Badge>
                        {(charge.status === 'open' || charge.status === 'partial') && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={payChargeMutation.isPending}
                            onClick={() => payChargeMutation.mutate(charge.id)}
                          >
                            Marcar paga
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de recebimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!summary.receipts.length ? (
                <EmptyState title="Nenhum recebimento" description="Registre um pagamento quando o paciente pagar." />
              ) : (
                summary.receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{money(receipt.amount_cents, currency)}</p>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {BANKNOTE_METHOD_LABELS[receipt.method]} ·{' '}
                        {new Date(receipt.paid_at).toLocaleString('pt-BR')}
                        {receipt.note ? ` · ${receipt.note}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleteReceiptMutation.isPending}
                      onClick={() => {
                        if (window.confirm('Remover este recebimento? O saldo será recalculado.')) {
                          deleteReceiptMutation.mutate(receipt.id)
                        }
                      }}
                    >
                      Desfazer
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
