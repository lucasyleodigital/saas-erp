import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class PortalService {
  constructor(private prisma: PrismaService) {}

  private getStripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key?.startsWith("sk_")) {
      throw new BadRequestException(
        "Stripe no está configurado. Añade STRIPE_SECRET_KEY al entorno."
      );
    }
    return new Stripe(key, { apiVersion: "2024-11-20.acacia" as any });
  }

  // ── Authenticated ─────────────────────────────────────────

  async generatePortalToken(companyId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId },
      select: { id: true, name: true, portalToken: true },
    });
    if (!client) throw new NotFoundException("Cliente no encontrado");
    // Idempotent: if token already exists, return it
    if (client.portalToken) return client;
    const token = randomUUID();
    return this.prisma.client.update({
      where: { id: clientId },
      data: { portalToken: token },
      select: { id: true, name: true, portalToken: true },
    });
  }

  async refreshPortalToken(companyId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId } });
    if (!client) throw new NotFoundException("Cliente no encontrado");
    const token = randomUUID();
    return this.prisma.client.update({
      where: { id: clientId },
      data: { portalToken: token },
      select: { id: true, name: true, portalToken: true },
    });
  }

  async revokePortalToken(companyId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId },
    });
    if (!client) throw new NotFoundException("Cliente no encontrado");
    return this.prisma.client.update({
      where: { id: clientId },
      data: { portalToken: null },
      select: { id: true, name: true, portalToken: true },
    });
  }

  // ── Public ────────────────────────────────────────────────

  async getPortalData(token: string) {
    const client = await this.prisma.client.findUnique({
      where: { portalToken: token },
      include: {
        company: {
          select: {
            name: true,
            legalName: true,
            logo: true,
            email: true,
            phone: true,
            website: true,
          },
        },
        invoices: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { issueDate: "desc" },
          select: {
            id: true,
            number: true,
            status: true,
            issueDate: true,
            dueDate: true,
            total: true,
            paidAmount: true,
            currency: true,
          },
        },
        quotes: {
          where: { status: { not: "EXPIRED" } },
          orderBy: { issueDate: "desc" },
          select: {
            id: true,
            number: true,
            status: true,
            issueDate: true,
            validUntil: true,
            total: true,
            currency: true,
          },
        },
      },
    });
    if (!client) throw new NotFoundException("Portal no encontrado o enlace inválido");
    const { portalToken: _t, ...rest } = client;
    void _t;
    return rest;
  }

  async createPaymentSession(
    token: string,
    invoiceId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const client = await this.prisma.client.findUnique({ where: { portalToken: token } });
    if (!client) throw new NotFoundException("Portal no encontrado");

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        clientId: client.id,
        status: { in: ["SENT", "OVERDUE", "PARTIAL"] },
      },
      include: { company: { select: { name: true } } },
    });
    if (!invoice) throw new NotFoundException("Factura no encontrada o ya pagada");

    const remaining = Math.max(
      0,
      Number(invoice.total) - Number(invoice.paidAmount)
    );
    if (remaining <= 0) throw new ConflictException("La factura ya está pagada");

    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: {
              name: `Factura ${invoice.number}`,
              description: invoice.company.name,
            },
            unit_amount: Math.round(remaining * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${successUrl}?paid=${invoiceId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { invoiceId, clientId: client.id, token },
    });

    return { url: session.url };
  }

  async verifyPayment(token: string, invoiceId: string, sessionId: string) {
    const client = await this.prisma.client.findUnique({ where: { portalToken: token } });
    if (!client) throw new NotFoundException("Portal no encontrado");

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, clientId: client.id },
    });
    if (!invoice) throw new NotFoundException("Factura no encontrada");
    if (invoice.status === "PAID") return { paid: true, already: true };

    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session.payment_status === "paid" &&
      session.metadata?.invoiceId === invoiceId
    ) {
      const amount = (session.amount_total ?? 0) / 100;
      await this.prisma.$transaction([
        this.prisma.payment.create({
          data: {
            invoiceId,
            amount,
            method: "STRIPE",
            reference: typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
            notes: "Pago vía portal del cliente",
          },
        }),
        this.prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID", paidAmount: amount },
        }),
      ]);
      return { paid: true, already: false };
    }

    return { paid: false, already: false };
  }

  async acceptQuote(token: string, quoteId: string) {
    const client = await this.prisma.client.findUnique({ where: { portalToken: token } });
    if (!client) throw new NotFoundException("Portal no encontrado");

    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, clientId: client.id, status: "SENT" },
    });
    if (!quote) throw new NotFoundException("Presupuesto no encontrado o ya respondido");

    return this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: "ACCEPTED" },
      select: { id: true, number: true, status: true },
    });
  }

  async rejectQuote(token: string, quoteId: string) {
    const client = await this.prisma.client.findUnique({ where: { portalToken: token } });
    if (!client) throw new NotFoundException("Portal no encontrado");

    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, clientId: client.id, status: "SENT" },
    });
    if (!quote) throw new NotFoundException("Presupuesto no encontrado o ya respondido");

    return this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: "REJECTED" },
      select: { id: true, number: true, status: true },
    });
  }
}
