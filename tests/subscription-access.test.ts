import { describe, it, expect } from 'vitest'
import {
  canManagePractice,
  isInTrial,
  isPhysioHubPath,
  trialDaysLeft,
} from '@/entities/physiotherapist/model/subscription-access'
import { SAAS_PLAN } from '@/shared/config/saas-plan'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'

describe('canManagePractice', () => {
  it('allows active subscriptions', () => {
    expect(canManagePractice({ subscription_status: 'active', trial_ends_at: null })).toBe(true)
  })

  it('blocks inactive subscriptions', () => {
    expect(canManagePractice({ subscription_status: 'inactive', trial_ends_at: null })).toBe(false)
  })

  it('allows Stripe free trial while it is still running', () => {
    expect(
      canManagePractice({
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 86_400_000).toISOString(),
      })
    ).toBe(true)
  })

  it('blocks an expired trial status', () => {
    expect(
      canManagePractice({
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() - 86_400_000).toISOString(),
      })
    ).toBe(false)
  })
})

describe('trialDaysLeft', () => {
  it('returns null when there is no trial end', () => {
    expect(trialDaysLeft(null)).toBeNull()
  })

  it('returns remaining positive days', () => {
    const ends = new Date(Date.now() + 3.2 * 86_400_000).toISOString()
    expect(trialDaysLeft(ends)).toBe(4)
  })
})

describe('isInTrial', () => {
  it('is true only for a live trialing subscription', () => {
    expect(
      isInTrial({
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 86_400_000).toISOString(),
      })
    ).toBe(true)
    expect(isInTrial({ subscription_status: 'active', trial_ends_at: null })).toBe(false)
  })
})

describe('SaaS plan offer', () => {
  it('exposes the R$ 29,90 monthly plan with a 7-day trial', () => {
    expect(SAAS_PLAN.amountLabel).toBe('R$ 29,90')
    expect(SAAS_PLAN.interval).toBe('mês')
    expect(SAAS_PLAN.trialDays).toBe(7)
  })

  it('has a dedicated subscription route', () => {
    expect(ROUTES.physio.subscription).toBe('/physio/assinatura')
    expect(ROUTES.subscribe).toBe('/assinar')
  })

  it('treats the dashboard as the inactive hub', () => {
    expect(isPhysioHubPath('/physio/dashboard')).toBe(true)
    expect(isPhysioHubPath('/physio/agenda')).toBe(false)
  })

  it('describes the paywall lock and free trial in Portuguese', () => {
    expect(pt.saas.locked.toLowerCase()).toContain('assinatura')
    expect(pt.landing.pricingAmountSuffix).toBe('/mês')
    expect(pt.landing.pricingTrialLabel.toLowerCase()).toContain('7')
    expect(pt.landing.faq1A.toLowerCase()).toContain('7')
  })
})
