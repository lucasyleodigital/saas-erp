import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PlansService } from "../plans/plans.service";
import { EmailService } from "../email/email.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class AutomationsService {
  constructor(
    private prisma: PrismaService,
    private plans: PlansService,
    private email: EmailService,
    private notifications: NotificationsService,
  ) {}

  async findAll(companyId: string) {
    return this.prisma.automation.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(companyId: string, data: any) {
    const count = await this.plans.countAutomations(companyId);
    await this.plans.checkLimit(companyId, "maxAutomations", count);
    return this.prisma.automation.create({
      data: { ...data, companyId },
    });
  }

  async update(companyId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    return this.prisma.automation.update({ where: { id }, data });
  }

  async toggle(companyId: string, id: string) {
    const automation = await this.findOne(companyId, id);
    return this.prisma.automation.update({
      where: { id },
      data: { isActive: !automation.isActive },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.automation.delete({ where: { id } });
  }

  private async findOne(companyId: string, id: string) {
    const automation = await this.prisma.automation.findFirst({
      where: { id, companyId },
    });
    if (!automation) throw new NotFoundException("Automatización no encontrada");
    return automation;
  }

  // ---- Runtime: trigger automations ----
  async trigger(companyId: string, trigger: string, context: Record<string, any>) {
    const automations = await this.prisma.automation.findMany({
      where: { companyId, trigger: trigger as any, isActive: true },
    });

    const ctx = { ...context, companyId };

    for (const automation of automations) {
      let success = true;
      let errorMessage: string | undefined;

      try {
        await this.executeAction(automation, ctx);
        await this.prisma.automation.update({
          where: { id: automation.id },
          data: { runCount: { increment: 1 }, lastRunAt: new Date() },
        });
      } catch (err: any) {
        success = false;
        errorMessage = err?.message ?? String(err);
        console.error(`[Automation] Error running ${automation.id}:`, err);
      }

      // Log execution (fire-and-forget, don't fail trigger on log error)
      this.prisma.automationLog.create({
        data: {
          automationId: automation.id,
          companyId,
          trigger,
          success,
          errorMessage,
          payload: ctx,
        },
      }).catch((e) => console.error("[AutomationLog] Error writing log:", e));
    }
  }

  async testAutomation(companyId: string, id: string) {
    const automation = await this.findOne(companyId, id);

    // Build sample context per trigger type
    const sampleCtx: Record<string, Record<string, any>> = {
      INVOICE_CREATED:           { clientEmail: "test@example.com", clientName: "Cliente Test", invoiceNumber: "FAC-2024-0001", total: "1000.00", currency: "EUR" },
      INVOICE_PAID:              { clientEmail: "test@example.com", clientName: "Cliente Test", invoiceNumber: "FAC-2024-0001", total: "1000.00" },
      INVOICE_OVERDUE:           { clientEmail: "test@example.com", clientName: "Cliente Test", invoiceNumber: "FAC-2024-0001", total: "1000.00", daysOverdue: 5 },
      QUOTE_CREATED:             { clientEmail: "test@example.com", clientName: "Cliente Test", quoteNumber: "PRE-2024-0001", total: "500.00" },
      QUOTE_ACCEPTED:            { clientEmail: "test@example.com", clientName: "Cliente Test", quoteNumber: "PRE-2024-0001", total: "500.00" },
      LEAD_CREATED:              { leadName: "Juan García", leadEmail: "juan@empresa.com", source: "web" },
      DEAL_STAGE_CHANGED:        { dealName: "Proyecto X", stage: "PROPOSAL", clientName: "Cliente Test" },
      PAYMENT_RECEIVED:          { clientEmail: "test@example.com", clientName: "Cliente Test", amount: "500.00", currency: "EUR" },
      CLIENT_CREATED:            { clientEmail: "nuevo@cliente.com", clientName: "Nuevo Cliente", clientId: "xxx" },
      ORDER_CREATED:             { clientEmail: "test@example.com", clientName: "Cliente Test", orderNumber: "PED-2024-0001", total: "750.00" },
      PURCHASE_ORDER_RECEIVED:   { supplierName: "Proveedor Test", orderNumber: "OC-2024-0001", total: "2000.00" },
      LOW_STOCK:                 { productName: "Producto Test", currentStock: 2, minStock: 5, sku: "SKU-001" },
    };

    const ctx = { companyId, ...(sampleCtx[automation.trigger] ?? {}) };

    let success = true;
    let errorMessage: string | undefined;

    try {
      await this.executeAction(automation, ctx);
    } catch (err: any) {
      success = false;
      errorMessage = err?.message ?? String(err);
    }

    await this.prisma.automationLog.create({
      data: { automationId: id, companyId, trigger: automation.trigger, success, errorMessage, payload: { ...ctx, _test: true } },
    });

    return { success, errorMessage, trigger: automation.trigger, action: automation.action };
  }

  async getLogs(companyId: string, automationId?: string) {
    return this.prisma.automationLog.findMany({
      where: {
        companyId,
        ...(automationId && { automationId }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        automation: { select: { id: true, name: true, trigger: true, action: true } },
      },
    });
  }

  private async executeAction(automation: any, ctx: Record<string, any>) {
    const config = automation.actionConfig as Record<string, any>;

    const interpolate = (template: string) =>
      template.replace(/\{\{(\w+)\}\}/g, (_: any, k: string) => String(ctx[k] ?? ""));

    switch (automation.action) {
      case "SEND_EMAIL":
        if (ctx.clientEmail && config.subject) {
          await (this.email as any).send(
            ctx.clientEmail,
            interpolate(config.subject),
            interpolate(config.body ?? ""),
          );
        }
        break;

      case "CREATE_NOTIFICATION":
        if (ctx.companyId) {
          await this.notifications.create(ctx.companyId, {
            title: interpolate(config.title ?? automation.name),
            body:  interpolate(config.body ?? ""),
          });
        }
        break;

      case "SEND_WEBHOOK":
        if (config.url && this.isSafeWebhookUrl(config.url)) {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(config.headers ?? {}),
          };
          const response = await fetch(config.url, {
            method: "POST",
            headers,
            body: JSON.stringify({
              trigger: automation.trigger,
              automation: { id: automation.id, name: automation.name },
              data: ctx,
              timestamp: new Date().toISOString(),
            }),
          });
          if (!response.ok) {
            throw new Error(`Webhook responded with ${response.status}`);
          }
        }
        break;

      case "UPDATE_DEAL_STAGE":
        if (ctx.dealId && config.stage) {
          await this.prisma.deal.update({
            where: { id: ctx.dealId },
            data: { stage: config.stage },
          });
        }
        break;

      default:
        break;
    }
  }

  // SSRF protection — only allow public HTTPS URLs
  private isSafeWebhookUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return false;
      const hostname = parsed.hostname.toLowerCase();
      const blocked = [
        "localhost", "127.", "0.0.0.0", "::1",
        "10.", "172.16.", "172.17.", "172.18.", "172.19.",
        "172.20.", "172.21.", "172.22.", "172.23.", "172.24.",
        "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
        "172.30.", "172.31.", "192.168.", "169.254.",
        "metadata.google", "metadata.aws", "169.254.169.254",
      ];
      return !blocked.some((b) => hostname.startsWith(b) || hostname.includes(b));
    } catch {
      return false;
    }
  }

  async getStats(companyId: string) {
    const [total, active, runs] = await Promise.all([
      this.prisma.automation.count({ where: { companyId } }),
      this.prisma.automation.count({ where: { companyId, isActive: true } }),
      this.prisma.automation.aggregate({ where: { companyId }, _sum: { runCount: true } }),
    ]);
    return { total, active, totalRuns: runs._sum.runCount ?? 0 };
  }
}
