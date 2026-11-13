import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { sendGmail } from "../_shared/gmail-smtp.ts";
import { renderTeleFisioEmail, renderTeleFisioText } from "../_shared/email-layout.ts";
import { mergeEntitlementUpdate } from "../_shared/saas-entitlement.ts";

type StripeObject = {
  id?: string;
  object?: string;
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
  status?: string;
  payment_status?: string;
  trial_end?: number | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  metadata?: Record<string, string>;
  client_reference_id?: string | null;
};

type SaasStatus = "trialing" | "active" | "inactive";

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

function mapSubscriptionStatus(stripeStatus: string | undefined): SaasStatus {
  if (stripeStatus === "trialing") return "trialing";
  if (stripeStatus === "active") return "active";
  return "inactive";
}

function trialEndsAtFromUnix(trialEnd: number | null | undefined): string | null {
  if (typeof trialEnd !== "number" || !Number.isFinite(trialEnd) || trialEnd <= 0) return null;
  return new Date(trialEnd * 1000).toISOString();
}

async function fetchStripeSubscription(
  stripeKey: string,
  subId: string,
): Promise<{ status?: string; trial_end?: number | null } | null> {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  if (!res.ok) {
    console.error("stripe subscription fetch failed", res.status);
    return null;
  }
  return await res.json() as { status?: string; trial_end?: number | null };
}

function generatePassword(length = 20) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function appOrigin() {
  return (Deno.env.get("APP_URL") ?? Deno.env.get("SITE_URL") ?? "http://localhost:5173")
    .trim()
    .replace(/\/$/, "");
}

async function verifyStripeSignature(payload: string, header: string, secret: string) {
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

async function sendCredentialsEmail(input: {
  to: string;
  email: string;
  password?: string;
  loginUrl: string;
  kind: "created" | "reactivated";
  trialing?: boolean;
  trialDays?: number | null;
}) {
  const gmailUser = (Deno.env.get("GMAIL_USER") ?? "").trim();
  const appPassword = (Deno.env.get("GMAIL_APP_PASSWORD") ?? "").replaceAll(" ", "");
  if (!gmailUser || !appPassword) {
    return { ok: false as const, reason: "missing_key", status: 501 };
  }
  if (input.to.includes("\r") || input.to.includes("\n")) {
    return { ok: false as const, reason: "invalid_email", status: 400 };
  }

  const created = input.kind === "created";
  const trialing = Boolean(input.trialing);
  const trialLabel = input.trialDays && input.trialDays > 0
    ? `${input.trialDays} dias`
    : "o período de teste";
  const subject = created
    ? (trialing ? "Seu teste grátis do Fisionotes começou" : "Seu acesso ao Fisionotes foi criado")
    : (trialing ? "Seu teste grátis do Fisionotes está ativo" : "Sua assinatura do Fisionotes está ativa");
  const emailContent = {
    preview: created
      ? (trialing
        ? `Teste grátis de ${trialLabel} iniciado. Entre com e-mail e senha temporária.`
        : "Assinatura confirmada. Entre com e-mail e senha temporária.")
      : (trialing
        ? `Teste grátis de ${trialLabel} ativo. Sua clínica está liberada.`
        : "Assinatura confirmada. Sua assinatura voltou a ficar ativa."),
    title: created
      ? (trialing ? "Seu teste grátis começou" : "Sua conta profissional está pronta")
      : (trialing ? "Seu teste grátis está ativo" : "Sua assinatura está ativa de novo"),
    greeting: created
      ? (trialing
        ? `A assinatura foi iniciada com ${trialLabel} de teste grátis e o acesso profissional foi criado.`
        : "A assinatura foi confirmada e o acesso profissional foi criado.")
      : (trialing
        ? `A assinatura foi iniciada com ${trialLabel} de teste grátis.`
        : "A assinatura foi confirmada e voltou a ficar ativa."),
    paragraphs: created
      ? [
        "Entre com os dados abaixo. Depois do primeiro acesso, troque a senha.",
        ...(trialing
          ? [`Se cancelar durante o teste, você não é cobrado. Depois de ${trialLabel}, a cobrança mensal começa automaticamente.`]
          : []),
      ]
      : [
        "Entre com o e-mail da conta e a senha que você já usa no Fisionotes.",
        ...(trialing
          ? [`Se cancelar durante o teste, você não é cobrado. Depois de ${trialLabel}, a cobrança mensal começa automaticamente.`]
          : []),
      ],
    details: [
      { label: "E-mail", value: input.email },
      ...(input.password
        ? [{ label: "Senha temporária", value: input.password, mono: true }]
        : []),
    ],
    ctaLabel: "Entrar no Fisionotes",
    ctaUrl: input.loginUrl,
    logoUrl: `${appOrigin()}/logos/logo_semfundo_com_nome_horizontal.png`,
    note: "Se você não reconhece esta assinatura, fale com o suporte pelo mesmo e-mail desta mensagem.",
  };

  return sendGmail({
    user: gmailUser,
    appPassword,
    to: input.to,
    subject,
    html: renderTeleFisioEmail(emailContent),
    text: renderTeleFisioText(emailContent),
  });
}

async function markPhysioActive(
  supabase: SupabaseClient,
  physioId: string,
  updates: Record<string, string | null>,
) {
  const { error } = await supabase.from("physiotherapists").update(updates).eq("id", physioId);
  if (error) throw error;
}

async function provisionSaasAccess(
  supabase: SupabaseClient,
  obj: StripeObject,
  stripeKey: string,
) {
  const email = (
    obj.customer_details?.email ??
    obj.customer_email ??
    obj.metadata?.signup_email ??
    ""
  ).trim().toLowerCase();
  const fullName = (obj.metadata?.full_name ?? obj.customer_details?.name ?? email.split("@")[0] ?? "Fisioterapeuta")
    .trim()
    .slice(0, 120);
  const customer = customerId(obj.customer);
  const subId = subscriptionId(obj.subscription);
  const physioFromMeta = obj.metadata?.physiotherapist_id || obj.client_reference_id || "";

  let saasStatus: SaasStatus = obj.payment_status === "unpaid" ? "inactive" : "active";
  let trialEndsAt: string | null = null;
  if (subId && obj.payment_status !== "unpaid") {
    const subscription = await fetchStripeSubscription(stripeKey, subId);
    if (subscription) {
      saasStatus = mapSubscriptionStatus(subscription.status);
      trialEndsAt = trialEndsAtFromUnix(subscription.trial_end);
    }
  }

  const updates: Record<string, string | null> = {
    subscription_status: saasStatus,
    trial_ends_at: saasStatus === "trialing" ? trialEndsAt : null,
    billing_provider: saasStatus === "inactive" ? null : "stripe",
  };
  if (customer) updates.stripe_customer_id = customer;
  if (subId) updates.stripe_subscription_id = subId;

  if (obj.payment_status === "unpaid") {
    if (physioFromMeta) await markPhysioActive(supabase, physioFromMeta, updates);
    return { ok: true as const };
  }

  let physioId = physioFromMeta;
  let profileId: string | null = null;
  let credentialsSentAt: string | null = null;
  let provisionedByStripe = false;

  if (physioId) {
    const { data: existing } = await supabase
      .from("physiotherapists")
      .select("id, profile_id, credentials_email_sent_at")
      .eq("id", physioId)
      .maybeSingle();
    if (existing) {
      profileId = existing.profile_id;
      credentialsSentAt = existing.credentials_email_sent_at;
    }
  }

  if (!profileId && email) {
    const { data: existingUserId } = await supabase.rpc("service_find_auth_user_id", { p_email: email });
    if (typeof existingUserId === "string" && existingUserId) {
      profileId = existingUserId;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", existingUserId)
        .maybeSingle();
      if (profile && profile.role !== "physiotherapist") {
        console.error("saas checkout email belongs to another role");
        return { ok: true as const };
      }
      const { data: existingPhysio } = await supabase
        .from("physiotherapists")
        .select("id, credentials_email_sent_at")
        .eq("profile_id", existingUserId)
        .maybeSingle();
      if (existingPhysio) {
        physioId = existingPhysio.id;
        credentialsSentAt = existingPhysio.credentials_email_sent_at;
      }
    }
  }

  let generatedPassword: string | undefined;
  let createdNow = false;

  if (!profileId) {
    if (!email) throw new Error("missing_email");
    const { data: provisionToken, error: allowError } = await supabase.rpc("service_allow_stripe_physio", {
      p_email: email,
      p_full_name: fullName,
    });
    if (allowError || !provisionToken) throw allowError ?? new Error("provision_allow_failed");
    const provisionTokenValue = String(provisionToken);
    generatedPassword = generatePassword();
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "physiotherapist",
        provision_token: provisionTokenValue,
      },
      app_metadata: { provisioned_by: "stripe_saas", role: "physiotherapist" },
    });
    if (createError || !created.user) {
      console.error("createUser failed", createError?.message ?? "create_user_failed");
      throw createError ?? new Error("create_user_failed");
    }
    profileId = created.user.id;
    createdNow = true;
    const { data: createdPhysio } = await supabase
      .from("physiotherapists")
      .select("id, credentials_email_sent_at")
      .eq("profile_id", profileId)
      .maybeSingle();
    physioId = createdPhysio?.id ?? "";
    credentialsSentAt = createdPhysio?.credentials_email_sent_at ?? null;
    provisionedByStripe = true;
  } else {
    const { data: user } = await supabase.auth.admin.getUserById(profileId);
    provisionedByStripe = user.user?.app_metadata?.provisioned_by === "stripe_saas";
  }

  if (!physioId && profileId) {
    const { data: createdPhysio } = await supabase
      .from("physiotherapists")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();
    physioId = createdPhysio?.id ?? "";
  }
  if (!physioId) throw new Error("physio_missing");

  await markPhysioActive(supabase, physioId, updates);

  if (credentialsSentAt) return { ok: true as const };

  const loginUrl = `${appOrigin()}/auth/login`;
  const shouldIssuePassword = createdNow || provisionedByStripe;
  if (shouldIssuePassword && !generatedPassword) {
    generatedPassword = generatePassword();
    const { error: passwordError } = await supabase.auth.admin.updateUserById(profileId, {
      password: generatedPassword,
    });
    if (passwordError) throw passwordError;
  }

  const trialDaysLeft = trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const sent = await sendCredentialsEmail({
    to: email,
    email,
    password: shouldIssuePassword ? generatedPassword : undefined,
    loginUrl,
    kind: shouldIssuePassword ? "created" : "reactivated",
    trialing: saasStatus === "trialing",
    trialDays: trialDaysLeft,
  });
  if (!sent.ok) return sent;

  await supabase
    .from("physiotherapists")
    .update({ credentials_email_sent_at: new Date().toISOString() })
    .eq("id", physioId);

  return { ok: true as const };
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

  if (kind === "saas" || physioFromMeta) {
    if (event.type === "checkout.session.completed") {
      try {
        const result = await provisionSaasAccess(supabase, obj ?? {}, stripeKey);
        if (!result.ok) {
          return new Response(JSON.stringify({ error: result.reason }), { status: result.status });
        }
      } catch (error) {
        console.error("saas provision failed", error instanceof Error ? error.message : "unknown");
        return new Response(JSON.stringify({ error: "provision_failed" }), { status: 500 });
      }
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const status = event.type === "customer.subscription.deleted"
        ? "inactive"
        : mapSubscriptionStatus(obj?.status);
      const customer = customerId(obj?.customer);
      const subId = obj?.object === "subscription" ? obj.id ?? null : subscriptionId(obj?.subscription);

      let currentQuery = supabase
        .from("physiotherapists")
        .select(
          "id, profile_id, subscription_status, trial_ends_at, billing_provider, stripe_customer_id, stripe_subscription_id, revenuecat_app_user_id",
        );
      if (physioFromMeta) currentQuery = currentQuery.eq("id", physioFromMeta);
      else if (customer) currentQuery = currentQuery.eq("stripe_customer_id", customer);
      else if (subId) currentQuery = currentQuery.eq("stripe_subscription_id", subId);
      else {
        return new Response(JSON.stringify({ received: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const { data: current } = await currentQuery.maybeSingle();
      const merge = mergeEntitlementUpdate(current, {
        provider: "stripe",
        status,
        trialEndsAt: status === "trialing" ? trialEndsAtFromUnix(obj?.trial_end) : null,
        stripeCustomerId: customer,
        stripeSubscriptionId: subId,
      });

      if (merge.apply && Object.keys(merge.updates).length > 0 && current?.id) {
        await supabase.from("physiotherapists").update(merge.updates).eq("id", current.id);
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
