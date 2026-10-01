import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { json } from "../_shared/cors.ts";

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
    to?: string
    inviteUrl?: string
    kind?: "patient" | "caregiver"
    recipientName?: string
  } | null;

  const to = body?.to?.trim().toLowerCase();
  const inviteUrl = body?.inviteUrl?.trim();
  const kind = body?.kind === "caregiver" ? "caregiver" : "patient";
  if (!to || !inviteUrl) return json({ sent: false, reason: "invalid_body" }, 400);

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return json({ sent: false, reason: "missing_key" });

  const from = Deno.env.get("RESEND_FROM") ?? "TeleFisio <onboarding@resend.dev>";
  const subject = kind === "caregiver"
    ? "Convite para acompanhar um paciente no TeleFisio"
    : "Convite para acessar seu tratamento no TeleFisio";
  const intro = kind === "caregiver"
    ? "Você foi convidado a acompanhar um paciente no TeleFisio. Crie sua conta de cuidador com este mesmo e-mail:"
    : "Seu fisioterapeuta convidou você para acessar o portal do paciente. Defina sua senha neste link:";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: `<p>${intro}</p><p><a href="${inviteUrl}">${inviteUrl}</a></p>`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return json({ sent: false, reason: detail || "send_failed" }, 502);
  }

  return json({ sent: true });
});
