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

  async clockIn(companyId: string, employeeId: string, projectId?: string) {
    const now = new Date();
    const open = await this.prisma.timeEntry.findFirst({
      where: { companyId, employeeId, clockOut: null },
    });
    if (open) throw new NotFoundException("Ya tienes un fichaje abierto. Ficha salida primero.");

    return this.prisma.timeEntry.create({
      data: {
        companyId,
        employeeId,
        projectId: projectId || null,
        date: now,
        clockIn: now,
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
  }

  async clockOut(companyId: string, employeeId: string, breakMinutes = 0) {
    const open = await this.prisma.timeEntry.findFirst({
      where: { companyId, employeeId, clockOut: null },
      orderBy: { clockIn: "desc" },
    });
    if (!open) throw new NotFoundException("No hay fichaje abierto");

    const now = new Date();
    const totalMinutes = Math.round((now.getTime() - open.clockIn.getTime()) / 60000) - breakMinutes;
    const STANDARD_DAY = 480; // 8 hours in minutes
    const overtimeMinutes = Math.max(0, totalMinutes - STANDARD_DAY);

    return this.prisma.timeEntry.update({
      where: { id: open.id },
      data: { clockOut: now, breakMinutes, totalMinutes, notes: overtimeMinutes > 0 ? `Horas extra: ${(overtimeMinutes / 60).toFixed(1)}h` : open.notes },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
  }

  async getActiveClocks(companyId: string) {
    return this.prisma.timeEntry.findMany({
      where: { companyId, clockOut: null },
      include: { employee: { select: { id: true, firstName: true, lastName: true } }, project: { select: { name: true } } },
      orderBy: { clockIn: "desc" },
    });
  }

  async getSummary(companyId: string, employeeId?: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const where: any = { companyId, clockOut: { not: null } };
    if (employeeId) where.employeeId = employeeId;

    const [todayEntries, weekEntries, monthEntries] = await Promise.all([
      this.prisma.timeEntry.findMany({ where: { ...where, date: { gte: todayStart } }, select: { totalMinutes: true } }),
      this.prisma.timeEntry.findMany({ where: { ...where, date: { gte: weekStart } }, select: { totalMinutes: true } }),
      this.prisma.timeEntry.findMany({ where: { ...where, date: { gte: monthStart } }, select: { totalMinutes: true } }),
    ]);

    const sum = (entries: any[]) => entries.reduce((s, e) => s + (e.totalMinutes ?? 0), 0) / 60;
    const STANDARD_DAY_HOURS = 8;

    const monthHours = sum(monthEntries);
    const workDays = monthEntries.length;
    const expectedHours = workDays * STANDARD_DAY_HOURS;
    const overtimeHours = Math.max(0, monthHours - expectedHours);

    return {
      today: Math.round(sum(todayEntries) * 10) / 10,
      week: Math.round(sum(weekEntries) * 10) / 10,
      month: Math.round(monthHours * 10) / 10,
      overtime: Math.round(overtimeHours * 10) / 10,
      workDays,
    };
  }

  async getMonthlyReport(companyId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const entries = await this.prisma.timeEntry.findMany({
      where: { companyId, date: { gte: start, lte: end }, clockOut: { not: null } },
      include: {
        employee: { select: { firstName: true, lastName: true, nif: true } },
        project: { select: { name: true } },
      },
      orderBy: [{ employeeId: "asc" }, { date: "asc" }],
    });

    const STANDARD_DAY = 480;
    const rows = entries.map((e) => ({
      employee: `${e.employee.firstName} ${e.employee.lastName}`,
      nif: e.employee.nif ?? "",
      date: e.date.toISOString().slice(0, 10),
      clockIn: e.clockIn.toISOString().slice(11, 16),
      clockOut: e.clockOut!.toISOString().slice(11, 16),
      breakMinutes: e.breakMinutes,
      totalMinutes: e.totalMinutes ?? 0,
      totalHours: Math.round(((e.totalMinutes ?? 0) / 60) * 100) / 100,
      overtimeMinutes: Math.max(0, (e.totalMinutes ?? 0) - STANDARD_DAY),
      project: (e as any).project?.name ?? "",
    }));

    return { year, month, totalEntries: rows.length, rows };
  }

  async remove(companyId: string, id: string) {
    const entry = await this.prisma.timeEntry.findFirst({ where: { id, companyId } });
    if (!entry) throw new NotFoundException("Entrada no encontrada");
    return this.prisma.timeEntry.delete({ where: { id } });
  }
}
