import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PLAN_LIMITS, type PlanLimits, type PlanType } from "@saas/types";

type PlanFeature = {
  [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never;
}[keyof PlanLimits];
type PlanLimitKey = {
  [K in keyof PlanLimits]: PlanLimits[K] extends number ? K : never;
}[keyof PlanLimits];

const FEATURE_NAMES: Record<PlanFeature, string> = {
  canSendEmails: "el envío de emails",
  hasAccounting: "la contabilidad",
  hasFullAccounting: "la contabilidad completa (modelos 347, 111, 190 y 202)",
  hasVeriFactu: "VeriFactu",
  hasApiAccess: "el acceso a la API",
  hasPayroll: "las nóminas",
  hasExpenseClaims: "los gastos y dietas de empleados",
  hasExpenseAdvanced: "los tickets por email ni la conciliación de tarjetas",
  hasFleet: "la flota de vehículos ni el DeCA",
};

const LIMIT_NAMES: Record<PlanLimitKey, string> = {
  maxUsers: "usuarios",
  maxEmployees: "empleados",
  maxClients: "clientes",
  maxInvoicesPerMonth: "facturas este mes",
  maxQuotesPerMonth: "presupuestos este mes",
  maxProducts: "productos",
  maxAutomations: "automatizaciones",
};

// El plan se consulta en casi cada petición; se guarda unos segundos para no ir a la BD cada vez
const PLAN_CACHE_MS = 30_000;
const planCache = new Map<string, { plan: PlanType; expires: number }>();

/** Olvida los planes guardados; llamar tras cambiar el plan de una empresa. */
export function clearPlanCache() {
  planCache.clear();
}

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  /** Returns the limits for the company's current plan */
  async getLimits(companyId: string) {
    return PLAN_LIMITS[await this.getPlan(companyId)];
  }

  /** Returns the company plan */
  async getPlan(companyId: string) {
    const cached = planCache.get(companyId);
    if (cached && cached.expires > Date.now()) return cached.plan;
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { plan: true },
    });
    const plan = company.plan as PlanType;
    planCache.set(companyId, { plan, expires: Date.now() + PLAN_CACHE_MS });
    return plan;
  }

  /** Throws ForbiddenException if the feature is not available in the plan */
  async requireFeature(companyId: string, feature: PlanFeature) {
    if (!(await this.hasFeature(companyId, feature))) {
      throw new ForbiddenException(
        `Tu plan actual no incluye ${FEATURE_NAMES[feature]}. Actualiza tu plan para usar esta función.`
      );
    }
  }

  async hasFeature(companyId: string, feature: PlanFeature) {
    const limits = await this.getLimits(companyId);
    return Boolean(limits[feature]);
  }

  /** Throws ForbiddenException if a numeric limit is exceeded */
  async checkLimit(companyId: string, limitKey: PlanLimitKey, currentCount: number) {
    const limits = await this.getLimits(companyId);
    const max = limits[limitKey];
    if (max !== -1 && currentCount >= max) {
      throw new ForbiddenException(
        max === 0
          ? `Tu plan actual no incluye ${LIMIT_NAMES[limitKey]}. Actualiza tu plan para usar esta función.`
          : `Has alcanzado el límite de ${LIMIT_NAMES[limitKey]} de tu plan (máximo ${max}). Actualiza tu plan para continuar.`
      );
    }
  }

  async countEmployees(companyId: string) {
    return this.prisma.employee.count({ where: { companyId, status: { not: "INACTIVE" } } });
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
    return this.prisma.userCompany.count({ where: { companyId, role: { not: "EMPLOYEE" } } });
  }

  /** Full plan info for the billing/settings page */
  async getPlanInfo(companyId: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { plan: true, stripeSubId: true, stripeCustomerId: true },
    });

    const plan = company.plan as PlanType;
    const limits = PLAN_LIMITS[plan];

    const [clients, invoicesMonth, quotesMonth, products, automations, users, employees] =
      await Promise.all([
        this.countClients(companyId),
        this.countInvoicesThisMonth(companyId),
        this.countQuotesThisMonth(companyId),
        this.countProducts(companyId),
        this.countAutomations(companyId),
        this.countUsers(companyId),
        this.countEmployees(companyId),
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
        employees,
      },
    };
  }
}
