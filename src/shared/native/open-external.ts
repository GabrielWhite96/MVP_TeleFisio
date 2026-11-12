import { Browser } from '@capacitor/browser'
import { isNativeApp } from './platform'

/** Open an https URL in the system/in-app browser on native; assign on web. */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return

  if (isNativeApp()) {
    await Browser.open({ url })
    return
  }

  window.location.assign(url)
}
