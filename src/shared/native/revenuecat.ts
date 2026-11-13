import { getNativePlatform, isNativeApp } from './platform'

const ENTITLEMENT_ID =
  (import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID as string | undefined)?.trim() ||
  'fisionotes_pro'

let configured = false
let configuring: Promise<boolean> | null = null

function apiKeyForPlatform(): string | null {
  const platform = getNativePlatform()
  if (platform === 'ios') {
    return (import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined)?.trim() || null
  }
  if (platform === 'android') {
    return (import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as string | undefined)?.trim() || null
  }
  return null
}

/** Configure Purchases once on native shells. No-op on web or without API keys. */
export async function configureRevenueCat(): Promise<boolean> {
  if (!isNativeApp()) return false
  if (configured) return true
  if (configuring) return configuring

  configuring = (async () => {
    const apiKey = apiKeyForPlatform()
    if (!apiKey) {
      console.warn('[revenuecat] missing public API key for platform', getNativePlatform())
      return false
    }
    try {
      const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor')
      await Purchases.setLogLevel({ level: LOG_LEVEL.INFO })
      await Purchases.configure({ apiKey })
      configured = true
      return true
    } catch (error) {
      console.warn('[revenuecat] configure failed', error)
      return false
    } finally {
      configuring = null
    }
  })()

  return configuring
}

/** Identify the Supabase auth user as RevenueCat app_user_id. */
export async function identifyRevenueCatUser(appUserId: string | null | undefined): Promise<void> {
  if (!appUserId || !isNativeApp()) return
  const ok = await configureRevenueCat()
  if (!ok) return
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    await Purchases.logIn({ appUserID: appUserId })
  } catch (error) {
    console.warn('[revenuecat] logIn failed', error)
  }
}

export async function logoutRevenueCat(): Promise<void> {
  if (!isNativeApp() || !configured) return
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    await Purchases.logOut()
  } catch {
    // ignore
  }
}

export function getRevenueCatEntitlementId() {
  return ENTITLEMENT_ID
}

export async function purchaseDefaultRevenueCatPackage(): Promise<{
  active: boolean
  customerInfo: unknown
}> {
  const ok = await configureRevenueCat()
  if (!ok) throw new Error('Assinatura da loja não está configurada neste build.')

  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  const offerings = await Purchases.getOfferings()
  const packages = offerings.current?.availablePackages ?? []
  const pkg =
    packages.find((item) => item.identifier === '$rc_monthly') ??
    packages[0] ??
    null
  if (!pkg) throw new Error('Nenhum pacote de assinatura disponível na loja.')

  const result = await Purchases.purchasePackage({ aPackage: pkg })
  const entitlement = result.customerInfo.entitlements.active[ENTITLEMENT_ID]
  return { active: Boolean(entitlement), customerInfo: result.customerInfo }
}

export async function restoreRevenueCatPurchases(): Promise<{
  active: boolean
  customerInfo: unknown
}> {
  const ok = await configureRevenueCat()
  if (!ok) throw new Error('Assinatura da loja não está configurada neste build.')

  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  const { customerInfo } = await Purchases.restorePurchases()
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID]
  return { active: Boolean(entitlement), customerInfo }
}

export function isRevenueCatConfiguredInEnv(): boolean {
  return Boolean(apiKeyForPlatform())
}
