import { supabase } from '@/shared/api/supabase'

export async function getPatientByProfileId(profileId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('profile_id', profileId)
    .single()
  if (error) throw error
  return data
}

export async function getPatientWithProfile(patientId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*, profiles(*)')
    .eq('id', patientId)
    .single()
  if (error) throw error
  return data as typeof data & {
    profiles: {
      id: string
      full_name: string
      phone: string | null
    } | null
  }
}

export async function updatePatient(id: string, updates: {
  date_of_birth?: string | null
  identity_document?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
}) {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(id: string, updates: {
  full_name?: string
  phone?: string | null
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}
