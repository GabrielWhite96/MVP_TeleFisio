import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/shared/api/supabase'
import { queryKeys } from '@/shared/api/query-keys'
import { getProfile } from '../api/auth-api'
import type { Profile } from '@/shared/types/database'

export function useAuth() {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setInitializing(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      queryClient.invalidateQueries({ queryKey: queryKeys.session })
      if (newSession?.user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(newSession.user.id) })
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  const profileQuery = useQuery({
    queryKey: queryKeys.profile(session?.user?.id ?? ''),
    queryFn: () => getProfile(session!.user.id),
    enabled: !!session?.user?.id,
  })

  return {
    session,
    user: session?.user ?? null,
    profile: profileQuery.data as Profile | undefined,
    isLoading: initializing || (!!session && profileQuery.isLoading),
    isAuthenticated: !!session,
  }
}
