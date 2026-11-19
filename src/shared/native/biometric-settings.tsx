import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import {
  authenticateWithBiometrics,
  checkDeviceBiometry,
  isBiometricUnlockEnabled,
  isBiometryError,
  setBiometricUnlockEnabled,
} from './biometrics'

/** Profile toggle: enable/disable biometric unlock (native only). */
export function BiometricUnlockSettings() {
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [available, setAvailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let cancelled = false
    void (async () => {
      const [flag, info] = await Promise.all([
        isBiometricUnlockEnabled(),
        checkDeviceBiometry(),
      ])
      if (cancelled) return
      setEnabled(flag)
      setAvailable(Boolean(info?.isAvailable || info?.strongBiometryIsAvailable))
      setVisible(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!visible) return null

  async function toggle(next: boolean) {
    setBusy(true)
    setMessage(null)
    try {
      if (next) {
        if (!available) {
          setMessage('Biometria não disponível neste aparelho.')
          return
        }
        await authenticateWithBiometrics('Confirme para ativar o desbloqueio biométrico')
        await setBiometricUnlockEnabled(true)
        setEnabled(true)
        setMessage('Desbloqueio biométrico ativado.')
      } else {
        await setBiometricUnlockEnabled(false)
        setEnabled(false)
        setMessage('Desbloqueio biométrico desativado.')
      }
    } catch (err) {
      if (isBiometryError(err) && err.code === 'userCancel') {
        setMessage('Ativação cancelada.')
      } else {
        setMessage('Não foi possível atualizar a biometria.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div>
          <h2 className="text-base font-bold">Desbloquear com biometria</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            No próximo acesso ao app, peça Face ID / digital. A senha não é salva no aparelho.
          </p>
        </div>
        {!available ? (
          <p className="text-sm text-amber-700">Biometria indisponível ou não configurada no sistema.</p>
        ) : null}
        <Button
          type="button"
          variant={enabled ? 'outline' : 'default'}
          disabled={busy || (!available && !enabled)}
          onClick={() => void toggle(!enabled)}
        >
          {busy ? 'Aguarde…' : enabled ? 'Desativar biometria' : 'Ativar biometria'}
        </Button>
        {message ? <p className="text-sm text-[var(--color-muted-foreground)]">{message}</p> : null}
      </CardContent>
    </Card>
  )
}
