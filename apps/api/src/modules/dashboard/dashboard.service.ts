import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(companyId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      revenueThisMonth,
      revenueLastMonth,
      pendingInvoices,
      activeClients,
      clientsLastMonth,
      openDeals,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: {
          companyId,
          status: "PAID",
          issueDate: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          companyId,
          status: "PAID",
          issueDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: { companyId, status: { in: ["SENT", "OVERDUE"] } },
        _count: true,
        _sum: { total: true },
      }),
      this.prisma.client.count({ where: { companyId, isActive: true } }),
      this.prisma.client.count({
        where: {
          companyId,
          isActive: true,
          createdAt: { lt: startOfMonth },
        },
      }),
      this.prisma.deal.aggregate({
        where: {
          companyId,
          stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
        },
        _count: true,
        _sum: { value: true },
      }),
    ]);

    const rev = Number(revenueThisMonth._sum.total ?? 0);
    const prevRev = Number(revenueLastMonth._sum.total ?? 0);
    const revenueChange = prevRev > 0 ? ((rev - prevRev) / prevRev) * 100 : 0;
    const clientsChange =
      clientsLastMonth > 0
        ? ((activeClients - clientsLastMonth) / clientsLastMonth) * 100
        : 0;

    return {
      totalRevenue: rev,
      revenueChange: Math.round(revenueChange * 10) / 10,
      pendingInvoices: pendingInvoices._count,
      pendingAmount: Number(pendingInvoices._sum.total ?? 0),
      activeClients,
      clientsChange: Math.round(clientsChange * 10) / 10,
      openDeals: openDeals._count,
      openDealsValue: Number(openDeals._sum.value ?? 0),
    };
  }

  async getRevenueChart(companyId: string) {
    const months = 6;
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [revenue, expenses] = await Promise.all([
        this.prisma.invoice.aggregate({
          where: {
            companyId,
            status: "PAID",
            issueDate: { gte: start, lte: end },
          },
          _sum: { total: true },
        }),
        this.prisma.journalEntry.findMany({
          where: {
            companyId,
            entryDate: { gte: start, lte: end },
          },
          include: { items: true },
        }),
      ]);

      const expenseTotal = expenses
        .flatMap((e) => e.items)
        .reduce((sum, item) => sum + Number(item.debit), 0);

      results.push({
        month: start.toLocaleString("es-ES", { month: "short" }),
        revenue: Number(revenue._sum.total ?? 0),
        expenses: expenseTotal,
      });
    }

    return results;
  }
}
