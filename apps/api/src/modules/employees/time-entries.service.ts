import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class TimeEntriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, params: any) {
    const { employeeId, projectId, dateFrom, dateTo, page = 1, limit = 50 } = params;
    const p = Number(page);
    const l = Number(limit);
    const where: any = { companyId };
    if (employeeId) where.employeeId = employeeId;
    if (projectId) where.projectId = projectId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.timeEntry.findMany({
        where,
        include: {
          employee: { select: { firstName: true, lastName: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.timeEntry.count({ where }),
    ]);

    return { data, total, totalPages: Math.ceil(total / l) };
  }

  async create(companyId: string, data: any) {
    const clockIn = new Date(data.clockIn);
    const clockOut = data.clockOut ? new Date(data.clockOut) : null;
    const totalMinutes = clockOut ? Math.round((clockOut.getTime() - clockIn.getTime()) / 60000) - (Number(data.breakMinutes) || 0) : null;

    return this.prisma.timeEntry.create({
      data: {
        companyId,
        employeeId: data.employeeId,
        projectId: data.projectId || null,
        date: new Date(data.date),
        clockIn,
        clockOut,
        breakMinutes: Number(data.breakMinutes) || 0,
        totalMinutes,
        notes: data.notes || null,
      },
    });
  }

  async remove(companyId: string, id: string) {
    const entry = await this.prisma.timeEntry.findFirst({ where: { id, companyId } });
    if (!entry) throw new NotFoundException("Entrada no encontrada");
    return this.prisma.timeEntry.delete({ where: { id } });
  }
}
