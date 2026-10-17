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

function encodeSubject(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `=?UTF-8?B?${btoa(binary)}?=`;
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

  const gmailUser = (Deno.env.get("GMAIL_USER") ?? "").trim();
  const appPassword = (Deno.env.get("GMAIL_APP_PASSWORD") ?? "").replaceAll(" ", "");
  if (!gmailUser || !appPassword) return json({ sent: false, reason: "missing_key" });
  if (invite.email.includes("\r") || invite.email.includes("\n")) {
    return json({ sent: false, reason: "invalid_email" }, 400);
  }

  const subject = kind === "caregiver"
    ? "Convite para acompanhar um paciente no TeleFisio"
    : "Convite para acessar seu tratamento no TeleFisio";
  const intro = kind === "caregiver"
    ? "Você foi convidado a acompanhar um paciente no TeleFisio. Crie sua conta de cuidador com este mesmo e-mail:"
    : "Seu fisioterapeuta convidou você para acessar o portal do paciente. Defina sua senha neste link:";
  const safeUrl = escapeHtml(inviteUrl);
  const safeEmail = escapeHtml(invite.email);
  const html = `<p>${intro}</p><p>E-mail: ${safeEmail}</p><p><a href="${safeUrl}">${safeUrl}</a></p>`;

  const sent = await sendGmail({
    user: gmailUser,
    appPassword,
    to: invite.email,
    subject,
    html,
  });

  if (!sent.ok) return json({ sent: false, reason: sent.reason }, sent.status);
  return json({ sent: true });
});

async function sendGmail(input: {
  user: string
  appPassword: string
  to: string
  subject: string
  html: string
}): Promise<{ ok: true } | { ok: false; reason: string; status: number }> {
  let conn: Deno.TlsConn | null = null;
  try {
    conn = await Deno.connectTls({ hostname: "smtp.gmail.com", port: 465 });
    await readSmtp(conn);
    await command(conn, "EHLO telefisio");
    await command(conn, "AUTH LOGIN");
    await command(conn, btoa(input.user));
    await command(conn, btoa(input.appPassword));
    await command(conn, `MAIL FROM:<${input.user}>`);
    await command(conn, `RCPT TO:<${input.to}>`);
    await command(conn, "DATA");
    const message = [
      `From: TeleFisio <${input.user}>`,
      `To: ${input.to}`,
      `Subject: ${encodeSubject(input.subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      input.html.replaceAll("\n.", "\n.."),
      ".",
    ].join("\r\n");
    await command(conn, message);
    await command(conn, "QUIT");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("gmail send failed", message.startsWith("smtp ") ? message.slice(0, 8) : "network");
    const authFailed = message.startsWith("smtp 535") || message.startsWith("smtp 534");
    return {
      ok: false,
      reason: authFailed ? "auth_failed" : "send_failed",
      status: authFailed ? 401 : 502,
    };
  } finally {
    try {
      conn?.close();
    } catch {
      // The socket may already be closed after QUIT.
    }
  }
}

async function command(conn: Deno.TlsConn, line: string) {
  await conn.write(new TextEncoder().encode(line + "\r\n"));
  const response = await readSmtp(conn);
  const code = Number(response.slice(0, 3));
  if (!Number.isFinite(code) || code >= 400) {
    throw new Error(`smtp ${Number.isFinite(code) ? code : "000"}`);
  }
}

async function readSmtp(conn: Deno.TlsConn) {
  const buf = new Uint8Array(8192);
  let text = "";
  while (true) {
    const n = await conn.read(buf);
    if (n === null) break;
    text += new TextDecoder().decode(buf.subarray(0, n));
    const lines = text.split("\r\n").filter((line) => line.length > 0);
    const last = lines[lines.length - 1] ?? "";
    if (/^\d{3} /.test(last)) return last;
  }
  return text.trim();
}
