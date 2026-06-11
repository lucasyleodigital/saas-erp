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
    this.from = config.get("EMAIL_FROM", "ERP SaaS <noreply@tusaas.es>");
    this.clientUrl = config.get("CLIENT_URL", "http://localhost:3000");
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
      `¡Bienvenido a ERP SaaS, ${firstName}!`,
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 32px; color: #111827;">
        <div style="width: 40px; height: 40px; background: #6366f1; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
          <span style="color: white; font-weight: bold; font-size: 18px;">E</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">¡Bienvenido, ${firstName}!</h1>
        <p style="color: #6b7280; margin: 0 0 24px; line-height: 1.6;">
          Tu empresa <strong style="color: #111827;">${companyName}</strong> ya está lista en ERP SaaS.
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
