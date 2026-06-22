import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../database/prisma.service";
import { EmailService } from "../email/email.service";

@Injectable()
export class OverdueService {
  private readonly logger = new Logger("OverdueService");

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async processOverdueInvoices() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ["SENT", "PARTIAL"] },
        dueDate: { lt: now },
      },
      include: {
        client: true,
        company: { select: { name: true, email: true, settings: true } },
      },
    });

    if (!overdueInvoices.length) return;

    await this.prisma.invoice.updateMany({
      where: {
        id: { in: overdueInvoices.map((i) => i.id) },
        status: "SENT",
      },
      data: { status: "OVERDUE" },
    });

    const settings3 = [3, 7, 15, 30];

    for (const inv of overdueInvoices) {
      const daysOverdue = Math.floor((now.getTime() - inv.dueDate!.getTime()) / 86400000);

      if (!settings3.includes(daysOverdue) && daysOverdue % 30 !== 0) continue;

      const clientEmail = inv.client?.email;
      if (!clientEmail) continue;

      try {
        const remaining = Number(inv.total) - Number(inv.paidAmount);
        await this.email.sendPaymentReminder(
          clientEmail,
          inv.client!.name,
          inv.number,
          remaining,
          inv.company?.name ?? "",
          daysOverdue,
        );
        this.logger.log(`Reminder sent for ${inv.number} to ${clientEmail} (${daysOverdue} days overdue)`);
      } catch (err) {
        this.logger.error(`Failed to send reminder for ${inv.number}: ${err}`);
      }
    }
  }
}
