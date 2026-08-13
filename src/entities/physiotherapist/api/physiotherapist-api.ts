import { supabase } from '@/shared/api/supabase'
import type { AppointmentModality } from '@/shared/types/database'

export async function getPhysiotherapistByProfileId(profileId: string) {
  const { data, error } = await supabase
    .from('physiotherapists')
    .select('*')
    .eq('profile_id', profileId)
    .single()
  if (error) throw error
  return data
}

export async function getAvailablePhysiotherapists(modality?: AppointmentModality) {
  let query = supabase
    .from('physiotherapists')
    .select('*, profiles:profiles(full_name, avatar_url, phone)')

  if (modality) {
    query = query.contains('modalities', [modality])
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function updatePhysiotherapist(id: string, updates: {
  license_number?: string | null
  province?: string | null
  specialties?: string[]
  experience_years?: number | null
  modalities?: AppointmentModality[]
  service_cities?: string[]
  bio?: string | null
}) {
  const { data, error } = await supabase
    .from('physiotherapists')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getPhysioPatients(physiotherapistId: string) {
  const { data, error } = await supabase
    .from('care_relationships')
    .select(`
      patient:patients(
        id, city, province,
        profiles:profiles(full_name, phone, avatar_url)
      )
    `)
    .eq('physiotherapist_id', physiotherapistId)
    .is('ended_at', null)

  if (error) throw error
  return data?.map((r) => r.patient).filter(Boolean) ?? []
}

export async function getAvailability(physiotherapistId: string) {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('physiotherapist_id', physiotherapistId)
    .eq('is_active', true)
  if (error) throw error
  return data
}

export async function setAvailability(
  physiotherapistId: string,
  slots: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    modality: AppointmentModality
  }>
) {
  await supabase.from('availability').delete().eq('physiotherapist_id', physiotherapistId)
  if (slots.length === 0) return []
  const { data, error } = await supabase
    .from('availability')
    .insert(slots.map((s) => ({ ...s, physiotherapist_id: physiotherapistId })))
    .select()
  if (error) throw error
  return data
}
