import { supabase } from '@/shared/api/supabase'

export async function getClinicalRecords(patientId: string) {
  const { data, error } = await supabase
    .from('clinical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createClinicalRecord(input: {
  appointmentId?: string
  physiotherapistId: string
  patientId: string
  assessment?: string
  observations?: string
  evolution?: string
  treatmentPlan?: string
  recommendations?: string
  nextEvaluationAt?: string
}) {
  const { data, error } = await supabase
    .from('clinical_records')
    .insert({
      appointment_id: input.appointmentId ?? null,
      physiotherapist_id: input.physiotherapistId,
      patient_id: input.patientId,
      assessment: input.assessment ?? null,
      observations: input.observations ?? null,
      evolution: input.evolution ?? null,
      treatment_plan: input.treatmentPlan ?? null,
      recommendations: input.recommendations ?? null,
      next_evaluation_at: input.nextEvaluationAt ?? null,
    })
    .select()
    .single()
  if (error) throw error

  await supabase.rpc('log_audit_event', {
    p_action: 'CLINICAL_RECORD_CREATED',
    p_entity_type: 'clinical_records',
    p_entity_id: data.id,
  })

  return data
}

export async function updateClinicalRecord(id: string, updates: {
  assessment?: string
  observations?: string
  evolution?: string
  treatment_plan?: string
  recommendations?: string
  next_evaluation_at?: string
}) {
  const { data, error } = await supabase
    .from('clinical_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  await supabase.rpc('log_audit_event', {
    p_action: 'CLINICAL_RECORD_UPDATED',
    p_entity_type: 'clinical_records',
    p_entity_id: id,
  })

  return data
}
