import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 501 });
  }

  const body = await req.text();
  const event = JSON.parse(body) as {
    type?: string;
    data?: { object?: { id?: string; payment_status?: string; metadata?: Record<string, string> } };
  };

  if (webhookSecret) {
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response("Missing signature", { status: 400 });
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const obj = event.data?.object;
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
