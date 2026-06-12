import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
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

    for (const automation of automations) {
      try {
        await this.executeAction(automation, context);
        await this.prisma.automation.update({
          where: { id: automation.id },
          data: { runCount: { increment: 1 }, lastRunAt: new Date() },
        });
      } catch (err) {
        console.error(`[Automation] Error running ${automation.id}:`, err);
      }
    }
  }

  private async executeAction(automation: any, ctx: Record<string, any>) {
    const config = automation.actionConfig as Record<string, any>;

    switch (automation.action) {
      case "SEND_EMAIL":
        if (ctx.clientEmail && config.subject) {
          // Use internal Resend send
          await (this.email as any).send(
            ctx.clientEmail,
            config.subject.replace(/\{\{(\w+)\}\}/g, (_: any, k: string) => ctx[k] ?? ""),
            config.body?.replace(/\{\{(\w+)\}\}/g, (_: any, k: string) => ctx[k] ?? "") ?? "",
          );
        }
        break;

      case "CREATE_NOTIFICATION":
        if (ctx.companyId) {
          await this.notifications.create(ctx.companyId, {
            title: config.title?.replace(/\{\{(\w+)\}\}/g, (_: any, k: string) => ctx[k] ?? "") ?? automation.name,
            body: config.body?.replace(/\{\{(\w+)\}\}/g, (_: any, k: string) => ctx[k] ?? "") ?? "",
          });
        }
        break;

      case "SEND_WEBHOOK":
        if (config.url && this.isSafeWebhookUrl(config.url)) {
          await fetch(config.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trigger: automation.trigger, data: ctx }),
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
      // Block private/internal IP ranges and localhost
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
