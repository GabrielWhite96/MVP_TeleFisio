import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClinicalRecord } from '@/entities/clinical-record/api/clinical-record-api'
import { queryKeys } from '@/shared/api/query-keys'
import { Button } from '@/shared/ui/button'
import { Label, Textarea } from '@/shared/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { pt } from '@/shared/config/i18n/pt'

interface ClinicalRecordFormProps {
  appointmentId?: string
  physiotherapistId: string
  patientId: string
  onSuccess?: () => void
}

interface FormData {
  assessment: string
  observations: string
  evolution: string
  treatmentPlan: string
  recommendations: string
}

export function ClinicalRecordForm({
  appointmentId,
  physiotherapistId,
  patientId,
  onSuccess,
}: ClinicalRecordFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit } = useForm<FormData>()

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createClinicalRecord({
        appointmentId,
        physiotherapistId,
        patientId,
        assessment: data.assessment,
        observations: data.observations,
        evolution: data.evolution,
        treatmentPlan: data.treatmentPlan,
        recommendations: data.recommendations,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clinicalRecords(patientId) })
      onSuccess?.()
    },
  })

  const fields: Array<{ name: keyof FormData; label: string }> = [
    { name: 'assessment', label: 'Avaliação' },
    { name: 'observations', label: 'Observações' },
    { name: 'evolution', label: 'Evolução' },
    { name: 'treatmentPlan', label: 'Plano terapêutico' },
    { name: 'recommendations', label: 'Recomendações' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pt.physio.clinicalRecord}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {fields.map(({ name, label }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
              <Textarea id={name} {...register(name)} rows={3} />
            </div>
          ))}
          {mutation.error && (
            <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Salvar prontuário'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
