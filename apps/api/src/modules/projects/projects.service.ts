import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, params: any) {
    const { status, clientId, search, page = 1, limit = 20 } = params;
    const p = Number(page);
    const l = Number(limit);
    const where: any = { companyId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          _count: { select: { timeEntries: true, invoices: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, totalPages: Math.ceil(total / l) };
  }

  async findOne(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
      include: {
        client: { select: { id: true, name: true } },
        timeEntries: {
          include: {
            employee: { select: { firstName: true, lastName: true } },
          },
          orderBy: { date: "desc" },
          take: 50,
        },
        invoices: {
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
            issueDate: true,
          },
          orderBy: { issueDate: "desc" },
        },
      },
    });
    if (!project) throw new NotFoundException("Proyecto no encontrado");
    return project;
  }

  async create(companyId: string, data: any) {
    return this.prisma.project.create({
      data: {
        ...data,
        companyId,
        budget: data.budget ? Number(data.budget) : null,
        hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : null,
      },
    });
  }

  async update(companyId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        budget:
          data.budget !== undefined ? Number(data.budget) : undefined,
        hourlyRate:
          data.hourlyRate !== undefined
            ? Number(data.hourlyRate)
            : undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.project.delete({ where: { id } });
  }

  async profitability(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
      include: {
        invoices: {
          where: { status: { in: ["PAID", "PARTIAL"] } },
          select: { total: true, paidAmount: true },
        },
        timeEntries: { select: { totalMinutes: true } },
      },
    });
    if (!project) throw new NotFoundException("Proyecto no encontrado");

    const revenue = project.invoices.reduce(
      (sum, inv) => sum + Number(inv.paidAmount),
      0,
    );
    const totalHours =
      project.timeEntries.reduce(
        (sum, te) => sum + (te.totalMinutes ?? 0),
        0,
      ) / 60;
    const budget = Number(project.budget ?? 0);
    const hourlyRate = Number(project.hourlyRate ?? 0);
    const estimatedCost = totalHours * hourlyRate;

    return {
      revenue,
      totalHours: Math.round(totalHours * 100) / 100,
      budget,
      budgetUsed:
        budget > 0
          ? Math.round((revenue / budget) * 10000) / 100
          : 0,
      estimatedCost,
      profit: revenue - estimatedCost,
      margin:
        revenue > 0
          ? Math.round(
              ((revenue - estimatedCost) / revenue) * 10000,
            ) / 100
          : 0,
    };
  }
}
