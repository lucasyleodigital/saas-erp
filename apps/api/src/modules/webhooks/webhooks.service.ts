import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

export interface WebhookEvent {
  event: string;
  data: Record<string, any>;
  timestamp: string;
  companyId: string;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger("WebhooksService");

  constructor(private prisma: PrismaService) {}

  async getEndpoints(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
    const settings = (company?.settings as any) ?? {};
    return settings.webhooks ?? [];
  }

  async saveEndpoints(companyId: string, webhooks: Array<{ url: string; events: string[]; active: boolean }>) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
    const settings = (company?.settings as any) ?? {};
    await this.prisma.company.update({
      where: { id: companyId },
      data: { settings: { ...settings, webhooks } },
    });
    return { saved: true, count: webhooks.length };
  }

  async dispatch(companyId: string, event: string, data: Record<string, any>) {
    try {
      const endpoints = await this.getEndpoints(companyId);
      const matching = (endpoints as any[]).filter(
        (ep: any) => ep.active && (ep.events.includes(event) || ep.events.includes("*")),
      );

      const payload: WebhookEvent = {
        event,
        data,
        timestamp: new Date().toISOString(),
        companyId,
      };

      const results = await Promise.allSettled(
        matching.map((ep: any) =>
          fetch(ep.url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Webhook-Event": event },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
          }),
        ),
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) this.logger.warn(`Webhook ${event}: ${sent} sent, ${failed} failed`);
    } catch (err) {
      this.logger.error(`Webhook dispatch error: ${err}`);
    }
  }

  getAvailableEvents() {
    return [
      "invoice.created",
      "invoice.paid",
      "invoice.overdue",
      "invoice.cancelled",
      "client.created",
      "client.updated",
      "quote.created",
      "quote.accepted",
      "payment.received",
      "deal.stage_changed",
    ];
  }
}
