import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  mergeEntitlementUpdate,
  type BillingProvider,
  type SaasStatus,
} from "../_shared/saas-entitlement.ts";

type RevenueCatEvent = {
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  expiration_at_ms?: number | null;
  purchased_at_ms?: number | null;
  period_type?: string | null;
  store?: string | null;
  environment?: string | null;
  entitlement_ids?: string[] | null;
  product_id?: string | null;
};

type RevenueCatWebhook = {
  api_version?: string;
  event?: RevenueCatEvent;
};

const ACTIVE_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
  "SUBSCRIPTION_EXTENDED",
  "TEMPORARY_ENTITLEMENT_GRANT",
]);

const INACTIVE_TYPES = new Set([
  "EXPIRATION",
  "REFUND",
  // Cancellation keeps access until EXPIRATION — do not set inactive here.
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mapRevenueCatStatus(event: RevenueCatEvent): SaasStatus | null {
  const type = (event.type ?? "").toUpperCase();
  if (INACTIVE_TYPES.has(type)) return "inactive";
  if (!ACTIVE_TYPES.has(type) && type !== "CANCELLATION" && type !== "BILLING_ISSUE") {
    return null; // ignore transfer/test/alias noise
  }
  if (type === "CANCELLATION" || type === "BILLING_ISSUE") {
    // Access continues until EXPIRATION; no status change.
    return null;
  }
  const period = (event.period_type ?? "").toUpperCase();
  if (period === "TRIAL") return "trialing";
  return "active";
}

function trialEndsAt(event: RevenueCatEvent, status: SaasStatus): string | null {
  if (status !== "trialing") return null;
  if (typeof event.expiration_at_ms === "number" && event.expiration_at_ms > 0) {
    return new Date(event.expiration_at_ms).toISOString();
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = (Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "").trim();
  if (!secret) return json({ error: "webhook_not_configured" }, 503);

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token || token !== secret) return json({ error: "unauthorized" }, 401);

  const payload = await req.json().catch(() => null) as RevenueCatWebhook | null;
  const event = payload?.event;
  if (!event?.app_user_id) return json({ error: "invalid_payload" }, 400);

  const status = mapRevenueCatStatus(event);
  if (!status) return json({ ok: true, ignored: event.type ?? "unknown" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const appUserId = event.app_user_id;
  const provider: BillingProvider = "revenuecat";

  const { data: physio, error: findError } = await supabase
    .from("physiotherapists")
    .select(
      "id, profile_id, subscription_status, trial_ends_at, billing_provider, stripe_customer_id, stripe_subscription_id, revenuecat_app_user_id",
    )
    .or(`revenuecat_app_user_id.eq.${appUserId},profile_id.eq.${appUserId}`)
    .maybeSingle();

  if (findError) {
    console.error("revenuecat find physio", findError);
    return json({ error: "lookup_failed" }, 500);
  }

  if (!physio) {
    // Existing accounts only in v1 — acquisition without physio row stays on Stripe web.
    console.warn("revenuecat webhook: no physiotherapist for", appUserId);
    return json({ ok: true, skipped: "physio_not_found" });
  }

  const merge = mergeEntitlementUpdate(physio, {
    provider,
    status,
    trialEndsAt: trialEndsAt(event, status),
    revenuecatAppUserId: appUserId,
  });

  if (!merge.apply || Object.keys(merge.updates).length === 0) {
    return json({ ok: true, skipped: "no_updates" });
  }

  const { error: updateError } = await supabase
    .from("physiotherapists")
    .update(merge.updates)
    .eq("id", physio.id);

  if (updateError) {
    console.error("revenuecat update physio", updateError);
    return json({ error: "update_failed" }, 500);
  }

  return json({
    ok: true,
    physioId: physio.id,
    status: merge.updates.subscription_status ?? physio.subscription_status,
    provider,
    event: event.type,
  });
});
