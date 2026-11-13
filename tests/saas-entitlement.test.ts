import { describe, it, expect } from 'vitest'
import {
  mergeEntitlementUpdate,
  resolveBillingCheckoutAction,
} from '@/entities/physiotherapist/model/saas-entitlement'

const entitledStripe = {
  subscription_status: 'active' as const,
  trial_ends_at: null,
  billing_provider: 'stripe' as const,
}

const entitledRc = {
  subscription_status: 'active' as const,
  trial_ends_at: null,
  billing_provider: 'revenuecat' as const,
}

describe('mergeEntitlementUpdate', () => {
  it('activates stripe and sets ownership', () => {
    const result = mergeEntitlementUpdate(null, {
      provider: 'stripe',
      status: 'active',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
    })
    expect(result.apply).toBe(true)
    expect(result.updates.subscription_status).toBe('active')
    expect(result.updates.billing_provider).toBe('stripe')
    expect(result.updates.stripe_customer_id).toBe('cus_1')
  })

  it('ignores revenuecat activation while stripe owns an active sub', () => {
    const result = mergeEntitlementUpdate(entitledStripe, {
      provider: 'revenuecat',
      status: 'active',
      revenuecatAppUserId: 'uid-1',
    })
    expect(result.updates.subscription_status).toBeUndefined()
    expect(result.updates.billing_provider).toBeUndefined()
    expect(result.updates.revenuecat_app_user_id).toBe('uid-1')
  })

  it('ignores stripe cancel while revenuecat owns the sub', () => {
    const result = mergeEntitlementUpdate(entitledRc, {
      provider: 'stripe',
      status: 'inactive',
    })
    expect(result.updates.subscription_status).toBeUndefined()
  })

  it('clears billing_provider when the owning channel expires', () => {
    const result = mergeEntitlementUpdate(entitledRc, {
      provider: 'revenuecat',
      status: 'inactive',
    })
    expect(result.apply).toBe(true)
    expect(result.updates.subscription_status).toBe('inactive')
    expect(result.updates.billing_provider).toBeNull()
  })

  it('maps trialing with trial end', () => {
    const ends = new Date(Date.now() + 86_400_000).toISOString()
    const result = mergeEntitlementUpdate(null, {
      provider: 'revenuecat',
      status: 'trialing',
      trialEndsAt: ends,
      revenuecatAppUserId: 'uid-2',
    })
    expect(result.updates.subscription_status).toBe('trialing')
    expect(result.updates.trial_ends_at).toBe(ends)
    expect(result.updates.billing_provider).toBe('revenuecat')
  })
})

describe('resolveBillingCheckoutAction', () => {
  it('uses Stripe checkout on web when inactive', () => {
    expect(
      resolveBillingCheckoutAction({
        isNative: false,
        entitled: false,
        billingProvider: null,
      }),
    ).toBe('stripe_checkout')
  })

  it('uses RevenueCat purchase on native when inactive', () => {
    expect(
      resolveBillingCheckoutAction({
        isNative: true,
        entitled: false,
        billingProvider: null,
      }),
    ).toBe('revenuecat_purchase')
  })

  it('keeps store management when RC owns an active sub on web', () => {
    expect(
      resolveBillingCheckoutAction({
        isNative: false,
        entitled: true,
        billingProvider: 'revenuecat',
      }),
    ).toBe('manage_on_store')
  })

  it('hides Stripe portal on native for Stripe-owned active subs', () => {
    expect(
      resolveBillingCheckoutAction({
        isNative: true,
        entitled: true,
        billingProvider: 'stripe',
      }),
    ).toBe('manage_on_web')
  })

  it('blocks Stripe checkout on web when RC previously owned (renew on store)', () => {
    expect(
      resolveBillingCheckoutAction({
        isNative: false,
        entitled: false,
        billingProvider: 'revenuecat',
      }),
    ).toBe('manage_on_store')
  })
})
