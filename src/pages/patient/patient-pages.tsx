import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getPatientByProfileId, updatePatient, updateProfile } from '@/entities/patient/api/patient-api'
import { getAppointments, getAppointmentById } from '@/entities/appointment/api/appointment-api'
import { getPatientExercises, calculateExerciseProgress } from '@/entities/exercise/api/exercise-api'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/entities/notification/api/notification-api'
import { getCaregiverLinks, revokeCaregiver } from '@/entities/caregiver/api/caregiver-api'
import { BookingWizard } from '@/features/booking/ui/booking-wizard'
import { AppointmentSession } from '@/features/appointment-session/ui/appointment-session'
import { PatientExerciseList } from '@/features/exercises/ui/exercise-components'
import { CheckInForm } from '@/features/patient-checkin/ui/check-in-form'
import { TreatmentPlanCard } from '@/features/treatment-plan/ui/treatment-plan-card'
import { CaregiverAuthorizeForm } from '@/features/caregiver/ui/caregiver-authorize-form'
import { CaregiverInviteForm } from '@/features/caregiver/ui/caregiver-invite-form'
import { RecoveryPackagesPanel } from '@/features/payment/ui/recovery-packages-panel'
import { ClinicalProfileForm } from '@/features/clinical-profile/ui/clinical-profile-form'
import { RecoveryProgressWidget } from '@/widgets/recovery-progress/recovery-progress-widget'
import { queryKeys } from '@/shared/api/query-keys'
import { AppLayout } from '@/widgets/layout/app-layout'
import { NextAppointmentCard, AppointmentList, StatCard } from '@/widgets/dashboard/dashboard-widgets'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input, Label } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { LoadingSpinner, ErrorState, EmptyState } from '@/shared/ui/states'
import { ROUTES, CANADIAN_PROVINCES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { isUpcoming, formatDateTime } from '@/shared/lib/dates'
import { CalendarPlus, Bell, HeartPulse } from 'lucide-react'

const profileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
})

export function PatientDashboardPage() {
  const { user, profile } = useAuth()

  const patientQuery = useQuery({
    queryKey: queryKeys.patient(user?.id ?? ''),
    queryFn: () => getPatientByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments({ patientId: patientQuery.data?.id }),
    queryFn: () => getAppointments({ patientId: patientQuery.data!.id }),
    enabled: !!patientQuery.data?.id,
  })

  const exercisesQuery = useQuery({
    queryKey: queryKeys.patientExercises(patientQuery.data?.id ?? ''),
    queryFn: () => getPatientExercises(patientQuery.data!.id),
    enabled: !!patientQuery.data?.id,
  })

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(user?.id ?? ''),
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
  })

  const upcoming = appointmentsQuery.data?.filter(
    (a) => isUpcoming(a.scheduled_at) && !['cancelled', 'completed', 'no_show'].includes(a.status)
  ) ?? []
  const history = appointmentsQuery.data?.filter((a) => ['completed', 'cancelled'].includes(a.status)).slice(0, 5) ?? []
  const progress = calculateExerciseProgress(exercisesQuery.data ?? [])
  const unread = notificationsQuery.data?.filter((n) => !n.read_at).length ?? 0
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{pt.patient.dashboard}</h1>
            <p className="text-[var(--color-muted-foreground)]">
              {pt.auth.greeting}{firstName ? `, ${firstName}` : ''}!
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={ROUTES.patient.checkIn}>
                <HeartPulse className="mr-2 h-4 w-4" />
                {pt.patient.howAmI}
              </Link>
            </Button>
            <Button asChild>
              <Link to={ROUTES.patient.book}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                {pt.patient.bookAppointment}
              </Link>
            </Button>
          </div>
        </div>

        {patientQuery.data && (
          <div className="grid gap-6 lg:grid-cols-2">
            <RecoveryProgressWidget patientId={patientQuery.data.id} />
            <TreatmentPlanCard patientId={patientQuery.data.id} />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NextAppointmentCard appointment={upcoming[0]} loading={appointmentsQuery.isLoading} />
          <StatCard title={pt.patient.progress} value={`${progress}%`} loading={exercisesQuery.isLoading} />
          <StatCard title={pt.patient.exercises} value={exercisesQuery.data?.length ?? 0} loading={exercisesQuery.isLoading} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{pt.patient.history}</CardTitle></CardHeader>
            <CardContent>
              <AppointmentList appointments={history} loading={appointmentsQuery.isLoading} role="patient" emptyMessage="Nenhuma consulta no histórico" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{pt.patient.notifications}</CardTitle>
              {unread > 0 && <span className="flex items-center gap-1 text-sm text-[var(--color-primary)]"><Bell className="h-4 w-4" /> {unread}</span>}
            </CardHeader>
            <CardContent className="space-y-2">
              {notificationsQuery.data?.slice(0, 5).map((n) => (
                <div key={n.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-[var(--color-muted-foreground)]">{n.body}</p>
                </div>
              )) ?? <p className="text-sm text-[var(--color-muted-foreground)]">{pt.notifications.empty}</p>}
              <Button asChild variant="link" className="px-0">
                <Link to={ROUTES.patient.notifications}>{pt.common.viewAll}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export function PatientProfilePage() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  const patientQuery = useQuery({
    queryKey: queryKeys.patient(user?.id ?? ''),
    queryFn: () => getPatientByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const { register, handleSubmit, setValue, watch } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      dateOfBirth: patientQuery.data?.date_of_birth ?? '',
      addressLine1: patientQuery.data?.address_line1 ?? '',
      city: patientQuery.data?.city ?? '',
      province: patientQuery.data?.province ?? '',
      postalCode: patientQuery.data?.postal_code ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      await updateProfile(user!.id, { full_name: data.fullName, phone: data.phone || null })
      await updatePatient(patientQuery.data!.id, {
        date_of_birth: data.dateOfBirth || null,
        address_line1: data.addressLine1 || null,
        city: data.city || null,
        province: data.province || null,
        postal_code: data.postalCode || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patient(user!.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(user!.id) })
    },
  })

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">{pt.patient.profile}</h1>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input {...register('fullName')} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...register('phone')} />
              </div>
              <div className="space-y-2">
                <Label>Data de nascimento</Label>
                <Input type="date" {...register('dateOfBirth')} />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input {...register('addressLine1')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label>Província</Label>
                  <Select value={watch('province')} onValueChange={(v) => setValue('province', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {CANADIAN_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Código postal</Label>
                <Input {...register('postalCode')} />
              </div>
              {mutation.isSuccess && <p className="text-sm text-green-600">Perfil atualizado!</p>}
              <Button type="submit" disabled={mutation.isPending}>{pt.common.save}</Button>
            </form>
          </CardContent>
        </Card>
        {patientQuery.data && <ClinicalProfileForm patientId={patientQuery.data.id} />}
      </div>
    </AppLayout>
  )
}

export function PatientBookPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{pt.booking.title}</h1>
        <BookingWizard />
      </div>
    </AppLayout>
  )
}

export function PatientAppointmentsPage() {
  const { user } = useAuth()
  const patientQuery = useQuery({
    queryKey: queryKeys.patient(user?.id ?? ''),
    queryFn: () => getPatientByProfileId(user!.id),
    enabled: !!user?.id,
  })
  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments({ patientId: patientQuery.data?.id }),
    queryFn: () => getAppointments({ patientId: patientQuery.data!.id }),
    enabled: !!patientQuery.data?.id,
  })

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Minhas consultas</h1>
        <AppointmentList appointments={appointmentsQuery.data ?? []} loading={appointmentsQuery.isLoading} role="patient" />
      </div>
    </AppLayout>
  )
}

export function PatientAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const query = useQuery({
    queryKey: queryKeys.appointment(id!),
    queryFn: () => getAppointmentById(id!),
    enabled: !!id,
  })

  if (query.isLoading) return <AppLayout><LoadingSpinner className="mx-auto mt-8 h-8 w-8" /></AppLayout>
  if (query.error || !query.data) return <AppLayout><ErrorState message="Consulta não encontrada" /></AppLayout>

  return (
    <AppLayout>
      <AppointmentSession appointment={query.data} role="patient" />
    </AppLayout>
  )
}

export function PatientExercisesPage() {
  const { user } = useAuth()
  const patientQuery = useQuery({
    queryKey: queryKeys.patient(user?.id ?? ''),
    queryFn: () => getPatientByProfileId(user!.id),
    enabled: !!user?.id,
  })

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{pt.patient.exercises}</h1>
        {patientQuery.data && <PatientExerciseList patientId={patientQuery.data.id} canComplete />}
      </div>
    </AppLayout>
  )
}

export function PatientCheckInPage() {
  const { user } = useAuth()
  const patientQuery = useQuery({
    queryKey: queryKeys.patient(user?.id ?? ''),
    queryFn: () => getPatientByProfileId(user!.id),
    enabled: !!user?.id,
  })

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">{pt.checkIn.title}</h1>
        {patientQuery.isLoading && <LoadingSpinner />}
        {patientQuery.data && <CheckInForm patientId={patientQuery.data.id} />}
      </div>
    </AppLayout>
  )
}

export function PatientNotificationsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.notifications(user?.id ?? ''),
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
  })

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user!.id) }),
  })

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user!.id) }),
  })

  const unread = query.data?.filter((n) => !n.read_at).length ?? 0

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{pt.notifications.title}</h1>
          {unread > 0 && (
            <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              {pt.notifications.markAllRead}
            </Button>
          )}
        </div>
        {query.isLoading && <LoadingSpinner />}
        {!query.data?.length && !query.isLoading && (
          <EmptyState title={pt.notifications.empty} />
        )}
        <div className="space-y-3">
          {query.data?.map((n) => (
            <button
              key={n.id}
              type="button"
              className="w-full rounded-lg border p-4 text-left"
              onClick={() => !n.read_at && markOne.mutate(n.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{n.title}</p>
                {!n.read_at && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)]">{n.body}</p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{formatDateTime(n.created_at)}</p>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

export function PatientCaregiversPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const patientQuery = useQuery({
    queryKey: queryKeys.patient(user?.id ?? ''),
    queryFn: () => getPatientByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const linksQuery = useQuery({
    queryKey: queryKeys.caregiverLinks(patientQuery.data?.id ?? ''),
    queryFn: () => getCaregiverLinks(patientQuery.data!.id),
    enabled: !!patientQuery.data?.id,
  })

  const revokeMutation = useMutation({
    mutationFn: revokeCaregiver,
    onSuccess: () => {
      if (patientQuery.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.caregiverLinks(patientQuery.data.id) })
      }
    },
  })

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">{pt.patient.caregivers}</h1>
        {patientQuery.data && <CaregiverInviteForm patientId={patientQuery.data.id} />}
        {patientQuery.data && <CaregiverAuthorizeForm patientId={patientQuery.data.id} />}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{pt.patient.caregivers}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {linksQuery.isLoading && <LoadingSpinner />}
            {!linksQuery.data?.length && !linksQuery.isLoading && (
              <p className="text-sm text-[var(--color-muted-foreground)]">{pt.common.empty}</p>
            )}
            {linksQuery.data?.map((link) => (
              <div key={link.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{link.caregiver?.full_name ?? 'Cuidador'}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {formatDateTime(link.authorized_at)}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => revokeMutation.mutate(link.id)}
                  disabled={revokeMutation.isPending}
                >
                  {pt.caregiverAuth.revoke}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export function PatientBillingPage() {
  const { user } = useAuth()
  const patientQuery = useQuery({
    queryKey: queryKeys.patient(user?.id ?? ''),
    queryFn: () => getPatientByProfileId(user!.id),
    enabled: !!user?.id,
  })

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Pagamentos e programas</h1>
        {patientQuery.isLoading && <LoadingSpinner />}
        {patientQuery.data && <RecoveryPackagesPanel patientId={patientQuery.data.id} />}
      </div>
    </AppLayout>
  )
}
