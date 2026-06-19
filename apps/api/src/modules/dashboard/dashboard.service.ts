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
    const now = new Date();
    const monthRanges = Array.from({ length: 6 }, (_, idx) => {
      const offset = 5 - idx;
      const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
      return { start, end };
    });

    return Promise.all(
      monthRanges.map(async ({ start, end }) => {
        const [revenue, expenseAgg] = await Promise.all([
          this.prisma.invoice.aggregate({
            where: { companyId, status: "PAID", issueDate: { gte: start, lte: end } },
            _sum: { total: true },
          }),
          this.prisma.journalItem.aggregate({
            where: { entry: { companyId, entryDate: { gte: start, lte: end } } },
            _sum: { debit: true },
          }),
        ]);

        return {
          month: start.toLocaleString("es-ES", { month: "short" }),
          revenue: Number(revenue._sum.total ?? 0),
          expenses: Number(expenseAgg._sum.debit ?? 0),
        };
      }),
    );
  }

  async getRecentInvoices(companyId: string) {
    return this.prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: { select: { id: true, name: true, cifNif: true } },
      },
    });
  }

  async getTopClients(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId, isActive: true },
      orderBy: { totalBilled: "desc" },
      take: 5,
      include: {
        _count: { select: { invoices: true } },
      },
    });
  }
}
