import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PrismaService } from "../../database/prisma.service";
import { EmailService } from "../email/email.service";

// These must be replaced with real Stripe price IDs from the Stripe dashboard
const PRICE_IDS: Record<string, string> = {
  STARTER: process.env.STRIPE_PRICE_STARTER ?? "price_starter",
  PRO: process.env.STRIPE_PRICE_PRO ?? "price_pro",
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE ?? "price_enterprise",
};

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private email: EmailService
  ) {
    const stripeKey = this.config.get<string>("STRIPE_SECRET_KEY");
    if (stripeKey && stripeKey.startsWith("sk_")) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: "2024-11-20.acacia" as any,
      });
    }
  }

  private get stripeClient(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException("YouWhole Billing: añade STRIPE_SECRET_KEY al entorno para activar pagos");
    }
    return this.stripe;
  }

  async createCheckoutSession(
    companyId: string,
    plan: "STARTER" | "PRO" | "ENTERPRISE",
    successUrl: string,
    cancelUrl: string
  ) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });

    let customerId = company.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripeClient.customers.create({
        email: company.email ?? undefined,
        name: company.legalName ?? company.name,
        metadata: { companyId },
      });
      customerId = customer.id;
      await this.prisma.company.update({
        where: { id: companyId },
        data: { stripeCustomerId: customerId },
      });
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) throw new BadRequestException("Plan no válido");

    const session = await this.stripeClient.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { companyId, plan },
    });

    return { url: session.url };
  }

  async createPortalSession(companyId: string, returnUrl: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });

    if (!company.stripeCustomerId) {
      throw new BadRequestException("Esta empresa no tiene una suscripción activa");
    }

    const session = await this.stripeClient.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async createInvoicePaymentLink(
    companyId: string,
    invoiceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { client: true, company: true },
    });
    if (!invoice) throw new BadRequestException("Factura no encontrada");
    if (invoice.status === "PAID") throw new BadRequestException("La factura ya esta pagada");
    if (invoice.status === "CANCELLED") throw new BadRequestException("La factura esta cancelada");

    const remaining = Number(invoice.total) - Number(invoice.paidAmount);
    if (remaining <= 0) throw new BadRequestException("No hay importe pendiente");

    let customerId = invoice.company?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await this.stripeClient.customers.create({
        email: invoice.company?.email ?? undefined,
        name: invoice.company?.legalName ?? invoice.company?.name,
        metadata: { companyId },
      });
      customerId = customer.id;
      await this.prisma.company.update({
        where: { id: companyId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripeClient.checkout.sessions.create({
      mode: "payment",
      customer_email: invoice.client?.email ?? undefined,
      line_items: [{
        price_data: {
          currency: invoice.currency.toLowerCase(),
          unit_amount: Math.round(remaining * 100),
          product_data: {
            name: `Factura ${invoice.number}`,
            description: `${invoice.company?.name ?? ""}`,
          },
        },
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { companyId, invoiceId, type: "invoice_payment" },
    });

    return { url: session.url, amount: remaining };
  }

  async handleWebhook(body: Buffer, signature: string) {
    const secret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!secret) {
      throw new BadRequestException("STRIPE_WEBHOOK_SECRET no configurado");
    }
    let event: Stripe.Event;

    try {
      event = this.stripeClient.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature inválida: ${err}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { companyId, plan, invoiceId, type } = session.metadata ?? {};

        if (type === "invoice_payment" && invoiceId) {
          const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
          if (inv) {
            const paid = Number(session.amount_total ?? 0) / 100;
            const newPaid = Number(inv.paidAmount) + paid;
            const newStatus = newPaid >= Number(inv.total) ? "PAID" : "PARTIAL";
            await this.prisma.$transaction([
              this.prisma.payment.create({
                data: { invoiceId, amount: paid, method: "STRIPE" as any },
              }),
              this.prisma.invoice.update({
                where: { id: invoiceId },
                data: { paidAmount: newPaid, status: newStatus as any },
              }),
            ]);
          }
          break;
        }

        if (companyId && plan) {
          const company = await this.prisma.company.update({
            where: { id: companyId },
            data: {
              plan: plan as any,
              stripeSubId: session.subscription as string,
            },
          });
          const priceByPlan: Record<string, number> = { STARTER: 29, PRO: 79, ENTERPRISE: 199 };
          await this.email.sendContractEmail({
            clientEmail: company.email,
            companyName: company.name,
            cif: company.cif,
            plan,
            price: priceByPlan[plan] ?? 0,
            acceptedAt: new Date(),
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await this.prisma.company.updateMany({
          where: { stripeSubId: sub.id },
          data: { plan: "FREE", stripeSubId: null },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        // Handle plan changes via customer portal
        const company = await this.prisma.company.findFirst({
          where: { stripeSubId: sub.id },
        });
        if (company && sub.status === "active") {
          // Re-read price to determine plan
          const priceId = sub.items.data[0]?.price.id;
          const planEntry = Object.entries(PRICE_IDS).find(([, v]) => v === priceId);
          if (planEntry) {
            await this.prisma.company.update({
              where: { id: company.id },
              data: { plan: planEntry[0] as any },
            });
          }
        }
        break;
      }
    }

    return { received: true };
  }
}
