import { useEffect, useState, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { Button } from '@/shared/ui/button'
import { LoadingSpinner } from '@/shared/ui/states'
import { BrandMark } from '@/shared/ui/brand'
import {
  authenticateWithBiometrics,
  isBiometricUnlockEnabled,
  isBiometryError,
} from './biometrics'

interface BiometricGateProps {
  children: ReactNode
  /** Only gate when the user already has a session. */
  enabled: boolean
}

/**
 * Cold-start unlock gate when the user opted into biometrics.
 * Does not store credentials — only Preferences flag + Local Authentication.
 */
export function BiometricGate({ children, enabled }: BiometricGateProps) {
  const [locked, setLocked] = useState(false)
  const [checking, setChecking] = useState(Capacitor.isNativePlatform())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !enabled) {
      setLocked(false)
      setChecking(false)
      return
    }

    let cancelled = false

    async function promptUnlock() {
      setBusy(true)
      setError(null)
      try {
        await authenticateWithBiometrics('Desbloqueie para acessar o Fisionotes')
        if (!cancelled) setLocked(false)
      } catch (err) {
        if (cancelled) return
        if (isBiometryError(err) && err.code === 'userCancel') {
          setError('Desbloqueio cancelado.')
        } else {
          setError('Não foi possível desbloquear. Tente novamente.')
        }
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void (async () => {
      setChecking(true)
      const flag = await isBiometricUnlockEnabled()
      if (cancelled) return
      setLocked(flag)
      setChecking(false)
      if (flag) {
        await promptUnlock()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled])

  async function unlock() {
    setBusy(true)
    setError(null)
    try {
      await authenticateWithBiometrics('Desbloqueie para acessar o Fisionotes')
      setLocked(false)
    } catch (err) {
      if (isBiometryError(err) && err.code === 'userCancel') {
        setError('Desbloqueio cancelado.')
      } else {
        setError('Não foi possível desbloquear. Tente novamente.')
      }
    } finally {
      setBusy(false)
    }
  }

  if (!Capacitor.isNativePlatform() || !enabled) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-ink)]">
        <LoadingSpinner className="h-8 w-8 text-white" />
      </div>
    )
  }

  if (!locked) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-ink)] px-6 text-center text-[var(--color-ink-foreground)]">
      <BrandMark size="lg" layout="icon" tone="onDark" />
      <div className="space-y-2">
        <h1 className="text-xl font-bold">App bloqueado</h1>
        <p className="max-w-sm text-sm opacity-80">
          Use a biometria do aparelho para continuar. Sua senha não é armazenada no dispositivo.
        </p>
      </div>
      {error ? <p className="text-sm text-amber-200">{error}</p> : null}
      <Button type="button" onClick={() => void unlock()} disabled={busy}>
        {busy ? 'Aguardando…' : 'Desbloquear'}
      </Button>
    </div>
  )
}
