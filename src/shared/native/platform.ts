import { Capacitor } from '@capacitor/core'

/** True when running inside a Capacitor Android/iOS shell. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * True when the UI should use the native (app) chrome.
 * On device this matches `isNativeApp()`. In DEV only, set
 * `VITE_PREVIEW_NATIVE_UI=1` to preview native layouts in the browser.
 * Plugin calls (biometrics, RevenueCat, etc.) must still use `isNativeApp()`.
 */
export function isNativeUi(): boolean {
  if (isNativeApp()) return true
  if (import.meta.env.DEV && import.meta.env.VITE_PREVIEW_NATIVE_UI === '1') return true
  return false
}

export function getNativePlatform(): 'ios' | 'android' | 'web' {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios' || platform === 'android') return platform
  return 'web'
}
