import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return json({ error: "Unauthorized" }, 401);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const priceId = Deno.env.get("STRIPE_SAAS_PRICE_ID");
  if (!stripeKey || !priceId) return json({ error: "Checkout indisponível" }, 501);

  const { data: physio, error: physioError } = await supabase
    .from("physiotherapists")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (physioError || !physio) return json({ error: "Physiotherapist not found" }, 400);

  const body = await req.json().catch(() => ({})) as { origin?: string };
  const origin = body.origin ?? "http://localhost:5173";

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("success_url", `${origin}/physio/dashboard`);
  params.set("cancel_url", `${origin}/physio/dashboard`);
  params.set("client_reference_id", physio.id);
  params.set("metadata[kind]", "saas");
  params.set("metadata[physiotherapist_id]", physio.id);
  params.set("subscription_data[metadata][kind]", "saas");
  params.set("subscription_data[metadata][physiotherapist_id]", physio.id);

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const session = await stripeRes.json();
  if (!stripeRes.ok) return json({ error: session.error?.message ?? "Stripe error" }, 502);
  return json({ url: session.url });
});
