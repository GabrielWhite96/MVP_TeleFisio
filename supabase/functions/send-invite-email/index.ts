import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { json } from "../_shared/cors.ts";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resolveAppOrigin(req: Request): string | null {
  const configured = (Deno.env.get("APP_URL") ?? Deno.env.get("SITE_URL") ?? "").trim();
  if (configured) return configured.replace(/\/$/, "");

  const origin = req.headers.get("origin");
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return url.origin;
  } catch {
    return null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ sent: false, reason: "unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return json({ sent: false, reason: "unauthorized" }, 401);

  const body = await req.json().catch(() => null) as {
    inviteId?: string
    kind?: "patient" | "caregiver"
  } | null;

  const inviteId = body?.inviteId?.trim();
  const kind = body?.kind === "caregiver" ? "caregiver" : "patient";
  if (!inviteId) return json({ sent: false, reason: "invalid_body" }, 400);

  const table = kind === "caregiver" ? "caregiver_invites" : "patient_invites";
  const { data: invite, error: inviteError } = await supabase
    .from(table)
    .select("id, email, invite_token, status, expires_at")
    .eq("id", inviteId)
    .maybeSingle();

  if (inviteError || !invite) return json({ sent: false, reason: "not_found" }, 403);
  if (invite.status !== "pending") return json({ sent: false, reason: "not_pending" }, 400);
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return json({ sent: false, reason: "expired" }, 400);
  }

  const appOrigin = resolveAppOrigin(req);
  if (!appOrigin) return json({ sent: false, reason: "missing_app_url" });

  const inviteUrl = kind === "patient"
    ? `${appOrigin}/auth/invite/${invite.invite_token}`
    : `${appOrigin}/auth/caregiver-signup`;

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return json({ sent: false, reason: "missing_key" });

  const from = Deno.env.get("RESEND_FROM") ?? "TeleFisio <convites@mail.telefisio.com>";
  const templateId = kind === "caregiver" ? "caregiver-invite" : "patient-invite";
  const idempotencyKey = `invite/${kind}/${invite.id}/${crypto.randomUUID()}`;
  const sent = await sendTemplateEmail({
    apiKey,
    from,
    to: invite.email,
    templateId,
    variables: {
      INVITE_URL: escapeHtml(inviteUrl),
      RECIPIENT_EMAIL: escapeHtml(invite.email),
    },
    idempotencyKey,
  });

  if (!sent.ok) return json({ sent: false, reason: "send_failed" }, 502);
  return json({ sent: true, emailId: sent.id });
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(response: Response, attempt: number) {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 10_000);
    const date = Date.parse(header);
    if (!Number.isNaN(date)) return Math.min(Math.max(date - Date.now(), 0), 10_000);
  }
  return Math.min(500 * 2 ** (attempt - 1), 4_000);
}

async function sendTemplateEmail(input: {
  apiKey: string
  from: string
  to: string
  templateId: string
  variables: { INVITE_URL: string; RECIPIENT_EMAIL: string }
  idempotencyKey: string
}): Promise<{ ok: true; id: string } | { ok: false }> {
  const body = JSON.stringify({
    from: input.from,
    to: [input.to],
    template: {
      id: input.templateId,
      variables: input.variables,
    },
  });

  for (let attempt = 1; attempt <= 3; attempt++) {
    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": input.idempotencyKey,
        },
        body,
      });
    } catch (error) {
      console.error("resend network error", error);
      if (attempt === 3) return { ok: false };
      await sleep(500 * 2 ** (attempt - 1));
      continue;
    }

    const payload = await response.json().catch(() => null) as { id?: string; message?: string } | null;
    if (response.ok && payload?.id) {
      console.log("resend email id", payload.id);
      return { ok: true, id: payload.id };
    }

    console.error("resend send failed", response.status, payload?.message ?? "");
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 3) return { ok: false };
    await sleep(retryDelayMs(response, attempt));
  }

  return { ok: false };
}
