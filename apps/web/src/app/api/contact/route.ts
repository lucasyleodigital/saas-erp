import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
            Puedes responder directamente a este email — irá a ${email}
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
