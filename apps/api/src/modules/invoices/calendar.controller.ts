import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PrismaService } from "../../database/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Calendar")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("calendar")
export class CalendarController {
  constructor(private prisma: PrismaService) {}

  @Get("events")
  async getEvents(
    @CurrentUser() u: JwtPayload,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    const start = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = to ? new Date(to + "T23:59:59") : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
    const companyId = u.companyId;

    const [invoicesDue, invoicesIssued, quotes] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { companyId, dueDate: { gte: start, lte: end }, status: { notIn: ["CANCELLED", "DRAFT"] } },
        select: { id: true, number: true, total: true, dueDate: true, status: true, client: { select: { name: true } } },
      }),
      this.prisma.invoice.findMany({
        where: { companyId, issueDate: { gte: start, lte: end }, status: { notIn: ["CANCELLED"] } },
        select: { id: true, number: true, total: true, issueDate: true, status: true, client: { select: { name: true } } },
      }),
      this.prisma.quote.findMany({
        where: { companyId, validUntil: { gte: start, lte: end }, status: { notIn: ["REJECTED", "EXPIRED"] } },
        select: { id: true, number: true, total: true, validUntil: true, status: true, clientId: true },
      }),
    ]);

    const events = [
      ...invoicesDue.map((inv) => ({
        id: inv.id,
        type: "invoice_due" as const,
        title: `Vence ${inv.number}`,
        subtitle: inv.client?.name ?? "",
        date: inv.dueDate!.toISOString().slice(0, 10),
        amount: Number(inv.total),
        status: inv.status,
        color: inv.status === "OVERDUE" ? "#dc2626" : inv.status === "PAID" ? "#059669" : "#2563eb",
      })),
      ...invoicesIssued.map((inv) => ({
        id: `iss-${inv.id}`,
        type: "invoice_issued" as const,
        title: `Emitida ${inv.number}`,
        subtitle: inv.client?.name ?? "",
        date: inv.issueDate.toISOString().slice(0, 10),
        amount: Number(inv.total),
        status: inv.status,
        color: "#6b7280",
      })),
      ...quotes.map((q) => ({
        id: q.id,
        type: "quote_expiry" as const,
        title: `Caduca ${q.number}`,
        subtitle: "",
        date: q.validUntil!.toISOString().slice(0, 10),
        amount: Number(q.total),
        status: q.status,
        color: "#d97706",
      })),
    ];

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }
}
