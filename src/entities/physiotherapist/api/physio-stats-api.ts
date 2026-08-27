import { supabase } from '@/shared/api/supabase'
import { getAtRiskPatients } from '@/entities/notification/api/notification-api'

export interface PhysioPatientStats {
  active: number
  atRisk: number
  awaiting: number
  discharged: number
}

export async function getPhysioPatientStats(physiotherapistId: string): Promise<PhysioPatientStats> {
  const { data: relationships, error: relError } = await supabase
    .from('care_relationships')
    .select('patient_id')
    .eq('physiotherapist_id', physiotherapistId)
    .is('ended_at', null)

  if (relError) throw relError
  const patientIds = [...new Set((relationships ?? []).map((r) => r.patient_id))]

  if (patientIds.length === 0) {
    return { active: 0, atRisk: 0, awaiting: 0, discharged: 0 }
  }

  const { data: plans, error: plansError } = await supabase
    .from('treatment_plans')
    .select('patient_id, status')
    .in('patient_id', patientIds)

  if (plansError) throw plansError

  const byPatient = new Map<string, string[]>()
  for (const plan of plans ?? []) {
    const list = byPatient.get(plan.patient_id) ?? []
    list.push(plan.status)
    byPatient.set(plan.patient_id, list)
  }

  let active = 0
  let awaiting = 0
  let discharged = 0

  for (const patientId of patientIds) {
    const statuses = byPatient.get(patientId) ?? []
    if (statuses.includes('active')) active += 1
    else if (statuses.includes('discharged') || statuses.includes('completed')) discharged += 1
    else awaiting += 1
  }

  const atRisk = (await getAtRiskPatients(physiotherapistId)).length

  return { active, atRisk, awaiting, discharged }
}
