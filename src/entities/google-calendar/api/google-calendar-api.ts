import { supabase } from '@/shared/api/supabase'

export type GoogleCalendarConnectionStatus = {
  physiotherapist_id: string
  google_account_email: string | null
  calendar_id: string
  sync_enabled: boolean
  connected_at: string
  updated_at: string
}

export async function getGoogleCalendarConnection(physiotherapistId: string) {
  const { data, error } = await supabase
    .from('google_calendar_connections')
    .select('physiotherapist_id, google_account_email, calendar_id, sync_enabled, connected_at, updated_at')
    .eq('physiotherapist_id', physiotherapistId)
    .maybeSingle()

  if (error) throw error
  return data as GoogleCalendarConnectionStatus | null
}

export async function startGoogleCalendarOAuth(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('google-calendar-oauth-start', {
    body: {},
  })
  if (error) throw error
  if (!data?.url) throw new Error(data?.error ?? 'Não foi possível iniciar a conexão com o Google')
  return data.url as string
}

export async function disconnectGoogleCalendar() {
  const { data, error } = await supabase.functions.invoke('google-calendar-disconnect', {
    body: {},
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export async function syncAppointmentToGoogleCalendar(
  appointmentId: string,
  options?: { delete?: boolean }
) {
  try {
    const { error } = await supabase.functions.invoke('google-calendar-sync', {
      body: {
        appointmentId,
        delete: options?.delete === true,
      },
    })
    if (error) {
      console.warn('[google-calendar-sync]', error.message)
    }
  } catch (err) {
    console.warn('[google-calendar-sync]', err)
  }
}

export async function backfillGoogleCalendar() {
  const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
    body: { backfill: true },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data as { ok: boolean; synced: number; errors: number }
}
