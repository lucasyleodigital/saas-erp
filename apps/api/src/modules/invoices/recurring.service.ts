import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../database/prisma.service";

type Interval = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

function addInterval(date: Date, interval: Interval): Date {
  const d = new Date(date);
  switch (interval) {
    case "WEEKLY":    d.setDate(d.getDate() + 7); break;
    case "BIWEEKLY":  d.setDate(d.getDate() + 14); break;
    case "MONTHLY":   d.setMonth(d.getMonth() + 1); break;
    case "QUARTERLY": d.setMonth(d.getMonth() + 3); break;
    case "YEARLY":    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

@Injectable()
export class RecurringService {
  private readonly logger = new Logger("RecurringService");

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async processRecurringInvoices() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const templates = await this.prisma.invoice.findMany({
      where: { isRecurring: true, recurringCron: { not: null } },
      include: { items: true, taxes: { include: { tax: true } } },
    });

    for (const tpl of templates) {
      try {
        const interval = tpl.recurringCron as Interval;
        if (!["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"].includes(interval)) continue;

        const nextDate = addInterval(tpl.issueDate, interval);
        const lastCreated = await this.prisma.invoice.findFirst({
          where: {
            companyId: tpl.companyId,
            clientId: tpl.clientId,
            notes: { contains: `[recurrente:${tpl.id}]` },
          },
          orderBy: { issueDate: "desc" },
        });

        const referenceDate = lastCreated?.issueDate ?? tpl.issueDate;
        const nextDue = addInterval(referenceDate, interval);
        if (nextDue > today) continue;

        const series = tpl.seriesId
          ? await this.prisma.invoiceSeries.findFirst({ where: { id: tpl.seriesId } })
          : await this.prisma.invoiceSeries.findFirst({ where: { companyId: tpl.companyId, isDefault: true } });

        if (!series) continue;

        const number = `${series.prefix}${String(series.nextNumber).padStart(4, "0")}`;
        const dueOffset = tpl.dueDate
          ? Math.round((tpl.dueDate.getTime() - tpl.issueDate.getTime()) / 86400000)
          : 30;

        await this.prisma.$transaction([
          this.prisma.invoice.create({
            data: {
              companyId: tpl.companyId,
              clientId: tpl.clientId,
              seriesId: series.id,
              number,
              issueDate: nextDue,
              dueDate: new Date(nextDue.getTime() + dueOffset * 86400000),
              currency: tpl.currency,
              subtotal: tpl.subtotal,
              taxAmount: tpl.taxAmount,
              total: tpl.total,
              notes: `${tpl.notes ?? ""}\n[recurrente:${tpl.id}]`.trim(),
              terms: tpl.terms,
              items: {
                create: tpl.items.map((item, i) => ({
                  productId: item.productId,
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discount: item.discount,
                  subtotal: item.subtotal,
                  order: i,
                })),
              },
              taxes: tpl.taxes.length > 0
                ? {
                    create: tpl.taxes.map((t) => ({
                      taxId: t.taxId,
                      rate: t.rate,
                      base: t.base,
                      amount: t.amount,
                    })),
                  }
                : undefined,
            },
          }),
          this.prisma.invoiceSeries.update({
            where: { id: series.id },
            data: { nextNumber: { increment: 1 } },
          }),
        ]);

        this.logger.log(`Recurring invoice created from template ${tpl.number} → ${number}`);
      } catch (err) {
        this.logger.error(`Failed to process recurring invoice ${tpl.id}: ${err}`);
      }
    }
  }
}
