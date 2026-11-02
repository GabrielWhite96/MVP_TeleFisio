import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { json } from "../_shared/cors.ts";

function allowedOrigin(requested: unknown) {
  const fallback = (Deno.env.get("APP_URL") ?? Deno.env.get("SITE_URL") ?? "http://localhost:5173")
    .trim()
    .replace(/\/$/, "");
  const allowed = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://fisionotes.com.br",
    "https://www.fisionotes.com.br",
    "https://tele-fisio.netlify.app",
  ]);
  try {
    allowed.add(new URL(fallback).origin);
  } catch {
    allowed.add("http://localhost:5173");
  }
  if (typeof requested !== "string" || !requested.trim()) {
    return [...allowed][0];
  }
  try {
    const origin = new URL(requested).origin;
    if (allowed.has(origin)) return origin;
  } catch {
    // Fall through to the configured app origin.
  }
  return [...allowed][0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return json({ error: "Portal ainda não está configurado." }, 501);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Faça login para gerenciar a assinatura." }, 401);

  const body = await req.json().catch(() => ({})) as { origin?: string };
  const origin = allowedOrigin(body.origin);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Sessão inválida." }, 401);

  const { data: physio, error } = await supabase
    .from("physiotherapists")
    .select("id, stripe_customer_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!physio?.stripe_customer_id) {
    return json({ error: "Nenhuma assinatura Stripe encontrada para esta conta." }, 404);
  }

  const params = new URLSearchParams();
  params.set("customer", physio.stripe_customer_id);
  params.set("return_url", `${origin}/physio/assinatura`);

  const stripeRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const session = await stripeRes.json();
  if (!stripeRes.ok) {
    return json({ error: session.error?.message ?? "Não foi possível abrir o portal." }, 502);
  }
  return json({ url: session.url });
});
