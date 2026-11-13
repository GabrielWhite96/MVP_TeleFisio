export type SaasStatus = "trialing" | "active" | "inactive";
export type BillingProvider = "stripe" | "revenuecat";

export type PhysioBillingRow = {
  id: string;
  profile_id: string;
  subscription_status: SaasStatus;
  trial_ends_at: string | null;
  billing_provider: BillingProvider | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  revenuecat_app_user_id?: string | null;
};

export function isEntitled(row: {
  subscription_status: SaasStatus;
  trial_ends_at?: string | null;
}): boolean {
  if (row.subscription_status === "active") return true;
  if (row.subscription_status !== "trialing") return false;
  if (!row.trial_ends_at) return true;
  return new Date(row.trial_ends_at).getTime() > Date.now();
}

/**
 * Merge a provider entitlement update into the physio row.
 * Prevents cross-provider cancel from wiping an active subscription on the other channel.
 */
export function mergeEntitlementUpdate(
  current: PhysioBillingRow | null,
  input: {
    provider: BillingProvider;
    status: SaasStatus;
    trialEndsAt?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    revenuecatAppUserId?: string | null;
  },
): { apply: boolean; updates: Record<string, string | null> } {
  const updates: Record<string, string | null> = {};

  if (input.stripeCustomerId) updates.stripe_customer_id = input.stripeCustomerId;
  if (input.stripeSubscriptionId) updates.stripe_subscription_id = input.stripeSubscriptionId;
  if (input.revenuecatAppUserId) updates.revenuecat_app_user_id = input.revenuecatAppUserId;

  const currentlyEntitled = current ? isEntitled(current) : false;
  const owner = current?.billing_provider ?? null;

  if (input.status === "inactive") {
    if (owner && owner !== input.provider) {
      // Another channel owns the live sub — ignore this provider's expiry/cancel.
      return { apply: Object.keys(updates).length > 0, updates };
    }
    updates.subscription_status = "inactive";
    updates.trial_ends_at = null;
    updates.billing_provider = null;
    return { apply: true, updates };
  }

  // Activating / trialing
  if (currentlyEntitled && owner && owner !== input.provider) {
    // Already entitled via the other channel — do not steal ownership.
    return { apply: Object.keys(updates).length > 0, updates };
  }

  updates.subscription_status = input.status;
  updates.trial_ends_at = input.status === "trialing" ? (input.trialEndsAt ?? null) : null;
  updates.billing_provider = input.provider;
  return { apply: true, updates };
}
