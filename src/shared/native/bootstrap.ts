import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { configureRevenueCat } from './revenuecat'

/** Initialize native chrome once on Capacitor platforms. Safe no-op on web. */
export async function bootstrapNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    await StatusBar.setStyle({ style: Style.Dark })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#07241E' })
    }
  } catch {
    // Plugin may be unavailable outside a native shell.
  }

  try {
    await SplashScreen.hide()
  } catch {
    // ignore
  }

  // Purchases SDK — keys may be absent in local/dev builds.
  void configureRevenueCat()
}
