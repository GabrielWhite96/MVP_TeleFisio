/** Visible SaaS offer. Stripe charges via STRIPE_SAAS_PRICE_ID after the trial. */
export const SAAS_PLAN = {
  name: 'Fisionotes Profissional',
  amountLabel: 'R$ 29,90',
  interval: 'mês',
  currency: 'BRL',
  /** Free trial length passed to Stripe Checkout (`subscription_data.trial_period_days`). */
  trialDays: 7,
} as const
