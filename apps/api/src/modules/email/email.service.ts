import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private from: string;
  private clientUrl: string;

  constructor(private config: ConfigService) {
    const apiKey = config.get<string>("RESEND_API_KEY");
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.from = config.get("EMAIL_FROM", "YouWhole <noreply@youwhole.com>");
    this.clientUrl = config.get("CLIENT_URL", "http://localhost:3000");
  }

  async sendGeneric(to: string, subject: string, html: string) {
    return this.send(to, subject, html);
  }

  private async send(
    to: string,
    subject: string,
    html: string,
    attachments?: Array<{ filename: string; content: Buffer }>,
  ) {
    if (!this.resend) {
      console.warn(`[EMAIL SKIPPED] No RESEND_API_KEY | To: ${to} | Subject: ${subject}`);
      return;
    }
    console.log(`[EMAIL SENDING] To: ${to} | From: ${this.from} | Subject: ${subject}`);
    const result = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    console.log(`[EMAIL SENT] To: ${to} | Result:`, JSON.stringify(result));
  }

  async sendWelcome(to: string, firstName: string, companyName: string) {
    await this.send(
      to,
      `Bienvenido a YouWhole, ${firstName}!`,
      `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f8fafc;">
        <!-- Header oscuro con logo -->
        <div style="background:linear-gradient(135deg,#040c0a 0%,#061410 60%,#080f0c 100%);padding:40px 32px 32px;text-align:center;">
          <img src="https://youwhole.com/logo.png" alt="YouWhole" width="140" height="40" style="display:inline-block;margin-bottom:20px;" />
          <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 8px;">Bienvenido, ${firstName}!</h1>
          <p style="color:#94a3b8;font-size:15px;margin:0;">Tu empresa esta lista para facturar</p>
        </div>

        <!-- Contenido principal -->
        <div style="max-width:560px;margin:0 auto;padding:32px;">
          <div style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;margin-bottom:24px;">
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
              <strong style="color:#0d9488;">${companyName}</strong> ya esta configurada en YouWhole.
              Tienes 14 dias de prueba gratis del plan Pro con todas las funcionalidades.
            </p>

            <p style="color:#6b7280;font-size:14px;font-weight:600;margin:0 0 12px;">Tus primeros pasos:</p>

            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">
                  <span style="display:inline-block;width:24px;height:24px;background:#0d9488;color:white;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">1</span>
                  <span style="color:#374151;font-size:14px;">Completa los datos de tu empresa</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">
                  <span style="display:inline-block;width:24px;height:24px;background:#0d9488;color:white;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">2</span>
                  <span style="color:#374151;font-size:14px;">Anade tus primeros clientes</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">
                  <span style="display:inline-block;width:24px;height:24px;background:#0d9488;color:white;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">3</span>
                  <span style="color:#374151;font-size:14px;">Crea tu primera factura con VeriFactu</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 12px;">
                  <span style="display:inline-block;width:24px;height:24px;background:#0d9488;color:white;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">4</span>
                  <span style="color:#374151;font-size:14px;">Importa tus datos desde Excel si vienes de otro programa</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${this.clientUrl}/es/dashboard"
              style="display:inline-block;background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%);color:white;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 14px rgba(13,148,136,0.3);">
              Entrar a mi cuenta
            </a>
          </div>

          <!-- Info extra -->
          <div style="background:#f0fdf9;border-left:4px solid #0d9488;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
            <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">
              <strong>Necesitas ayuda?</strong> Dentro de la app tienes un centro de ayuda con guias paso a paso para cada seccion. Tambien puedes escribirnos a
              <a href="mailto:hola@youwhole.com" style="color:#0d9488;text-decoration:none;font-weight:500;">hola@youwhole.com</a>
              o llamar al <a href="tel:+34624029617" style="color:#0d9488;text-decoration:none;font-weight:500;">624 029 617</a>.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding:24px 32px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:500;">YouWhole</p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            El ERP todo en uno para autonomos y pymes espanolas<br/>
            <a href="https://youwhole.com" style="color:#0d9488;text-decoration:none;">youwhole.com</a> ·
            Hecho por <a href="https://lucasyleodigital.com" style="color:#9ca3af;text-decoration:none;">Lucas y Leo Digital</a>
          </p>
        </div>
      </div>
      `
    );
  }

  async sendInvoice(
    to: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    companyName: string,
    pdfBuffer?: Buffer,
  ) {
    const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
    await this.send(
      to,
      `Nueva factura de ${companyName}: ${invoiceNumber}`,
      `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 32px; color: #111827;">
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">Nueva factura</h1>
        <p style="color: #6b7280; margin: 0 0 24px;">Estimado/a ${clientName},</p>
        <p style="color: #374151; line-height: 1.6; margin-bottom: 24px;">
          Adjuntamos la factura <strong>${invoiceNumber}</strong> por un importe de
          <strong>${fmt}</strong> emitida por <strong>${companyName}</strong>.
        </p>
        <p style="color: #9ca3af; font-size: 12px;">
          Para cualquier consulta, responde a este email.
        </p>
      </div>
      `,
      pdfBuffer ? [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }] : undefined,
    );
  }

  async sendQuote(
    to: string,
    clientName: string,
    quoteNumber: string,
    amount: number,
    validUntil: string,
  ) {
    await this.send(
      to,
      `Presupuesto ${quoteNumber}`,
      `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 32px; color: #111827;">
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">Presupuesto</h1>
        <p style="color: #6b7280; margin: 0 0 24px;">Estimado/a ${clientName},</p>
        <p style="color: #374151; line-height: 1.6; margin-bottom: 24px;">
          Adjuntamos el presupuesto <strong>${quoteNumber}</strong> por un importe de
          <strong>${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)}</strong>.
          Este presupuesto es válido hasta el <strong>${validUntil}</strong>.
        </p>
        <p style="color: #374151;">Para aceptarlo o solicitar modificaciones, responde a este email.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          Responde a este email para cualquier consulta.
        </p>
      </div>
      `
    );
  }

  async sendInvitation(
    to: string,
    inviterName: string,
    companyName: string,
    role: string,
    inviteUrl: string,
  ) {
    const roleLabel: Record<string, string> = {
      OWNER: "Propietario",
      ADMIN: "Administrador",
      ACCOUNTANT: "Contable",
      SALES: "Ventas",
      EMPLOYEE: "Empleado",
    };
    await this.send(
      to,
      `${inviterName} te invita a unirte a ${companyName} en YouWhole`,
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 32px; color: #111827;">
        <div style="width: 40px; height: 40px; background: #6366f1; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
          <span style="color: white; font-weight: bold; font-size: 18px;">E</span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">Te han invitado a ${companyName}</h1>
        <p style="color: #6b7280; margin: 0 0 24px; line-height: 1.6;">
          <strong style="color: #111827;">${inviterName}</strong> te ha invitado a unirte a
          <strong style="color: #111827;">${companyName}</strong> como
          <strong style="color: #111827;">${roleLabel[role] ?? role}</strong>.
        </p>
        <a href="${inviteUrl}"
          style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 15px;">
          Aceptar invitación →
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
          Este enlace expira en 7 días. Si no esperabas esta invitación, puedes ignorar este email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          O copia y pega este enlace en tu navegador:<br/>
          <span style="color: #6366f1;">${inviteUrl}</span>
        </p>
      </div>
      `
    );
  }

  async sendContractEmail(params: {
    clientEmail: string;
    companyName: string;
    cif: string | null;
    plan: string;
    price: number;
    acceptedAt: Date;
  }) {
    const { clientEmail, companyName, cif, plan, price, acceptedAt } = params;
    const dateStr = acceptedAt.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
    const planLabel: Record<string, string> = { STARTER: "Starter (29€/mes)", PRO: "Pro (79€/mes)", ENTERPRISE: "Enterprise (199€/mes)" };
    const subject = `Contrato de servicios YouWhole ${plan} — ${companyName}`;
    const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:40px 32px;color:#111827;">
      <div style="background:#0d9488;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="color:white;font-weight:700;font-size:20px;">Y</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">Contrato de Servicios YouWhole</h1>
      <p style="color:#6b7280;margin:0 0 28px;">Plan <strong style="color:#0d9488;">${planLabel[plan] ?? plan}</strong> · Aceptado el ${dateStr}</p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;font-size:13px;line-height:1.7;">
        <p style="margin:0 0 12px;font-weight:600;color:#111827;">DATOS DE LA SUSCRIPCIÓN</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;padding:3px 0;width:140px;">Empresa</td><td style="font-weight:500;">${companyName}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 0;">CIF/NIF</td><td style="font-weight:500;">${cif ?? "—"}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 0;">Plan</td><td style="font-weight:500;">${planLabel[plan] ?? plan}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 0;">Importe</td><td style="font-weight:500;">${price}€/mes (IVA incluido)</td></tr>
          <tr><td style="color:#6b7280;padding:3px 0;">Fecha alta</td><td style="font-weight:500;">${dateStr}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 0;">Renovación</td><td style="font-weight:500;">Automática mensual · Sin permanencia</td></tr>
        </table>
      </div>

      <div style="font-size:13px;color:#374151;line-height:1.8;space-y:12px;">
        <p><strong>1. PARTES</strong><br/>Lucas y Leo Digital S.L. («YouWhole») y <strong>${companyName}</strong> (CIF: ${cif ?? "—"}) («Cliente»).</p>
        <p><strong>2. OBJETO</strong><br/>Acceso a la plataforma SaaS YouWhole en modalidad ${plan}, incluyendo todos los módulos descritos en youwhole.com.</p>
        <p><strong>3. PRECIO Y FACTURACIÓN</strong><br/>${price}€/mes (IVA incluido), con cargo automático mensual a la tarjeta facilitada.</p>
        ${plan === "ENTERPRISE" ? `<p><strong>4. SLA</strong><br/>Disponibilidad garantizada del 99,5% mensual. Soporte prioritario L–V 9:00–19:00 con respuesta en 4 h laborables.</p>` : ""}
        <p><strong>${plan === "ENTERPRISE" ? "5" : "4"}. CANCELACIÓN</strong><br/>Cancelación en cualquier momento sin penalización. La baja surte efecto al final del período en curso.</p>
        <p><strong>${plan === "ENTERPRISE" ? "6" : "5"}. PROTECCIÓN DE DATOS</strong><br/>YouWhole actúa como Encargado del Tratamiento (RGPD). Datos alojados en la UE. Política completa en youwhole.com/privacidad.</p>
        <p><strong>${plan === "ENTERPRISE" ? "7" : "6"}. JURISDICCIÓN</strong><br/>Legislación española. Juzgados y Tribunales de Barcelona.</p>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        Este documento confirma la aceptación del contrato de servicios de YouWhole.<br/>
        Para gestionar tu suscripción accede a <a href="https://youwhole.com/dashboard" style="color:#0d9488;">youwhole.com/dashboard</a>.<br/>
        Contacto: ventas@youwhole.com · YouWhole es una marca de Lucas y Leo Digital S.L.
      </p>
    </div>`;

    await Promise.all([
      this.send(clientEmail, subject, html),
      this.send("lucasyleodigital@gmail.com", `[COPIA] ${subject}`, html),
    ]);
  }

  async sendPaymentReminder(
    to: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    companyName: string,
    daysOverdue: number,
  ) {
    const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
    const urgency = daysOverdue > 15
      ? `Lleva <strong>${daysOverdue} dias</strong> de retraso.`
      : `El pago lleva <strong>${daysOverdue} dias</strong> vencido.`;

    await this.send(
      to,
      `Recordatorio de pago: Factura ${invoiceNumber} — ${companyName}`,
      `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 32px; color: #111827;">
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">Recordatorio de pago</h1>
        <p style="color: #6b7280;">Estimado/a ${clientName},</p>
        <p style="color: #374151; line-height: 1.6;">
          Le recordamos que tiene pendiente el pago de la factura <strong>${invoiceNumber}</strong>
          por importe de <strong>${fmt}</strong>. ${urgency}
        </p>
        <p style="color: #374151; line-height: 1.6;">
          Le rogamos proceda al pago a la mayor brevedad posible.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          Si ya ha realizado el pago, por favor ignore este mensaje.<br/>
          ${companyName}
        </p>
      </div>
      `
    );
  }
}
