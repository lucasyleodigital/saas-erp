import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../../database/prisma.service";
import { ContactDto } from "./dto/contact.dto";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

@Injectable()
export class ContactService {
  constructor(private email: EmailService, private prisma: PrismaService) {}

  async submitFeedback(rating: number, comment: string, userEmail: string, companyId: string) {
    const co = await this.prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
    const companyName = co?.name ?? "";
    const stars = "★".repeat(Math.max(1, Math.min(5, rating))) + "☆".repeat(5 - Math.max(1, Math.min(5, rating)));
    const safeComment = esc(comment ?? "");
    const safeCompany = esc(companyName ?? "");
    const safeEmail = esc(userEmail ?? "");

    await this.email.sendGeneric(
      "lucasyleodigital@gmail.com",
      `[YouWhole Feedback] ${stars} — ${safeCompany}`,
      `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
          <div style="background:linear-gradient(135deg,#040c0a,#061410);padding:24px 28px;border-radius:12px 12px 0 0">
            <h2 style="color:#2dd4bf;margin:0 0 4px;font-size:20px">Nueva valoración en YouWhole</h2>
            <p style="color:#94a3b8;margin:0;font-size:13px">Feedback de un usuario</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px 28px;border-radius:0 0 12px 12px">
            <div style="font-size:28px;letter-spacing:2px;margin-bottom:16px">${stars}</div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
              <tr><td style="padding:6px 0;color:#6b7280;width:110px;font-size:13px">Empresa</td><td style="padding:6px 0;font-weight:600">${safeCompany || "—"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Email</td><td style="padding:6px 0"><a href="mailto:${safeEmail}" style="color:#0d9488">${safeEmail || "—"}</a></td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Puntuación</td><td style="padding:6px 0;font-weight:600">${rating} / 5</td></tr>
            </table>
            ${safeComment ? `
            <div style="background:#f0fdf9;border-left:4px solid #0d9488;padding:14px 16px;border-radius:4px">
              <p style="margin:0;font-size:13px;color:#374151;white-space:pre-wrap">${safeComment}</p>
            </div>` : `<p style="color:#9ca3af;font-size:13px;font-style:italic">Sin comentario adicional.</p>`}
          </div>
        </div>
      `,
    ).catch((e) => console.warn("[feedback] email error:", e));

    return { ok: true };
  }

  async submit(dto: ContactDto) {
    const name = esc(dto.name);
    const email = esc(dto.email);
    const subject = esc(dto.subject ?? "");
    const message = esc(dto.message);

    try {
      await this.email.sendGeneric(
        "youwholeapp@gmail.com",
        `[Web] ${subject || "Nuevo mensaje de contacto"} — ${name}`,
        `
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
      );
    } catch (err: any) {
      console.error("[contact] Failed to send internal notification:", err?.message ?? err);
      throw new InternalServerErrorException("Error al enviar el mensaje");
    }

    // Auto-reply — best-effort, doesn't fail the request if it errors
    this.email
      .sendGeneric(
        dto.email,
        "Hemos recibido tu mensaje — YouWhole",
        `
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
      )
      .catch((err) => console.error("[contact] Auto-reply failed:", err?.message ?? err));

    return { ok: true };
  }
}
