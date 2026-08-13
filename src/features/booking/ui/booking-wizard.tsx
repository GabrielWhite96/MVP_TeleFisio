import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Video, Home } from 'lucide-react'
import { getAvailablePhysiotherapists, getAvailability } from '@/entities/physiotherapist/api/physiotherapist-api'
import { createAppointment, getBookedSlots } from '@/entities/appointment/api/appointment-api'
import { getPatientByProfileId } from '@/entities/patient/api/patient-api'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { queryKeys } from '@/shared/api/query-keys'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input, Label, Textarea } from '@/shared/ui/input'
import { LoadingSpinner, EmptyState } from '@/shared/ui/states'
import { MODALITY_LABELS, ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { combineDateAndTime, generateTimeSlots, formatDate } from '@/shared/lib/dates'
import type { AppointmentModality } from '@/shared/types/database'
import { cn } from '@/shared/lib/utils'

export function BookingWizard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [modality, setModality] = useState<AppointmentModality | null>(null)
  const [physioId, setPhysioId] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const patientQuery = useQuery({
    queryKey: queryKeys.patient(user?.id ?? ''),
    queryFn: () => getPatientByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const physiosQuery = useQuery({
    queryKey: queryKeys.physiotherapists(modality ?? undefined),
    queryFn: () => getAvailablePhysiotherapists(modality ?? undefined),
    enabled: !!modality,
  })

  const availabilityQuery = useQuery({
    queryKey: queryKeys.availability(physioId ?? ''),
    queryFn: () => getAvailability(physioId!),
    enabled: !!physioId,
  })

  const bookedSlotsQuery = useQuery({
    queryKey: ['booked-slots', physioId, date],
    queryFn: () => getBookedSlots(physioId!, date),
    enabled: !!physioId && !!date,
  })

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments() })
      navigate(ROUTES.patient.dashboard)
    },
  })

  const selectedDate = date ? new Date(date + 'T12:00:00') : null
  const dayOfWeek = selectedDate?.getDay() ?? -1
  const dayAvailability = availabilityQuery.data?.filter(
    (a) => a.day_of_week === dayOfWeek && a.modality === modality
  ) ?? []

  const availableSlots = dayAvailability.flatMap((a) =>
    generateTimeSlots(a.start_time, a.end_time, 60, bookedSlotsQuery.data ?? [])
  )

  const handleConfirm = () => {
    if (!patientQuery.data || !physioId || !modality || !date || !time) return
    const scheduledAt = combineDateAndTime(new Date(date + 'T12:00:00'), time)
    const homeAddress =
      modality === 'home_visit'
        ? [patientQuery.data.address_line1, patientQuery.data.city, patientQuery.data.province]
            .filter(Boolean)
            .join(', ')
        : undefined

    createMutation.mutate({
      patientId: patientQuery.data.id,
      physiotherapistId: physioId,
      modality,
      scheduledAt: scheduledAt.toISOString(),
      homeAddress,
      notes: notes || undefined,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              'h-2 flex-1 rounded-full',
              step >= s ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]'
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{pt.booking.stepModality}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(['telehealth', 'home_visit'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setModality(m); setStep(2) }}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-lg border p-6 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-accent)]',
                  modality === m && 'border-[var(--color-primary)] bg-[var(--color-accent)]'
                )}
              >
                {m === 'telehealth' ? <Video className="h-8 w-8" /> : <Home className="h-8 w-8" />}
                <span className="font-medium">{MODALITY_LABELS[m]}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{pt.booking.stepPhysio}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {physiosQuery.isLoading && <LoadingSpinner />}
            {physiosQuery.data?.length === 0 && (
              <EmptyState title="Nenhum fisioterapeuta disponível" description="Tente outra modalidade." />
            )}
            {physiosQuery.data?.map((p) => {
              const profile = p.profiles as { full_name: string; phone: string | null } | null
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setPhysioId(p.id); setStep(3) }}
                  className={cn(
                    'w-full rounded-lg border p-4 text-left transition-colors hover:border-[var(--color-primary)]',
                    physioId === p.id && 'border-[var(--color-primary)] bg-[var(--color-accent)]'
                  )}
                >
                  <p className="font-medium">{profile?.full_name ?? 'Fisioterapeuta'}</p>
                  {p.province && <p className="text-sm text-[var(--color-muted-foreground)]">{p.province}</p>}
                  {p.specialties?.length > 0 && (
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                      {p.specialties.join(', ')}
                    </p>
                  )}
                </button>
              )
            })}
            <Button variant="outline" onClick={() => setStep(1)}>{pt.common.back}</Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{pt.booking.stepSchedule}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => { setDate(e.target.value); setTime('') }}
              />
            </div>
            {date && (
              <div className="space-y-2">
                <Label>Horário disponível</Label>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Sem horários para {formatDate(date + 'T12:00:00')}. Escolha outra data.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={cn(
                          'rounded-md border px-3 py-2 text-sm',
                          time === slot && 'border-[var(--color-primary)] bg-[var(--color-accent)]'
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {createMutation.error && (
              <p className="text-sm text-red-600">{(createMutation.error as Error).message}</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>{pt.common.back}</Button>
              <Button
                onClick={handleConfirm}
                disabled={!date || !time || createMutation.isPending}
              >
                {createMutation.isPending ? pt.common.loading : pt.booking.confirm}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
