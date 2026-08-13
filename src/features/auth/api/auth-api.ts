import { supabase, getSupabaseErrorMessage } from '@/shared/api/supabase'
import type { LoginFormData, SignupFormData, ForgotPasswordFormData } from '../model/schemas'
import type { UserRole } from '@/shared/types/database'

export async function signIn(data: LoginFormData) {
  const { data: result, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })
  if (error) throw new Error(getSupabaseErrorMessage(error))
  return result
}

export async function signUp(data: SignupFormData) {
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        role: data.role,
      },
    },
  })
  if (error) throw new Error(getSupabaseErrorMessage(error))
  return result
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(getSupabaseErrorMessage(error))
}

export async function resetPassword(data: ForgotPasswordFormData) {
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${window.location.origin}/auth/login`,
  })
  if (error) throw new Error(getSupabaseErrorMessage(error))
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data.session
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data
}

export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'physiotherapist':
      return '/physio/dashboard'
    case 'caregiver':
      return '/caregiver/dashboard'
    default:
      return '/patient/dashboard'
  }
}
