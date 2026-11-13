import type { SaasBillingProvider, SaasSubscriptionStatus } from '@/shared/types/database'
import { canManagePractice } from './subscription-access'

export type PhysioBillingSnapshot = {
  subscription_status: SaasSubscriptionStatus
  trial_ends_at?: string | null
  billing_provider?: SaasBillingProvider | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  revenuecat_app_user_id?: string | null
}

/**
 * Merge a provider entitlement update into the physio row.
 * Prevents cross-provider cancel from wiping an active subscription on the other channel.
 * Keep in sync with `supabase/functions/_shared/saas-entitlement.ts`.
 */
export function mergeEntitlementUpdate(
  current: PhysioBillingSnapshot | null,
  input: {
    provider: SaasBillingProvider
    status: SaasSubscriptionStatus
    trialEndsAt?: string | null
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
    revenuecatAppUserId?: string | null
  },
): { apply: boolean; updates: Record<string, string | null> } {
  const updates: Record<string, string | null> = {}

  if (input.stripeCustomerId) updates.stripe_customer_id = input.stripeCustomerId
  if (input.stripeSubscriptionId) updates.stripe_subscription_id = input.stripeSubscriptionId
  if (input.revenuecatAppUserId) updates.revenuecat_app_user_id = input.revenuecatAppUserId

  const currentlyEntitled = current ? canManagePractice(current) : false
  const owner = current?.billing_provider ?? null

  if (input.status === 'inactive') {
    if (owner && owner !== input.provider) {
      return { apply: Object.keys(updates).length > 0, updates }
    }
    updates.subscription_status = 'inactive'
    updates.trial_ends_at = null
    updates.billing_provider = null
    return { apply: true, updates }
  }

  if (currentlyEntitled && owner && owner !== input.provider) {
    return { apply: Object.keys(updates).length > 0, updates }
  }

  updates.subscription_status = input.status
  updates.trial_ends_at = input.status === 'trialing' ? (input.trialEndsAt ?? null) : null
  updates.billing_provider = input.provider
  return { apply: true, updates }
}

export type BillingCheckoutAction =
  | 'stripe_checkout'
  | 'stripe_portal'
  | 'revenuecat_purchase'
  | 'manage_on_web'
  | 'manage_on_store'
  | 'none'

/** Which CTA the subscription UI should show for this surface + ownership. */
export function resolveBillingCheckoutAction(opts: {
  isNative: boolean
  entitled: boolean
  billingProvider: SaasBillingProvider | null | undefined
}): BillingCheckoutAction {
  const owner = opts.billingProvider ?? null

  if (opts.entitled) {
    if (owner === 'revenuecat') return 'manage_on_store'
    // stripe or legacy null
    return opts.isNative ? 'manage_on_web' : 'stripe_portal'
  }

  if (opts.isNative) return 'revenuecat_purchase'
  if (owner === 'revenuecat') return 'manage_on_store'
  return 'stripe_checkout'
}
