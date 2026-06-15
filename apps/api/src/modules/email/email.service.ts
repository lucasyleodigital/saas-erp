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
    this.from = config.get("EMAIL_FROM", "YouWhole <noreply@youwhole.es>");
    this.clientUrl = config.get("CLIENT_URL", "http://localhost:3000");
  }

  async sendGeneric(to: string, subject: string, html: string) {
    return this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      // In development, log instead of sending
      console.log(`📧 [EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
      return;
    }
    await this.resend.emails.send({ from: this.from, to, subject, html });
  }

  async sendWelcome(to: string, firstName: string, companyName: string) {
    await this.send(
      to,
      `¡Bienvenido a YouWhole, ${firstName}!`,
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 32px; color: #111827;">
        <div style="width: 40px; height: 40px; background: #6366f1; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
          <span style="color: white; font-weight: bold; font-size: 18px;">E</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">¡Bienvenido, ${firstName}!</h1>
        <p style="color: #6b7280; margin: 0 0 24px; line-height: 1.6;">
          Tu empresa <strong style="color: #111827;">${companyName}</strong> ya está lista en YouWhole.
          Empieza creando tu primera factura o importando tus clientes.
        </p>
        <a href="${this.clientUrl}/dashboard"
          style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 15px;">
          Ir al dashboard →
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Si no has creado esta cuenta, puedes ignorar este email.
          Responde a este mensaje si necesitas ayuda.
        </p>
      </div>
      `
    );
  }

  async sendInvoice(
    to: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    companyName: string
  ) {
    await this.send(
      to,
      `Nueva factura de ${companyName}: ${invoiceNumber}`,
      `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 32px; color: #111827;">
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">Nueva factura</h1>
        <p style="color: #6b7280; margin: 0 0 24px;">Estimado/a ${clientName},</p>
        <p style="color: #374151; line-height: 1.6; margin-bottom: 24px;">
          Adjuntamos la factura <strong>${invoiceNumber}</strong> por un importe de
          <strong>${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)}</strong>
          emitida por <strong>${companyName}</strong>.
        </p>
        <p style="color: #9ca3af; font-size: 12px;">
          Para cualquier consulta, responde a este email.
        </p>
      </div>
      `
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

  async sendPaymentReminder(
    to: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    dueDate: string
  ) {
    await this.send(
      to,
      `Recordatorio de pago: Factura ${invoiceNumber}`,
      `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 32px; color: #111827;">
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">Recordatorio de pago</h1>
        <p style="color: #6b7280;">Estimado/a ${clientName},</p>
        <p style="color: #374151; line-height: 1.6;">
          Le recordamos que tiene pendiente el pago de la factura <strong>${invoiceNumber}</strong>
          por importe de <strong>${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)}</strong>
          con vencimiento el <strong>${dueDate}</strong>.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          Si ya ha realizado el pago, por favor ignore este mensaje.
        </p>
      </div>
      `
    );
  }
}
