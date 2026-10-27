import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type StripeObject = {
  id?: string;
  object?: string;
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
  status?: string;
  payment_status?: string;
  metadata?: Record<string, string>;
  client_reference_id?: string | null;
};

function customerId(value: StripeObject["customer"]): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

function subscriptionId(value: StripeObject["subscription"] | string | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

function mapSubscriptionStatus(stripeStatus: string | undefined): "active" | "inactive" {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "active";
  return "inactive";
}

async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(",").map((item) => {
      const [k, v] = item.split("=");
      return [k, v];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 60 * 5) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const digest = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (digest.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < digest.length; i += 1) {
    mismatch |= digest.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 501 });
  }
  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 501 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }
  const valid = await verifyStripeSignature(body, signature, webhookSecret);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body) as {
    type?: string;
    data?: { object?: StripeObject };
  };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const obj = event.data?.object;
  const kind = obj?.metadata?.kind;
  const physioFromMeta = obj?.metadata?.physiotherapist_id;
  const physioFromRef = obj?.client_reference_id ?? undefined;
  const physioId = physioFromMeta || physioFromRef;

  if (kind === "saas" || physioId) {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const status = event.type === "customer.subscription.deleted"
        ? "inactive"
        : event.type === "checkout.session.completed"
          ? (obj?.payment_status === "unpaid" ? "inactive" : "active")
          : mapSubscriptionStatus(obj?.status);

      const updates: Record<string, string | null> = {
        subscription_status: status,
      };
      const customer = customerId(obj?.customer);
      const subId = event.type === "checkout.session.completed"
        ? subscriptionId(obj?.subscription)
        : (obj?.object === "subscription" ? obj.id ?? null : subscriptionId(obj?.subscription));
      if (customer) updates.stripe_customer_id = customer;
      if (subId) updates.stripe_subscription_id = subId;

      if (physioId) {
        await supabase.from("physiotherapists").update(updates).eq("id", physioId);
      } else if (customer) {
        await supabase.from("physiotherapists").update(updates).eq("stripe_customer_id", customer);
      } else if (subId) {
        await supabase.from("physiotherapists").update(updates).eq("stripe_subscription_id", subId);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const paymentId = obj?.metadata?.payment_id;
  const purchaseId = obj?.metadata?.package_purchase_id;
  const sessionId = obj?.id;

  if (event.type === "checkout.session.completed" && (paymentId || sessionId)) {
    let query = supabase.from("payments").update({ status: "succeeded" });
    if (paymentId) query = query.eq("id", paymentId);
    else if (sessionId) query = query.eq("stripe_checkout_session_id", sessionId);
    await query;

    if (purchaseId) {
      const started = new Date();
      const expires = new Date(started);
      expires.setDate(expires.getDate() + 8 * 7);
      await supabase
        .from("package_purchases")
        .update({
          status: "active",
          started_at: started.toISOString(),
          expires_at: expires.toISOString(),
        })
        .eq("id", purchaseId);
    }

    if (paymentId) {
      await supabase
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("payment_id", paymentId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
