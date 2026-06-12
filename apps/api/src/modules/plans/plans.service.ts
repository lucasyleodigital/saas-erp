import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PLAN_LIMITS, type PlanType } from "@saas/types";

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  /** Returns the limits for the company's current plan */
  async getLimits(companyId: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { plan: true },
    });
    return PLAN_LIMITS[company.plan as PlanType];
  }

  /** Returns the company plan */
  async getPlan(companyId: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { plan: true },
    });
    return company.plan as PlanType;
  }

  /** Throws ForbiddenException if the feature is not available in the plan */
  async requireFeature(
    companyId: string,
    feature: "canSendEmails" | "hasAccounting" | "hasVeriFactu" | "hasApiAccess"
  ) {
    const limits = await this.getLimits(companyId);
    if (!limits[feature]) {
      const featureNames: Record<string, string> = {
        canSendEmails: "envío de emails",
        hasAccounting: "contabilidad",
        hasVeriFactu: "VeriFactu",
        hasApiAccess: "acceso a la API",
      };
      throw new ForbiddenException(
        `Tu plan actual no incluye ${featureNames[feature]}. Actualiza tu plan para usar esta función.`
      );
    }
  }

  /** Throws ForbiddenException if a numeric limit is exceeded */
  async checkLimit(
    companyId: string,
    limitKey: "maxUsers" | "maxClients" | "maxInvoicesPerMonth" | "maxQuotesPerMonth" | "maxProducts" | "maxAutomations",
    currentCount: number
  ) {
    const limits = await this.getLimits(companyId);
    const max = limits[limitKey];
    if (max !== -1 && currentCount >= max) {
      const limitNames: Record<string, string> = {
        maxUsers: "usuarios",
        maxClients: "clientes",
        maxInvoicesPerMonth: "facturas este mes",
        maxQuotesPerMonth: "presupuestos este mes",
        maxProducts: "productos",
        maxAutomations: "automatizaciones",
      };
      throw new ForbiddenException(
        `Has alcanzado el límite de ${limitNames[limitKey]} de tu plan (máximo ${max}). Actualiza tu plan para continuar.`
      );
    }
  }

  /** Count clients for a company */
  async countClients(companyId: string) {
    return this.prisma.client.count({ where: { companyId, isActive: true } });
  }

  /** Count invoices created this calendar month */
  async countInvoicesThisMonth(companyId: string) {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return this.prisma.invoice.count({
      where: { companyId, createdAt: { gte: start } },
    });
  }

  /** Count quotes created this calendar month */
  async countQuotesThisMonth(companyId: string) {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return this.prisma.quote.count({
      where: { companyId, createdAt: { gte: start } },
    });
  }

  /** Count products */
  async countProducts(companyId: string) {
    return this.prisma.product.count({ where: { companyId, isActive: true } });
  }

  /** Count active automations */
  async countAutomations(companyId: string) {
    return this.prisma.automation.count({ where: { companyId } });
  }

  /** Count users in company */
  async countUsers(companyId: string) {
    return this.prisma.userCompany.count({ where: { companyId } });
  }

  /** Full plan info for the billing/settings page */
  async getPlanInfo(companyId: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { plan: true, stripeSubId: true, stripeCustomerId: true },
    });

    const plan = company.plan as PlanType;
    const limits = PLAN_LIMITS[plan];

    const [clients, invoicesMonth, quotesMonth, products, automations, users] =
      await Promise.all([
        this.countClients(companyId),
        this.countInvoicesThisMonth(companyId),
        this.countQuotesThisMonth(companyId),
        this.countProducts(companyId),
        this.countAutomations(companyId),
        this.countUsers(companyId),
      ]);

    return {
      plan,
      hasSubscription: !!company.stripeSubId,
      limits,
      usage: {
        clients,
        invoicesThisMonth: invoicesMonth,
        quotesThisMonth: quotesMonth,
        products,
        automations,
        users,
      },
    };
  }
}
