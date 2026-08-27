import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getPhysiotherapistByProfileId, getPhysioPatients, updatePhysiotherapist } from '@/entities/physiotherapist/api/physiotherapist-api'
import { getPhysioPatientStats } from '@/entities/physiotherapist/api/physio-stats-api'
import { getAppointments, getAppointmentById } from '@/entities/appointment/api/appointment-api'
import { getClinicalRecords } from '@/entities/clinical-record/api/clinical-record-api'
import { getAtRiskPatients } from '@/entities/notification/api/notification-api'
import { AppointmentSession } from '@/features/appointment-session/ui/appointment-session'
import { ClinicalRecordForm } from '@/features/clinical-record/ui/clinical-record-form'
import { AssignExerciseForm, PatientExerciseList } from '@/features/exercises/ui/exercise-components'
import { ExerciseLibraryEditor } from '@/features/exercises/ui/exercise-library-editor'
import { TreatmentPlanForm } from '@/features/treatment-plan/ui/treatment-plan-form'
import { TreatmentPlanCard } from '@/features/treatment-plan/ui/treatment-plan-card'
import { DischargePlanButton } from '@/features/treatment-plan/ui/discharge-plan-button'
import { ClinicalTimeline } from '@/features/clinical-timeline/ui/clinical-timeline'
import { AvailabilityEditor } from '@/features/scheduling/ui/availability-editor'
import { queryKeys } from '@/shared/api/query-keys'
import { AppLayout } from '@/widgets/layout/app-layout'
import { AppointmentList, StatCard } from '@/widgets/dashboard/dashboard-widgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input, Label, Textarea } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { LoadingSpinner, ErrorState, EmptyState } from '@/shared/ui/states'
import { ROUTES, CANADIAN_PROVINCES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { isToday, isUpcoming, formatDateTime } from '@/shared/lib/dates'
import { ChevronRight, AlertTriangle } from 'lucide-react'

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
    queryFn: () => getPhysioPatients(physioQuery.data!.id),
    enabled: !!physioQuery.data?.id,
  })

  const statsQuery = useQuery({
    queryKey: queryKeys.physioPatientStats(physioQuery.data?.id ?? ''),
    queryFn: () => getPhysioPatientStats(physioQuery.data!.id),
    enabled: !!physioQuery.data?.id,
  })

  const atRiskQuery = useQuery({
    queryKey: queryKeys.atRiskPatients(physioQuery.data?.id),
    queryFn: () => getAtRiskPatients(physioQuery.data!.id),
    enabled: !!physioQuery.data?.id,
  })

  const today = appointmentsQuery.data?.filter((a) => isToday(a.scheduled_at) && a.status !== 'cancelled') ?? []
  const upcoming = appointmentsQuery.data?.filter((a) => isUpcoming(a.scheduled_at) && !['cancelled', 'completed'].includes(a.status)) ?? []

  const reasonLabels: Record<string, string> = {
    high_pain: 'Dor alta',
    low_adherence: 'Baixa adesão',
    missing_check_in: 'Sem check-in',
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{pt.physio.dashboard}</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Ativos" value={statsQuery.data?.active ?? 0} loading={statsQuery.isLoading} />
          <StatCard title="Em risco" value={statsQuery.data?.atRisk ?? 0} loading={statsQuery.isLoading} />
          <StatCard title="Aguardando" value={statsQuery.data?.awaiting ?? 0} loading={statsQuery.isLoading} />
          <StatCard title="Alta" value={statsQuery.data?.discharged ?? 0} loading={statsQuery.isLoading} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title={pt.physio.todayAppointments} value={today.length} loading={appointmentsQuery.isLoading} />
          <StatCard title={pt.physio.upcoming} value={upcoming.length} loading={appointmentsQuery.isLoading} />
          <StatCard title={pt.physio.patients} value={patientsQuery.data?.length ?? 0} loading={patientsQuery.isLoading} />
        </div>
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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{pt.physio.agenda}</h1>
        <AppointmentList
          appointments={appointmentsQuery.data?.filter((a) => a.status !== 'cancelled') ?? []}
          loading={appointmentsQuery.isLoading}
          role="physiotherapist"
        />
      </div>
    </AppLayout>
  )
}

export function PhysioPatientsPage() {
  const { user } = useAuth()
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })
  const patientsQuery = useQuery({
    queryKey: queryKeys.physioPatients(physioQuery.data?.id ?? ''),
    queryFn: () => getPhysioPatients(physioQuery.data!.id),
    enabled: !!physioQuery.data?.id,
  })

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{pt.physio.patients}</h1>
        {patientsQuery.isLoading && <LoadingSpinner />}
        {!patientsQuery.data?.length && !patientsQuery.isLoading && (
          <EmptyState title="Nenhum paciente vinculado" description="Pacientes aparecem após agendamentos." />
        )}
        <div className="space-y-3">
          {patientsQuery.data?.map((p) => {
            const patient = p as unknown as { id: string; city: string | null; profiles: { full_name: string } | null }
            return (
              <Link
                key={patient.id}
                to={ROUTES.physio.patient(patient.id)}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-[var(--color-accent)]"
              >
                <div>
                  <p className="font-medium">{patient.profiles?.full_name}</p>
                  {patient.city && <p className="text-sm text-[var(--color-muted-foreground)]">{patient.city}</p>}
                </div>
                <ChevronRight className="h-5 w-5" />
              </Link>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}

export function PhysioPatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const physioQuery = useQuery({
    queryKey: queryKeys.physiotherapist(user?.id ?? ''),
    queryFn: () => getPhysiotherapistByProfileId(user!.id),
    enabled: !!user?.id,
  })

  const recordsQuery = useQuery({
    queryKey: queryKeys.clinicalRecords(id!),
    queryFn: () => getClinicalRecords(id!),
    enabled: !!id,
  })

  if (!physioQuery.data) return <AppLayout><LoadingSpinner className="mx-auto mt-8 h-8 w-8" /></AppLayout>

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Detalhes do paciente</h1>
        <Tabs defaultValue="records">
          <TabsList>
            <TabsTrigger value="records">{pt.physio.clinicalRecord}</TabsTrigger>
            <TabsTrigger value="plan">{pt.physio.treatmentPlan}</TabsTrigger>
            <TabsTrigger value="timeline">{pt.physio.timeline}</TabsTrigger>
            <TabsTrigger value="exercises">Exercícios</TabsTrigger>
            <TabsTrigger value="assign">{pt.physio.assignExercise}</TabsTrigger>
          </TabsList>
          <TabsContent value="records" className="space-y-4">
            <ClinicalRecordForm physiotherapistId={physioQuery.data.id} patientId={id!} />
            {recordsQuery.data?.map((r) => (
              <Card key={r.id}>
                <CardHeader><CardTitle className="text-sm">{formatDateTime(r.created_at)}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {r.assessment && <p><strong>Avaliação:</strong> {r.assessment}</p>}
                  {r.evolution && <p><strong>Evolução:</strong> {r.evolution}</p>}
                  {r.treatment_plan && <p><strong>Plano:</strong> {r.treatment_plan}</p>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="plan" className="space-y-4">
            <TreatmentPlanCard patientId={id!} />
            <DischargePlanButton patientId={id!} />
            <TreatmentPlanForm physiotherapistId={physioQuery.data.id} patientId={id!} />
          </TabsContent>
          <TabsContent value="timeline">
            <ClinicalTimeline patientId={id!} />
          </TabsContent>
          <TabsContent value="exercises">
            <PatientExerciseList patientId={id!} />
          </TabsContent>
          <TabsContent value="assign" className="space-y-4">
            <AssignExerciseForm patientId={id!} physiotherapistId={physioQuery.data.id} />
            <ExerciseLibraryEditor />
          </TabsContent>
        </Tabs>
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
          <ClinicalRecordForm
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
        <h1 className="text-2xl font-bold">Perfil profissional</h1>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label>Registro profissional</Label>
                <Input {...register('licenseNumber')} />
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
              <div className="space-y-2">
                <Label>Anos de experiência</Label>
                <Input type="number" {...register('experienceYears')} />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
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
