import { Preferences } from '@capacitor/preferences'
import {
  AndroidBiometryStrength,
  BiometricAuth,
  BiometryError,
  type CheckBiometryResult,
} from '@aparajita/capacitor-biometric-auth'
import { isNativeApp } from './platform'

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled'

export async function isBiometricUnlockEnabled(): Promise<boolean> {
  if (!isNativeApp()) return false
  const { value } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY })
  return value === 'true'
}

export async function setBiometricUnlockEnabled(enabled: boolean): Promise<void> {
  if (!isNativeApp()) return
  if (enabled) {
    await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: 'true' })
    return
  }
  await Preferences.remove({ key: BIOMETRIC_ENABLED_KEY })
}

export async function clearBiometricUnlockFlag(): Promise<void> {
  if (!isNativeApp()) return
  await Preferences.remove({ key: BIOMETRIC_ENABLED_KEY })
}

export async function checkDeviceBiometry(): Promise<CheckBiometryResult | null> {
  if (!isNativeApp()) return null
  try {
    return await BiometricAuth.checkBiometry()
  } catch {
    return null
  }
}

export async function authenticateWithBiometrics(reason: string): Promise<void> {
  await BiometricAuth.authenticate({
    reason,
    cancelTitle: 'Cancelar',
    allowDeviceCredential: true,
    androidTitle: 'Fisionotes',
    androidSubtitle: reason,
    androidBiometryStrength: AndroidBiometryStrength.weak,
  })
}

export function isBiometryError(error: unknown): error is BiometryError {
  return error instanceof BiometryError
}
