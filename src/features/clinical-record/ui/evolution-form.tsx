import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClinicalRecord } from '@/entities/clinical-record/api/clinical-record-api'
import { getPatientExercises } from '@/entities/exercise/api/exercise-api'
import type { AssessmentStructuredData } from '@/entities/clinical-record/model/assessment-schema'
import type { EvolutionStructuredData } from '@/entities/clinical-record/model/evolution-schema'
import { emptyEvolutionData } from '@/entities/clinical-record/model/defaults'
import {
  EVOLUTION_PERFORMED_OPTIONS,
  EVOLUTION_EXERCISE_OPTIONS,
  EVOLUTION_TRAINING_OPTIONS,
  EVOLUTION_STRENGTHENING_OPTIONS,
  EVOLUTION_CHANGES_OPTIONS,
  EVOLUTION_CONDUCT_OPTIONS,
} from '@/entities/clinical-record/model/clinical-options'
import { queryKeys } from '@/shared/api/query-keys'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Label, Textarea } from '@/shared/ui/input'
import { pt } from '@/shared/config/i18n/pt'
import { VitalSignsFields } from './fields/vital-signs-fields'
import { ActivityMarkBlock } from './fields/activity-mark-block'
import { AssessmentSummaryPanel } from './assessment-summary-panel'

type ActivityKey = keyof Pick<
  EvolutionStructuredData,
  'performed' | 'exercises' | 'training' | 'strengthening' | 'changes' | 'conduct'
>

const ACTIVITY_DEFS: Array<{ key: ActivityKey; label: string; catalog: string[] }> = [
  { key: 'performed', label: pt.clinicalRecord.performed, catalog: EVOLUTION_PERFORMED_OPTIONS },
  { key: 'exercises', label: pt.clinicalRecord.exercises, catalog: EVOLUTION_EXERCISE_OPTIONS },
  { key: 'training', label: pt.clinicalRecord.training, catalog: EVOLUTION_TRAINING_OPTIONS },
  { key: 'strengthening', label: pt.clinicalRecord.strengthening, catalog: EVOLUTION_STRENGTHENING_OPTIONS },
  { key: 'changes', label: pt.clinicalRecord.changesObserved, catalog: EVOLUTION_CHANGES_OPTIONS },
  { key: 'conduct', label: pt.clinicalRecord.conduct, catalog: EVOLUTION_CONDUCT_OPTIONS },
]

interface EvolutionFormProps {
  physiotherapistId: string
  patientId: string
  appointmentId?: string
  assessmentSummary: AssessmentStructuredData | null
  onSuccess?: () => void
}

export function EvolutionForm({
  physiotherapistId,
  patientId,
  appointmentId,
  assessmentSummary,
  onSuccess,
}: EvolutionFormProps) {
  const queryClient = useQueryClient()
  const { control, handleSubmit, watch, setValue } = useForm<EvolutionStructuredData>({
    defaultValues: emptyEvolutionData(),
  })

  const patientExercisesQuery = useQuery({
    queryKey: queryKeys.patientExercises(patientId),
    queryFn: () => getPatientExercises(patientId),
  })

  const exerciseOptions = useMemo(() => {
    const fromPatient =
      patientExercisesQuery.data
        ?.map((row) => {
          const ex = row.exercise as { title?: string } | { title?: string }[] | null
          if (!ex) return null
          const item = Array.isArray(ex) ? ex[0] : ex
          return item?.title?.trim() || null
        })
        .filter((t): t is string => Boolean(t)) ?? []
    return Array.from(new Set([...EVOLUTION_EXERCISE_OPTIONS, ...fromPatient]))
  }, [patientExercisesQuery.data])

  const optionsFor = (key: ActivityKey, catalog: string[]) =>
    key === 'exercises' ? exerciseOptions : catalog

  const mutation = useMutation({
    mutationFn: (data: EvolutionStructuredData) =>
      createClinicalRecord({
        appointmentId,
        physiotherapistId,
        patientId,
        recordType: 'evolution',
        structuredData: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clinicalRecords(patientId) })
      onSuccess?.()
    },
  })

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="order-2 space-y-4 lg:order-1">
        <Card>
          <CardHeader>
            <CardTitle>{pt.clinicalRecord.evolution}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
              <section className="space-y-2">
                <Label>{pt.clinicalRecord.vitalSigns}</Label>
                <Controller
                  name="vitals"
                  control={control}
                  render={({ field }) => (
                    <VitalSignsFields value={field.value} onChange={field.onChange} />
                  )}
                />
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">{pt.clinicalRecord.sessionConducts}</h3>
                {ACTIVITY_DEFS.map(({ key, label, catalog }) => (
                  <ActivityMarkBlock
                    key={key}
                    label={label}
                    options={optionsFor(key, catalog)}
                    items={watch(`${key}.items`) ?? []}
                    notes={watch(`${key}.notes`) ?? ''}
                    onItemsChange={(items) => setValue(`${key}.items`, items)}
                    onNotesChange={(notes) => setValue(`${key}.notes`, notes)}
                    onDoneChange={(done) => setValue(`${key}.done`, done)}
                  />
                ))}
              </section>

              <details className="group rounded-md border border-[var(--color-border)] p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  {pt.clinicalRecord.generalObservationsOptional}
                </summary>
                <div className="mt-2">
                  <Controller
                    name="observations"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        id="evo-obs"
                        rows={2}
                        placeholder={pt.clinicalRecord.optionalObservation}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </details>

              {mutation.error && (
                <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
              )}
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? pt.common.loading : pt.clinicalRecord.saveRecord}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="order-1 lg:order-2">
        <AssessmentSummaryPanel data={assessmentSummary} sticky />
      </div>
    </div>
  )
}
