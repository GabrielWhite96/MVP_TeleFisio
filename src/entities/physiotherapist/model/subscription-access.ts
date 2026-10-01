import { supabase } from '@/shared/api/supabase'
import type { SaasSubscriptionStatus } from '@/shared/types/database'

export function canManagePractice(physio: {
  subscription_status: SaasSubscriptionStatus
  trial_ends_at: string | null
}) {
  if (physio.subscription_status === 'active') return true
  if (physio.subscription_status === 'inactive') return false
  if (!physio.trial_ends_at) return true
  return new Date(physio.trial_ends_at).getTime() > Date.now()
}

export function trialDaysLeft(trialEndsAt: string | null) {
  if (!trialEndsAt) return null
  return Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export async function assertPracticeWritable(physiotherapistId: string) {
  const { data, error } = await supabase
    .from('physiotherapists')
    .select('subscription_status, trial_ends_at')
    .eq('id', physiotherapistId)
    .single()
  if (error) throw error
  if (!canManagePractice(data)) {
    throw new Error('Assinatura inativa. Renove para cadastrar pacientes e consultas.')
  }
}
