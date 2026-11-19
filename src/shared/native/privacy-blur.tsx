import { useEffect, useState } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { supabase } from '@/shared/api/supabase'

/**
 * Hides clinical UI while the native app is backgrounded (PHI),
 * and lightly revalidates the auth session on resume.
 */
export function NativePrivacyBlur() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let cancelled = false

    const listenerPromise = App.addListener('appStateChange', ({ isActive }) => {
      if (cancelled) return
      setHidden(!isActive)
      if (isActive) {
        void supabase.auth.getSession()
      }
    })

    return () => {
      cancelled = true
      void listenerPromise.then((handle) => handle.remove())
    }
  }, [])

  if (!hidden) return null

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9998] bg-[var(--color-ink)]/92 backdrop-blur-xl"
      style={{ WebkitBackdropFilter: 'blur(24px)' }}
    />
  )
}
