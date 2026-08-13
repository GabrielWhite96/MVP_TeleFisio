import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/shared/config/env'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> = createClient(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export function getSupabaseErrorMessage(error: { message?: string } | null): string {
  if (!error?.message) return 'Ocorreu um erro inesperado.'
  const map: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha inválidos.',
    'User already registered': 'Este e-mail já está cadastrado.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
  }
  return map[error.message] ?? error.message
}
