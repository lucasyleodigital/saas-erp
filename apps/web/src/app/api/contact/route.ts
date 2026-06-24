import { NextRequest, NextResponse } from "next/server";

const RESEND_URL = "https://api.resend.com/emails";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(payload: object) {
  return fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function POST(req: NextRequest) {
  const raw = await req.json();
  const name = esc(String(raw.name ?? ""));
  const email = esc(String(raw.email ?? ""));
  const subject = esc(String(raw.subject ?? ""));
  const message = esc(String(raw.message ?? ""));

  if (!raw.name || !raw.email || !raw.message) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  // 1 — Notificación interna a youwholeapp@gmail.com
  const internal = await sendEmail({
    from: "YouWhole Contacto <hola@youwhole.com>",
    to: ["youwholeapp@gmail.com"],
    reply_to: email,
    subject: `[Web] ${subject || "Nuevo mensaje de contacto"} — ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#0d9488">Nuevo mensaje desde youwhole.com</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#6b7280;width:120px">Nombre</td><td style="padding:8px 0;font-weight:500">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Asunto</td><td style="padding:8px 0">${subject || "—"}</td></tr>
        </table>
        <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px">
          <p style="margin:0;white-space:pre-wrap">${message}</p>
        </div>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af">
          Responde directamente a este email — irá a ${email}
        </p>
      </div>
    `,
  });

  if (!internal.ok) {
    const body = await internal.json().catch(() => ({}));
    console.error("[contact] Resend error (internal):", internal.status, JSON.stringify(body));
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }

  // 2 — Confirmación automática al remitente
  await sendEmail({
    from: "YouWhole <hola@youwhole.com>",
    to: [email],
    subject: "Hemos recibido tu mensaje — YouWhole",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
        <div style="background:linear-gradient(135deg,#040c0a,#061410);padding:32px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:#2dd4bf;margin:0;font-size:28px;font-weight:800">YouWhole</h1>
          <p style="color:#94a3b8;margin:8px 0 0;font-size:14px">El ERP todo en uno para pymes españolas</p>
        </div>
        <div style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
          <p style="margin:0 0 16px;font-size:16px">Hola <strong>${name}</strong>,</p>
          <p style="margin:0 0 16px;color:#4b5563;line-height:1.6">
            Hemos recibido tu mensaje correctamente. Nuestro equipo lo revisará y te responderemos
            en un máximo de <strong>24 horas</strong> en días laborables (L–V, 9:00–18:00h).
          </p>
          <div style="background:#f0fdf9;border-left:4px solid #0d9488;padding:16px;border-radius:4px;margin:24px 0">
            <p style="margin:0;font-size:13px;color:#374151"><strong>Tu mensaje:</strong></p>
            <p style="margin:8px 0 0;font-size:13px;color:#6b7280;white-space:pre-wrap">${message}</p>
          </div>
          <p style="margin:0 0 8px;color:#4b5563;line-height:1.6">
            Si necesitas ayuda urgente, también puedes contactarnos por:
          </p>
          <ul style="margin:0 0 24px;padding-left:20px;color:#4b5563;line-height:1.8;font-size:14px">
            <li>WhatsApp: <a href="https://wa.me/34624029617" style="color:#0d9488">+34 624 029 617</a></li>
            <li>Email: <a href="mailto:hola@youwhole.com" style="color:#0d9488">hola@youwhole.com</a></li>
          </ul>
          <div style="text-align:center;margin-top:24px">
            <a href="https://youwhole.com" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#0f766e);color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Visitar YouWhole
            </a>
          </div>
          <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;text-align:center">
            YouWhole · <a href="https://youwhole.com" style="color:#9ca3af">youwhole.com</a> ·
            Diseñado por <a href="https://lucasyleodigital.com" style="color:#9ca3af">Lucas y Leo Digital</a>
          </p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
