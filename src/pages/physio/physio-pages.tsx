import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getPhysiotherapistByProfileId, updatePhysiotherapist } from '@/entities/physiotherapist/api/physiotherapist-api'
import { canManagePractice } from '@/entities/physiotherapist/model/subscription-access'
import { getPhysioOnboarding, getPhysioPatientStats } from '@/entities/physiotherapist/api/physio-stats-api'
import { getPhysioOwnedPatients, getPatientById } from '@/entities/patient/api/patient-api'
import { getAppointments, getAppointmentById } from '@/entities/appointment/api/appointment-api'
import { getAtRiskPatients, getNotifications } from '@/entities/notification/api/notification-api'
import { NotificationInbox } from '@/features/notifications/ui/notification-inbox'
import { hasInitialAssessment } from '@/entities/clinical-record/api/clinical-record-api'
import { AppointmentSession } from '@/features/appointment-session/ui/appointment-session'
import { ClinicalRecordWorkspace } from '@/features/clinical-record/ui/clinical-record-workspace'
import { AssignExerciseForm, PatientExerciseList } from '@/features/exercises/ui/exercise-components'
import { ExerciseLibraryEditor } from '@/features/exercises/ui/exercise-library-editor'
import { TreatmentPlanForm } from '@/features/treatment-plan/ui/treatment-plan-form'
import { TreatmentPlanCard } from '@/features/treatment-plan/ui/treatment-plan-card'
import { DischargePlanButton } from '@/features/treatment-plan/ui/discharge-plan-button'
import { ClinicalTimeline } from '@/features/clinical-timeline/ui/clinical-timeline'
import { AvailabilityEditor } from '@/features/scheduling/ui/availability-editor'
import { CreatePatientForm } from '@/features/patients/ui/create-patient-form'
import { ClinicalStatusActions } from '@/features/patients/ui/clinical-status-actions'
import { PatientInvitePanel } from '@/features/patients/ui/patient-invite-panel'
import { PhysioCreateAppointmentForm } from '@/features/appointments/ui/physio-create-appointment-form'
import { PhysioAgenda } from '@/features/physio-agenda/ui/physio-agenda'
import { PatientBillingPanel } from '@/features/billing/ui/patient-billing-panel'
import { PhysioBillingOverview } from '@/features/billing/ui/physio-billing-overview'
import { queryKeys } from '@/shared/api/query-keys'
import { AppLayout } from '@/widgets/layout/app-layout'
import { AppointmentList, StatCard } from '@/widgets/dashboard/dashboard-widgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input, Label, Textarea } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Badge } from '@/shared/ui/badge'
import { LoadingSpinner, ErrorState, EmptyState } from '@/shared/ui/states'
import {
  ROUTES,
  BRAZILIAN_UFS,
  CLINICAL_STATUS_LABELS,
  ACCOUNT_STATUS_LABELS,
} from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { isToday, isUpcoming } from '@/shared/lib/dates'
import { ChevronRight, AlertTriangle, UserPlus, CalendarPlus } from 'lucide-react'
import type { PatientAccountStatus, PatientClinicalStatus } from '@/shared/types/database'

export function PhysioDashboardPage() {
  const { user } = useAuth()
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments({ physiotherapistId: physioQuery.data?.id }),
    queryFn: () => getAppointments({ physiotherapistId: physioQuery.data!.id }),
    enabled: !!physioQuery.data?.id,
  })

  const patientsQuery = useQuery({
    queryKey: queryKeys.physioPatients(physioQuery.data?.id ?? ''),
    queryFn: () => getPhysioOwnedPatients(physioQuery.data!.id),
    enabled: !!physioQuery.data?.id,
  })

  const statsQuery = useQuery({
    queryKey: queryKeys.physioPatientStats(physioQuery.data?.id ?? ''),
    queryFn: () => getPhysioPatientStats(physioQuery.data!.id),
    enabled: !!physioQuery.data?.id,
  })

  const onboardingQuery = useQuery({
    queryKey: queryKeys.physioOnboarding(physioQuery.data?.id ?? ''),
    queryFn: () => getPhysioOnboarding(physioQuery.data!.id),
    enabled: !!physioQuery.data?.id,
  })

  const atRiskQuery = useQuery({
    queryKey: queryKeys.atRiskPatients(physioQuery.data?.id),
    queryFn: () => getAtRiskPatients(physioQuery.data!.id),
    enabled: !!physioQuery.data?.id,
  })

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(user?.id ?? ''),
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
  })

  const today = appointmentsQuery.data?.filter((a) => isToday(a.scheduled_at) && a.status !== 'cancelled') ?? []
  const upcoming = appointmentsQuery.data?.filter((a) => isUpcoming(a.scheduled_at) && !['cancelled', 'completed'].includes(a.status)) ?? []
  const awaitingPatients = patientsQuery.data?.filter((p) => p.clinical_status === 'awaiting_assessment') ?? []
  const pausedPatients = patientsQuery.data?.filter((p) => p.clinical_status === 'paused') ?? []
  const reassessmentPatients = patientsQuery.data?.filter((p) => p.clinical_status === 'reassessment') ?? []

  const unreadReminders = notificationsQuery.data?.filter(
    (n) => !n.read_at && (n.type === 'appointment_reminder' || n.type === 'evaluation_due')
  ) ?? []

  const practiceOpen = !physioQuery.data || canManagePractice(physioQuery.data)

  const reasonLabels: Record<string, string> = {
    high_pain: 'Dor alta',
    low_adherence: 'Baixa adesão',
    missing_check_in: 'Sem check-in',
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{pt.physio.dashboard}</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">{pt.physio.saasTagline}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild={practiceOpen} variant="outline" disabled={!practiceOpen}>
              {practiceOpen ? (
                <Link to={ROUTES.physio.patientNew}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {pt.physio.newPatient}
                </Link>
              ) : (
                <span>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {pt.physio.newPatient}
                </span>
              )}
            </Button>
            <Button asChild variant="outline">
              <Link to={ROUTES.physio.billing}>{pt.physio.billing}</Link>
            </Button>
            <Button asChild={practiceOpen} disabled={!practiceOpen}>
              {practiceOpen ? (
                <Link to={ROUTES.physio.appointmentNew}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  {pt.physio.newAppointment}
                </Link>
              ) : (
                <span>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  {pt.physio.newAppointment}
                </span>
              )}
            </Button>
          </div>
        </div>

        {onboardingQuery.data &&
          !(onboardingQuery.data.hasAvailability && onboardingQuery.data.hasPatient && onboardingQuery.data.hasAssessment) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{pt.physio.onboardingTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!onboardingQuery.data.hasAvailability && (
                <Link to={ROUTES.physio.profile} className="block rounded-lg border p-3 hover:bg-[var(--color-accent)]">
                  {pt.physio.onboardingAvailability}
                </Link>
              )}
              {!onboardingQuery.data.hasPatient && (
                <Link to={ROUTES.physio.patientNew} className="block rounded-lg border p-3 hover:bg-[var(--color-accent)]">
                  {pt.physio.onboardingPatient}
                </Link>
              )}
              {!onboardingQuery.data.hasAssessment && (
                <Link to={ROUTES.physio.patients} className="block rounded-lg border p-3 hover:bg-[var(--color-accent)]">
                  {pt.physio.onboardingAssessment}
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="mb-3 text-lg font-semibold">{pt.physio.whatToDoToday}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title={pt.physio.todayAppointments} value={today.length} loading={appointmentsQuery.isLoading} />
            <StatCard title={pt.physio.awaitingAssessment} value={statsQuery.data?.awaiting ?? 0} loading={statsQuery.isLoading} />
            <StatCard title={pt.physio.atRisk} value={statsQuery.data?.atRisk ?? 0} loading={statsQuery.isLoading} />
            <StatCard title={pt.physio.activePatients} value={statsQuery.data?.active ?? 0} loading={statsQuery.isLoading} />
            <StatCard title={pt.physio.pausedPatients} value={statsQuery.data?.paused ?? 0} loading={statsQuery.isLoading} />
            <StatCard title={pt.physio.reassessmentPatients} value={statsQuery.data?.reassessment ?? 0} loading={statsQuery.isLoading} />
          </div>
        </div>

        {unreadReminders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{pt.notifications.unreadReminders}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {unreadReminders.slice(0, 5).map((n) => (
                <Link
                  key={n.id}
                  to={ROUTES.physio.notifications}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-[var(--color-accent)]"
                >
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{n.body}</p>
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {awaitingPatients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{pt.physio.awaitingAssessment}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {awaitingPatients.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  to={ROUTES.physio.patient(p.id)}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-[var(--color-accent)]"
                >
                  <div>
                    <p className="font-medium">{p.full_name}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{pt.physio.startAssessment}</p>
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {pausedPatients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{pt.physio.pausedPatients}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pausedPatients.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  to={ROUTES.physio.patient(p.id)}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-[var(--color-accent)]"
                >
                  <div>
                    <p className="font-medium">{p.full_name}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{pt.physio.resumeTreatment}</p>
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {reassessmentPatients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{pt.physio.reassessmentPatients}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reassessmentPatients.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  to={ROUTES.physio.patient(p.id)}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-[var(--color-accent)]"
                >
                  <div>
                    <p className="font-medium">{p.full_name}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{CLINICAL_STATUS_LABELS.reassessment}</p>
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {!!atRiskQuery.data?.length && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                {pt.physio.atRisk}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {atRiskQuery.data.map((p) => (
                <Link
                  key={p.patientId}
                  to={ROUTES.physio.patient(p.patientId)}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-[var(--color-accent)]"
                >
                  <div>
                    <p className="font-medium">{p.patientName}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {p.reasons.map((r) => reasonLabels[r] ?? r).join(' · ')}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{pt.physio.todayAppointments}</CardTitle></CardHeader>
            <CardContent>
              <AppointmentList appointments={today} loading={appointmentsQuery.isLoading} role="physiotherapist" emptyMessage="Sem consultas hoje" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{pt.physio.upcoming}</CardTitle></CardHeader>
            <CardContent>
              <AppointmentList appointments={upcoming.slice(0, 5)} loading={appointmentsQuery.isLoading} role="physiotherapist" />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export function PhysioAgendaPage() {
  const { user } = useAuth()
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })
  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments({ physiotherapistId: physioQuery.data?.id }),
    queryFn: () => getAppointments({ physiotherapistId: physioQuery.data!.id }),
    enabled: !!physioQuery.data?.id,
  })

  return (
    <AppLayout>
      <PhysioAgenda
        appointments={appointmentsQuery.data ?? []}
        loading={appointmentsQuery.isLoading || physioQuery.isLoading}
        physiotherapistId={physioQuery.data?.id ?? ''}
      />
    </AppLayout>
  )
}

export function PhysioBillingPage() {
  const { user } = useAuth()
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })

  if (!physioQuery.data) {
    return <AppLayout><LoadingSpinner className="mx-auto mt-8 h-8 w-8" /></AppLayout>
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{pt.physio.billing}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{pt.physio.billingTagline}</p>
        </div>
        <PhysioBillingOverview physiotherapistId={physioQuery.data.id} />
      </div>
    </AppLayout>
  )
}

export function PhysioPatientsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [clinicalFilter, setClinicalFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')

  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })
  const patientsQuery = useQuery({
    queryKey: queryKeys.physioPatients(physioQuery.data?.id ?? ''),
    queryFn: () => getPhysioOwnedPatients(physioQuery.data!.id),
    enabled: !!physioQuery.data?.id,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (patientsQuery.data ?? []).filter((p) => {
      const matchesSearch =
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q) ||
        (p.phone ?? '').toLowerCase().includes(q)
      const matchesClinical = clinicalFilter === 'all' || p.clinical_status === clinicalFilter
      const matchesAccount = accountFilter === 'all' || p.account_status === accountFilter
      return matchesSearch && matchesClinical && matchesAccount
    })
  }, [patientsQuery.data, search, clinicalFilter, accountFilter])

  const practiceOpen = !physioQuery.data || canManagePractice(physioQuery.data)

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{pt.physio.patients}</h1>
          <Button asChild={practiceOpen} disabled={!practiceOpen}>
            {practiceOpen ? (
              <Link to={ROUTES.physio.patientNew}>
                <UserPlus className="mr-2 h-4 w-4" />
                {pt.physio.newPatient}
              </Link>
            ) : (
              <span>
                <UserPlus className="mr-2 h-4 w-4" />
                {pt.physio.newPatient}
              </span>
            )}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Buscar por nome, e-mail ou telefone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={clinicalFilter} onValueChange={setClinicalFilter}>
            <SelectTrigger><SelectValue placeholder="Status clínico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status clínicos</SelectItem>
              {(Object.keys(CLINICAL_STATUS_LABELS) as PatientClinicalStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{CLINICAL_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger><SelectValue placeholder="Status da conta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {(Object.keys(ACCOUNT_STATUS_LABELS) as PatientAccountStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{ACCOUNT_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {patientsQuery.isLoading && <LoadingSpinner />}
        {!filtered.length && !patientsQuery.isLoading && (
          <EmptyState
            title="Nenhum paciente encontrado"
            description="Cadastre seu primeiro paciente para iniciar avaliações e tratamentos."
          />
        )}
        <div className="space-y-3">
          {filtered.map((patient) => (
            <Link
              key={patient.id}
              to={ROUTES.physio.patient(patient.id)}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-[var(--color-accent)]"
            >
              <div className="space-y-1">
                <p className="font-medium">{patient.full_name}</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {[patient.email, patient.city].filter(Boolean).join(' · ')}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="secondary">{CLINICAL_STATUS_LABELS[patient.clinical_status]}</Badge>
                  <Badge variant={patient.account_status === 'active' ? 'success' : 'outline'}>
                    {ACCOUNT_STATUS_LABELS[patient.account_status]}
                  </Badge>
                </div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

export function PhysioPatientNewPage() {
  const { user } = useAuth()
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })

  if (!physioQuery.data) {
    return <AppLayout><LoadingSpinner className="mx-auto mt-8 h-8 w-8" /></AppLayout>
  }

  if (!canManagePractice(physioQuery.data)) {
    return <AppLayout><p className="text-sm text-[var(--color-muted-foreground)]">{pt.saas.locked}</p></AppLayout>
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">{pt.physio.newPatient}</h1>
        <CreatePatientForm physiotherapistId={physioQuery.data.id} />
      </div>
    </AppLayout>
  )
}

export function PhysioPatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('tab') ?? 'summary'
  const { user } = useAuth()

  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const patientQuery = useQuery({
    queryKey: queryKeys.patientDetail(id ?? ''),
    queryFn: () => getPatientById(id!),
    enabled: !!id,
  })

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments({ patientId: id }),
    queryFn: () => getAppointments({ patientId: id! }),
    enabled: !!id,
  })

  const assessmentQuery = useQuery({
    queryKey: [...queryKeys.clinicalRecords(id ?? ''), 'has-initial'],
    queryFn: () => hasInitialAssessment(id!),
    enabled: !!id,
  })

  if (!physioQuery.data || patientQuery.isLoading) {
    return <AppLayout><LoadingSpinner className="mx-auto mt-8 h-8 w-8" /></AppLayout>
  }
  if (!patientQuery.data) {
    return <AppLayout><ErrorState message="Paciente não encontrado" /></AppLayout>
  }

  const patient = patientQuery.data
  const nextAppointment = appointmentsQuery.data?.find(
    (a) => isUpcoming(a.scheduled_at) && !['cancelled', 'completed', 'no_show'].includes(a.status)
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{patient.full_name}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{CLINICAL_STATUS_LABELS[patient.clinical_status]}</Badge>
              <Badge variant={patient.account_status === 'active' ? 'success' : 'outline'}>
                {ACCOUNT_STATUS_LABELS[patient.account_status]}
              </Badge>
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {[patient.email, patient.phone].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!assessmentQuery.data && (
              <Button asChild>
                <Link to={`${ROUTES.physio.patient(patient.id)}?tab=records`}>
                  {pt.physio.startAssessment}
                </Link>
              </Button>
            )}
            {canManagePractice(physioQuery.data) ? (
              <Button asChild variant="outline">
                <Link to={`${ROUTES.physio.appointmentNew}?patientId=${patient.id}`}>
                  {pt.physio.newAppointment}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>{pt.physio.newAppointment}</Button>
            )}
          </div>
        </div>

        <Tabs key={defaultTab} defaultValue={defaultTab}>
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="records">{pt.physio.clinicalRecord}</TabsTrigger>
            <TabsTrigger value="plan">{pt.physio.treatmentPlan}</TabsTrigger>
            <TabsTrigger value="appointments">Consultas</TabsTrigger>
            <TabsTrigger value="billing">{pt.physio.billing}</TabsTrigger>
            <TabsTrigger value="timeline">{pt.physio.timeline}</TabsTrigger>
            <TabsTrigger value="exercises">Exercícios</TabsTrigger>
            <TabsTrigger value="assign">{pt.physio.assignExercise}</TabsTrigger>
            <TabsTrigger value="invite">Convite</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">{pt.physio.treatmentStatus}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{CLINICAL_STATUS_LABELS[patient.clinical_status]}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {pt.physio.accountLabel}: {ACCOUNT_STATUS_LABELS[patient.account_status]}
                  </p>
                  <ClinicalStatusActions
                    patientId={patient.id}
                    physiotherapistId={physioQuery.data.id}
                    status={patient.clinical_status}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">{pt.patient.nextAppointment}</CardTitle></CardHeader>
                <CardContent>
                  {nextAppointment ? (
                    <Link to={ROUTES.physio.appointment(nextAppointment.id)} className="text-[var(--color-primary)] hover:underline">
                      {new Date(nextAppointment.scheduled_at).toLocaleString('pt-BR')}
                    </Link>
                  ) : (
                    <p className="text-sm text-[var(--color-muted-foreground)]">{pt.common.noAppointment}</p>
                  )}
                </CardContent>
              </Card>
            </div>
            <TreatmentPlanCard patientId={patient.id} />
            {!assessmentQuery.data && (
              <Card>
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="font-medium">{pt.physio.awaitingAssessment}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Realize a avaliação inicial para iniciar o plano terapêutico.
                    </p>
                  </div>
                  <Button asChild>
                    <Link to={`${ROUTES.physio.patient(patient.id)}?tab=records`}>
                      {pt.physio.startAssessment}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <ClinicalRecordWorkspace physiotherapistId={physioQuery.data.id} patientId={patient.id} />
          </TabsContent>
          <TabsContent value="plan" className="space-y-4">
            <TreatmentPlanCard patientId={patient.id} />
            <DischargePlanButton patientId={patient.id} />
            <TreatmentPlanForm physiotherapistId={physioQuery.data.id} patientId={patient.id} />
          </TabsContent>
          <TabsContent value="appointments">
            <AppointmentList
              appointments={appointmentsQuery.data ?? []}
              loading={appointmentsQuery.isLoading}
              role="physiotherapist"
            />
          </TabsContent>
          <TabsContent value="billing">
            <PatientBillingPanel patientId={patient.id} physiotherapistId={physioQuery.data.id} />
          </TabsContent>
          <TabsContent value="timeline">
            <ClinicalTimeline patientId={patient.id} />
          </TabsContent>
          <TabsContent value="exercises">
            <PatientExerciseList patientId={patient.id} />
          </TabsContent>
          <TabsContent value="assign" className="space-y-4">
            <AssignExerciseForm patientId={patient.id} physiotherapistId={physioQuery.data.id} />
            <ExerciseLibraryEditor />
          </TabsContent>
          <TabsContent value="invite">
            <PatientInvitePanel
              patientId={patient.id}
              physiotherapistId={physioQuery.data.id}
              invitedBy={user!.id}
              email={patient.email}
              accountStatus={patient.account_status}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export function PhysioAppointmentNewPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedPatientId = searchParams.get('patientId') ?? undefined
  const preselectedDate = searchParams.get('date') ?? undefined
  const preselectedTime = searchParams.get('time') ?? undefined
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })

  if (!physioQuery.data) {
    return <AppLayout><LoadingSpinner className="mx-auto mt-8 h-8 w-8" /></AppLayout>
  }

  if (!canManagePractice(physioQuery.data)) {
    return <AppLayout><p className="text-sm text-[var(--color-muted-foreground)]">{pt.saas.locked}</p></AppLayout>
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">{pt.physio.newAppointment}</h1>
        <PhysioCreateAppointmentForm
          physiotherapistId={physioQuery.data.id}
          preselectedPatientId={preselectedPatientId}
          preselectedDate={preselectedDate}
          preselectedTime={preselectedTime}
        />
      </div>
    </AppLayout>
  )
}

export function PhysioAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })
  const query = useQuery({
    queryKey: queryKeys.appointment(id!),
    queryFn: () => getAppointmentById(id!),
    enabled: !!id,
  })

  if (query.isLoading) return <AppLayout><LoadingSpinner className="mx-auto mt-8 h-8 w-8" /></AppLayout>
  if (query.error || !query.data) return <AppLayout><ErrorState message="Consulta não encontrada" /></AppLayout>

  return (
    <AppLayout>
      <div className="space-y-6">
        <AppointmentSession appointment={query.data} role="physiotherapist" />
        {physioQuery.data && query.data.status === 'completed' && (
          <ClinicalRecordWorkspace
            appointmentId={query.data.id}
            physiotherapistId={physioQuery.data.id}
            patientId={query.data.patient_id}
          />
        )}
      </div>
    </AppLayout>
  )
}

const physioProfileSchema = z.object({
  licenseNumber: z.string().optional(),
  province: z.string().optional(),
  experienceYears: z.coerce.number().optional(),
  bio: z.string().optional(),
})

export function PhysioProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const { register, handleSubmit, setValue, watch } = useForm({
    resolver: zodResolver(physioProfileSchema),
    values: {
      licenseNumber: physioQuery.data?.license_number ?? '',
      province: physioQuery.data?.province ?? '',
      experienceYears: physioQuery.data?.experience_years ?? undefined,
      bio: physioQuery.data?.bio ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof physioProfileSchema>) =>
      updatePhysiotherapist(physioQuery.data!.id, {
        license_number: data.licenseNumber || null,
        province: data.province || null,
        experience_years: data.experienceYears ?? null,
        bio: data.bio || null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.physiotherapist(user!.id) }),
  })

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">{pt.physio.professionalProfile}</h1>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>{pt.physio.licenseNumber}</Label>
                <Input {...register('licenseNumber')} />
              </div>
              <div className="space-y-2">
                <Label>{pt.clinicalRecord.province}</Label>
                <Select value={watch('province')} onValueChange={(v) => setValue('province', v)}>
                  <SelectTrigger><SelectValue placeholder={pt.common.select} /></SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_UFS.map((uf) => (
                      <SelectItem key={uf.code} value={uf.code}>{uf.code} — {uf.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{pt.physio.experienceYears}</Label>
                <Input type="number" {...register('experienceYears')} />
              </div>
              <div className="space-y-2">
                <Label>{pt.physio.bio}</Label>
                <Textarea {...register('bio')} />
              </div>
              <Button type="submit" disabled={mutation.isPending}>{pt.common.save}</Button>
            </form>
          </CardContent>
        </Card>
        {physioQuery.data && <AvailabilityEditor physiotherapistId={physioQuery.data.id} />}
      </div>
    </AppLayout>
  )
}

export function PhysioNotificationsPage() {
  const { user } = useAuth()
  if (!user) return <AppLayout><LoadingSpinner className="mx-auto mt-8 h-8 w-8" /></AppLayout>
  return (
    <AppLayout>
      <NotificationInbox userId={user.id} />
    </AppLayout>
  )
}
