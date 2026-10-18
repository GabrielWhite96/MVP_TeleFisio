import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, FileDown } from 'lucide-react'
import { getAppointments } from '@/entities/appointment/api/appointment-api'
import { getCheckIns, getAdherenceScore } from '@/entities/check-in/api/check-in-api'
import { getClinicalRecords } from '@/entities/clinical-record/api/clinical-record-api'
import { getPatientExercises } from '@/entities/exercise/api/exercise-api'
import { getPhysioOwnedPatients, getPatientById } from '@/entities/patient/api/patient-api'
import { getPhysiotherapistByProfileId } from '@/entities/physiotherapist/api/physiotherapist-api'
import { getActiveTreatmentPlan, getTreatmentGoals } from '@/entities/treatment-plan/api/treatment-plan-api'
import { useAuth } from '@/features/auth/hooks/use-auth'
import {
  buildPatientReport,
  type ReportExerciseInput,
  type ReportPeriod,
  type ReportRecordInput,
} from '@/features/patient-report/model/build-patient-report'
import { PatientReportDocument } from '@/features/patient-report/ui/patient-report-document'
import { queryKeys } from '@/shared/api/query-keys'
import { pt } from '@/shared/config/i18n/pt'
import { CLINICAL_STATUS_LABELS, ROUTES } from '@/shared/config/routes'
import { formatDateTime } from '@/shared/lib/dates'
import { AppLayout } from '@/widgets/layout/app-layout'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { EmptyState, ErrorState, LoadingSpinner } from '@/shared/ui/states'

const copy = pt.report

const PERIODS: Array<{ value: ReportPeriod; label: string }> = [
  { value: 'all', label: copy.periodAll },
  { value: '90d', label: copy.period90 },
  { value: '30d', label: copy.period30 },
]

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function mapRecords(rows: unknown): ReportRecordInput[] {
  if (!Array.isArray(rows)) return []
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return []
    const record = row as ReportRecordInput
    if (!record.id || !record.created_at || !record.record_type) return []
    return [{
      id: record.id,
      record_type: record.record_type,
      structured_data: record.structured_data ?? null,
      created_at: record.created_at,
      next_evaluation_at: record.next_evaluation_at ?? null,
      observations: record.observations ?? null,
      evolution: record.evolution ?? null,
    }]
  })
}

function mapExercises(rows: unknown): ReportExerciseInput[] {
  if (!Array.isArray(rows)) return []
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return []
    const item = row as {
      id?: string
      active?: boolean
      sets?: number | null
      reps?: number | null
      frequency?: string | null
      exercise?: { title?: string } | Array<{ title?: string }> | null
      completions?: Array<{ completed_at?: string }> | null
    }
    if (!item.id || item.active === false) return []
    const exercise = Array.isArray(item.exercise) ? item.exercise[0] : item.exercise
    return [{
      id: item.id,
      title: exercise?.title || copy.exercise,
      sets: item.sets ?? null,
      reps: item.reps ?? null,
      frequency: item.frequency ?? null,
      completions: (item.completions ?? [])
        .filter((completion) => Boolean(completion.completed_at))
        .map((completion) => ({ completed_at: completion.completed_at as string })),
    }]
  })
}

export function PhysioReportsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
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
    const query = search.trim().toLowerCase()
    return (patientsQuery.data ?? []).filter((patient) => {
      if (!query) return true
      return (
        patient.full_name.toLowerCase().includes(query) ||
        (patient.email ?? '').toLowerCase().includes(query) ||
        (patient.phone ?? '').toLowerCase().includes(query)
      )
    })
  }, [patientsQuery.data, search])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{copy.title}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{copy.subtitle}</p>
        </div>
        <Input
          placeholder={copy.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {(physioQuery.isLoading || patientsQuery.isLoading) && <LoadingSpinner />}
        {!filtered.length && !patientsQuery.isLoading && !physioQuery.isLoading && (
          <EmptyState title={copy.empty} description={copy.emptyHint} />
        )}
        <div className="space-y-3">
          {filtered.map((patient) => (
            <Link
              key={patient.id}
              to={ROUTES.physio.patientReport(patient.id)}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-[var(--color-accent)]"
            >
              <div className="space-y-1">
                <p className="font-medium">{patient.full_name}</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {[patient.email, patient.city].filter(Boolean).join(' · ')}
                </p>
                <Badge variant="secondary">{CLINICAL_STATUS_LABELS[patient.clinical_status]}</Badge>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

export function PhysioPatientReportPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [period, setPeriod] = useState<ReportPeriod>('all')
  const [conclusion, setConclusion] = useState('')
  const [issuedAt] = useState(() => formatDateTime(new Date()))

  const patientQuery = useQuery({
    queryKey: queryKeys.patientDetail(id ?? ''),
    queryFn: () => getPatientById(id!),
    enabled: !!id,
  })
  const recordsQuery = useQuery({
    queryKey: queryKeys.clinicalRecords(id ?? ''),
    queryFn: () => getClinicalRecords(id!),
    enabled: !!id,
  })
  const checkInsQuery = useQuery({
    queryKey: queryKeys.checkIns(id ?? ''),
    queryFn: () => getCheckIns(id!),
    enabled: !!id,
  })
  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments({ patientId: id, scope: 'report' }),
    queryFn: () => getAppointments({ patientId: id! }),
    enabled: !!id,
  })
  const exercisesQuery = useQuery({
    queryKey: queryKeys.patientExercises(id ?? ''),
    queryFn: () => getPatientExercises(id!),
    enabled: !!id,
  })
  const planQuery = useQuery({
    queryKey: queryKeys.activeTreatmentPlan(id ?? ''),
    queryFn: () => getActiveTreatmentPlan(id!),
    enabled: !!id,
  })
  const goalsQuery = useQuery({
    queryKey: queryKeys.treatmentGoals(planQuery.data?.id ?? ''),
    queryFn: () => getTreatmentGoals(planQuery.data!.id),
    enabled: !!planQuery.data?.id,
  })
  const adherence7Query = useQuery({
    queryKey: [...queryKeys.adherence(id ?? ''), 7],
    queryFn: () => getAdherenceScore(id!, 7),
    enabled: !!id,
  })
  const adherence30Query = useQuery({
    queryKey: [...queryKeys.adherence(id ?? ''), 30],
    queryFn: () => getAdherenceScore(id!, 30),
    enabled: !!id,
  })

  const report = useMemo(() => {
    if (!patientQuery.data) return null
    const plan = planQuery.data
    return buildPatientReport({
      period,
      now: new Date(),
      adherence7: adherence7Query.data ?? null,
      adherence30: adherence30Query.data ?? null,
      checkIns: checkInsQuery.data ?? [],
      records: mapRecords(recordsQuery.data),
      appointments: (appointmentsQuery.data ?? []).map((item) => ({
        id: item.id,
        status: item.status,
        scheduled_at: item.scheduled_at,
      })),
      exercises: mapExercises(exercisesQuery.data),
      plan: plan
        ? {
            condition: plan.condition,
            primary_goal: plan.primary_goal,
            frequency: plan.frequency,
            duration_weeks: plan.duration_weeks,
            status: plan.status,
            started_at: plan.started_at,
            goals: (goalsQuery.data ?? []).map((goal) => ({
              title: goal.title,
              metric_type: goal.metric_type,
              current_value: asNumber(goal.current_value),
              target_value: asNumber(goal.target_value),
              unit: goal.unit,
            })),
          }
        : null,
    })
  }, [
    patientQuery.data,
    period,
    adherence7Query.data,
    adherence30Query.data,
    checkInsQuery.data,
    recordsQuery.data,
    appointmentsQuery.data,
    exercisesQuery.data,
    planQuery.data,
    goalsQuery.data,
  ])

  const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? copy.periodAll
  const loading =
    patientQuery.isLoading ||
    recordsQuery.isLoading ||
    checkInsQuery.isLoading ||
    appointmentsQuery.isLoading ||
    exercisesQuery.isLoading ||
    planQuery.isLoading ||
    (planQuery.data?.id ? goalsQuery.isLoading : false) ||
    adherence7Query.isLoading ||
    adherence30Query.isLoading
  const failed =
    patientQuery.isError ||
    recordsQuery.isError ||
    checkInsQuery.isError ||
    appointmentsQuery.isError ||
    exercisesQuery.isError ||
    planQuery.isError

  const handlePrint = () => {
    const previous = document.title
    const name = patientQuery.data?.full_name ?? 'paciente'
    document.title = `Relatorio ${name}`
    const restore = () => {
      document.title = previous
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.print()
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" asChild>
              <Link to={ROUTES.physio.reports}>{copy.backToList}</Link>
            </Button>
            {id && (
              <Button variant="ghost" asChild>
                <Link to={ROUTES.physio.patient(id)}>{copy.backToPatient}</Link>
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
              <SelectTrigger className="w-52" aria-label={copy.period}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handlePrint}>
              <FileDown className="h-4 w-4" />
              {copy.print}
            </Button>
          </div>
        </div>

        {loading && <LoadingSpinner className="mx-auto mt-8 h-8 w-8" />}
        {!loading && failed && <ErrorState message={pt.common.error} />}
        {!loading && !failed && !patientQuery.data && (
          <ErrorState message="Paciente não encontrado" />
        )}
        {!loading && !failed && patientQuery.data && report && (
          <PatientReportDocument
            patientName={patientQuery.data.full_name}
            dateOfBirth={patientQuery.data.date_of_birth}
            clinicalStatus={patientQuery.data.clinical_status}
            physioName={profile?.full_name ?? ''}
            periodLabel={periodLabel}
            issuedAt={issuedAt}
            report={report}
            conclusion={conclusion}
            onConclusionChange={setConclusion}
          />
        )}
      </div>
    </AppLayout>
  )
}
