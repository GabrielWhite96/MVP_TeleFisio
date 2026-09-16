import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getAssessmentsForComparison,
  getClinicalRecords,
  getLatestInitialOrReassessment,
  hasInitialAssessment,
} from '@/entities/clinical-record/api/clinical-record-api'
import { getPatientWithProfile } from '@/entities/patient/api/patient-api'
import type { AssessmentStructuredData } from '@/entities/clinical-record/model/assessment-schema'
import { emptyAssessmentData } from '@/entities/clinical-record/model/defaults'
import { queryKeys } from '@/shared/api/query-keys'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { LoadingSpinner } from '@/shared/ui/states'
import { cn } from '@/shared/lib/utils'
import { pt } from '@/shared/config/i18n/pt'
import { AssessmentForm } from './assessment-form'
import { EvolutionForm } from './evolution-form'
import { ClinicalRecordList } from './clinical-record-list'
import { AssessmentComparison } from './assessment-comparison'

interface ClinicalRecordWorkspaceProps {
  physiotherapistId: string
  patientId: string
  appointmentId?: string
}

type Mode = 'initial' | 'evolution' | 'reassessment'
type WorkspaceTab = 'form' | 'history' | 'comparison'

function parseAssessment(raw: unknown): AssessmentStructuredData | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as AssessmentStructuredData
  if (!data.anamnese || !data.physicalExam) return null
  return data
}

export function ClinicalRecordWorkspace({
  physiotherapistId,
  patientId,
  appointmentId,
}: ClinicalRecordWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>('form')
  const [modeOverride, setModeOverride] = useState<Mode | null>(null)

  const hasInitialQuery = useQuery({
    queryKey: [...queryKeys.clinicalRecords(patientId), 'has-initial'],
    queryFn: () => hasInitialAssessment(patientId),
  })

  const recordsQuery = useQuery({
    queryKey: queryKeys.clinicalRecords(patientId),
    queryFn: () => getClinicalRecords(patientId),
  })

  const latestAssessmentQuery = useQuery({
    queryKey: [...queryKeys.clinicalRecords(patientId), 'latest-assessment'],
    queryFn: () => getLatestInitialOrReassessment(patientId),
    enabled: !!hasInitialQuery.data,
  })

  const comparisonQuery = useQuery({
    queryKey: [...queryKeys.clinicalRecords(patientId), 'comparison'],
    queryFn: () => getAssessmentsForComparison(patientId),
  })

  const patientQuery = useQuery({
    queryKey: ['patient-with-profile', patientId],
    queryFn: () => getPatientWithProfile(patientId),
  })

  const mode: Mode = useMemo(() => {
    if (hasInitialQuery.data === false) return 'initial'
    if (modeOverride) return modeOverride
    return 'evolution'
  }, [hasInitialQuery.data, modeOverride])

  const assessmentPrefill = useMemo(() => {
    const p = patientQuery.data
    const profile = p?.profiles
    return emptyAssessmentData({
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      identityDocument: p?.identity_document ?? '',
      dateOfBirth: p?.date_of_birth ?? '',
      addressLine1: p?.address_line1 ?? '',
      addressLine2: p?.address_line2 ?? '',
      city: p?.city ?? '',
      province: p?.province ?? '',
      postalCode: p?.postal_code ?? '',
    })
  }, [patientQuery.data])

  const summaryData = parseAssessment(latestAssessmentQuery.data?.structured_data)

  if (hasInitialQuery.isLoading || patientQuery.isLoading) {
    return <LoadingSpinner className="mx-auto h-8 w-8" />
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as WorkspaceTab)}
      className="space-y-4"
    >
      <TabsList className="w-full justify-start sm:w-auto">
        <TabsTrigger value="form">{pt.clinicalRecord.tabForm}</TabsTrigger>
        <TabsTrigger value="history">{pt.clinicalRecord.tabHistory}</TabsTrigger>
        <TabsTrigger value="comparison">{pt.clinicalRecord.tabComparison}</TabsTrigger>
      </TabsList>

      <TabsContent value="form" className="mt-0 space-y-4">
        {hasInitialQuery.data && (
          <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-3">
            <p className="px-1 text-xs text-[var(--color-muted-foreground)] sm:text-sm">
              {pt.clinicalRecord.registerTypeHint}
            </p>
            <div
              role="group"
              aria-label={pt.clinicalRecord.registerTypeHint}
              className="inline-flex w-full rounded-md bg-[var(--color-muted)] p-1 sm:w-auto"
            >
              <button
                type="button"
                onClick={() => setModeOverride('evolution')}
                className={cn(
                  'flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all sm:flex-none',
                  mode === 'evolution'
                    ? 'bg-[var(--color-card)] shadow-sm'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                )}
              >
                {pt.clinicalRecord.evolution}
              </button>
              <button
                type="button"
                onClick={() => setModeOverride('reassessment')}
                className={cn(
                  'flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all sm:flex-none',
                  mode === 'reassessment'
                    ? 'bg-[var(--color-card)] shadow-sm'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                )}
              >
                {pt.clinicalRecord.newReassessment}
              </button>
            </div>
          </div>
        )}

        {mode === 'initial' && (
          <AssessmentForm
            physiotherapistId={physiotherapistId}
            patientId={patientId}
            appointmentId={appointmentId}
            recordType="initial_assessment"
            defaultValues={assessmentPrefill}
            onSuccess={() => setModeOverride('evolution')}
          />
        )}
        {mode === 'reassessment' && (
          <AssessmentForm
            physiotherapistId={physiotherapistId}
            patientId={patientId}
            appointmentId={appointmentId}
            recordType="reassessment"
            defaultValues={assessmentPrefill}
            onSuccess={() => setModeOverride('evolution')}
          />
        )}
        {mode === 'evolution' && (
          <EvolutionForm
            physiotherapistId={physiotherapistId}
            patientId={patientId}
            appointmentId={appointmentId}
            assessmentSummary={summaryData}
            onSuccess={() => {
              void recordsQuery.refetch()
            }}
          />
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-0">
        {recordsQuery.isLoading ? (
          <LoadingSpinner className="mx-auto h-8 w-8" />
        ) : (
          <ClinicalRecordList records={recordsQuery.data ?? []} />
        )}
      </TabsContent>

      <TabsContent value="comparison" className="mt-0">
        {comparisonQuery.isLoading ? (
          <LoadingSpinner className="mx-auto h-8 w-8" />
        ) : (
          <AssessmentComparison assessments={comparisonQuery.data ?? []} />
        )}
      </TabsContent>
    </Tabs>
  )
}

/** @deprecated Use ClinicalRecordWorkspace — kept as thin re-export for existing imports. */
export { ClinicalRecordWorkspace as ClinicalRecordForm }
