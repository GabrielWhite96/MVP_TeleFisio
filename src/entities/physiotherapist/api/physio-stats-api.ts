import { supabase } from '@/shared/api/supabase'
import { getAtRiskPatients } from '@/entities/notification/api/notification-api'

export interface PhysioPatientStats {
  active: number
  atRisk: number
  awaiting: number
  discharged: number
  paused: number
  reassessment: number
  total: number
}

export async function getPhysioPatientStats(physiotherapistId: string): Promise<PhysioPatientStats> {
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, clinical_status')
    .eq('physiotherapist_id', physiotherapistId)

  if (error) throw error

  const list = patients ?? []
  let active = 0
  let awaiting = 0
  let discharged = 0
  let paused = 0
  let reassessment = 0

  for (const patient of list) {
    switch (patient.clinical_status) {
      case 'in_treatment':
        active += 1
        break
      case 'awaiting_assessment':
        awaiting += 1
        break
      case 'discharged':
        discharged += 1
        break
      case 'paused':
        paused += 1
        break
      case 'reassessment':
        reassessment += 1
        break
    }
  }

  const atRisk = (await getAtRiskPatients(physiotherapistId)).length

  return {
    active,
    atRisk,
    awaiting,
    discharged,
    paused,
    reassessment,
    total: list.length,
  }
}
