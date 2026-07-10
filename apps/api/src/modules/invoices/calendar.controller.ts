import {
  Controller, Get, Post, Patch, Delete,
  Query, Body, Param, UseGuards,
} from "@nestjs/common";
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

    const [invoicesDue, invoicesIssued, quotes, entries] = await Promise.all([
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
      this.prisma.calendarEntry.findMany({
        where: { companyId, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
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
        readonly: true,
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
        readonly: true,
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
        readonly: true,
      })),
      ...entries.map((e) => ({
        id: e.id,
        type: e.type as "APPOINTMENT" | "TASK" | "REMINDER",
        title: e.title,
        subtitle: e.description ?? "",
        date: e.date.toISOString().slice(0, 10),
        amount: undefined,
        status: e.done ? "DONE" : "PENDING",
        color: e.color ?? (e.type === "APPOINTMENT" ? "#7c3aed" : e.type === "TASK" ? "#0891b2" : "#b45309"),
        done: e.done,
        readonly: false,
      })),
    ];

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  @Get("entries")
  async getEntries(
    @CurrentUser() u: JwtPayload,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    const start = from ? new Date(from) : new Date();
    const end = to ? new Date(to + "T23:59:59") : new Date(new Date().getFullYear(), 11, 31);
    return this.prisma.calendarEntry.findMany({
      where: { companyId: u.companyId, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    });
  }

  @Post("entries")
  async createEntry(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.prisma.calendarEntry.create({
      data: {
        companyId: u.companyId,
        userId: u.sub,
        type: body.type ?? "REMINDER",
        title: body.title,
        description: body.description,
        date: new Date(body.date),
        endDate: body.endDate ? new Date(body.endDate) : null,
        allDay: body.allDay ?? true,
        color: body.color,
      },
    });
  }

  @Patch("entries/:id")
  async updateEntry(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.prisma.calendarEntry.updateMany({
      where: { id, companyId: u.companyId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.done !== undefined && { done: body.done }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.type !== undefined && { type: body.type }),
      },
    });
  }

  @Delete("entries/:id")
  async deleteEntry(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    await this.prisma.calendarEntry.deleteMany({ where: { id, companyId: u.companyId } });
    return { ok: true };
  }
}
