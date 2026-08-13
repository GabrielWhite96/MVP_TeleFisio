import { supabase } from '@/shared/api/supabase'

export type ConsentType =
  | 'telehealth'
  | 'privacy'
  | 'caregiver_access'
  | 'data_processing'
  | 'terms'

export const REQUIRED_CONSENT_TYPES: ConsentType[] = [
  'telehealth',
  'privacy',
  'data_processing',
  'terms',
]

export interface Consent {
  id: string
  patient_id: string
  type: ConsentType
  version: string
  accepted_at: string
  revoked_at: string | null
  created_at: string
}

export interface AcceptConsentInput {
  patientId: string
  type: ConsentType
  version?: string
}

export async function getConsents(patientId: string): Promise<Consent[]> {
  const { data, error } = await supabase
    .from('consents')
    .select('*')
    .eq('patient_id', patientId)
    .order('accepted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Consent[]
}

export async function acceptConsent(input: AcceptConsentInput): Promise<Consent> {
  const { data, error } = await supabase
    .from('consents')
    .insert({
      patient_id: input.patientId,
      type: input.type,
      version: input.version ?? '1.0',
      accepted_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .select()
    .single()
  if (error) throw error
  return data as Consent
}

export async function hasRequiredConsents(patientId: string): Promise<boolean> {
  const consents = await getConsents(patientId)
  const activeTypes = new Set(
    consents.filter((c) => !c.revoked_at).map((c) => c.type)
  )
  return REQUIRED_CONSENT_TYPES.every((type) => activeTypes.has(type))
}
