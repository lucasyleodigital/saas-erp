import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { EmailService } from "../email/email.service";

function esc(s: string | null | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

@Injectable()
export class TimeEntriesService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

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

  async clockIn(companyId: string, employeeId: string, opts?: { projectId?: string; latitude?: number; longitude?: number; method?: string }) {
    const now = new Date();
    const open = await this.prisma.timeEntry.findFirst({
      where: { companyId, employeeId, clockOut: null },
    });
    if (open) throw new NotFoundException("Ya tienes un fichaje abierto. Ficha salida primero.");

    return this.prisma.timeEntry.create({
      data: {
        companyId,
        employeeId,
        projectId: opts?.projectId || null,
        date: now,
        clockIn: now,
        latitude: opts?.latitude,
        longitude: opts?.longitude,
        method: opts?.method ?? "WEB",
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
  }

  async clockOut(companyId: string, employeeId: string, opts?: { breakMinutes?: number; latitude?: number; longitude?: number }) {
    const open = await this.prisma.timeEntry.findFirst({
      where: { companyId, employeeId, clockOut: null },
      orderBy: { clockIn: "desc" },
    });
    if (!open) throw new NotFoundException("No hay fichaje abierto");

    const now = new Date();
    const breakMinutes = opts?.breakMinutes ?? 0;
    const totalMinutes = Math.max(0, Math.round((now.getTime() - open.clockIn.getTime()) / 60000) - breakMinutes);
    const STANDARD_DAY = 480;
    const overtimeMinutes = Math.max(0, totalMinutes - STANDARD_DAY);

    const entry = await this.prisma.timeEntry.update({
      where: { id: open.id },
      data: {
        clockOut: now,
        breakMinutes,
        totalMinutes,
        locationOut: opts?.latitude ? { latitude: opts.latitude, longitude: opts.longitude } : undefined,
        notes: overtimeMinutes > 0 ? `Horas extra: ${(overtimeMinutes / 60).toFixed(1)}h` : open.notes,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // Send confirmation email to employee (fire-and-forget)
    const emp = entry.employee as any;
    if (emp?.email) {
      const totalH = (totalMinutes / 60).toFixed(2).replace(".", ",");
      const overtimeStr = overtimeMinutes > 0 ? `<p style="color:#d97706;margin:0 0 8px;">Horas extra hoy: <strong>${(overtimeMinutes/60).toFixed(1)}h</strong></p>` : "";
      this.email.sendGeneric(
        emp.email,
        `Fichaje registrado — ${now.toLocaleDateString("es-ES")}`,
        `<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#111827;">
          <h2 style="font-size:18px;font-weight:700;margin:0 0 16px;">Hola ${esc(emp.firstName)}, tu jornada ha quedado registrada</h2>
          <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
            <p style="margin:0 0 8px;font-size:14px;"><strong>Entrada:</strong> ${open.clockIn.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</p>
            <p style="margin:0 0 8px;font-size:14px;"><strong>Salida:</strong> ${now.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</p>
            ${breakMinutes > 0 ? `<p style="margin:0 0 8px;font-size:14px;"><strong>Descanso:</strong> ${breakMinutes} minutos</p>` : ""}
            <p style="margin:0;font-size:15px;font-weight:600;color:#0d9488;"><strong>Total:</strong> ${totalH} horas</p>
          </div>
          ${overtimeStr}
          <p style="font-size:12px;color:#9ca3af;margin:0;">YouWhole — Control horario</p>
        </div>`,
      ).catch((err: any) => { console.error("[clockOut email]", err?.message); });
    }

    return entry;
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

  async getWeeklyView(companyId: string, weekStart: string) {
    const start = weekStart ? new Date(weekStart) : (() => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay() + 1);
      d.setHours(0, 0, 0, 0);
      return d;
    })();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const employees = await this.prisma.employee.findMany({
      where: { companyId, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, schedule: true, workingHours: true },
      orderBy: { firstName: "asc" },
    });

    const entries = await this.prisma.timeEntry.findMany({
      where: { companyId, date: { gte: start, lte: end } },
      select: { employeeId: true, date: true, clockIn: true, clockOut: true, totalMinutes: true, breakMinutes: true },
      orderBy: { date: "asc" },
    });

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    const rows = employees.map((emp) => {
      const empEntries = entries.filter((e) => e.employeeId === emp.id);
      const dailyHours = days.map((day) => {
        const dayEntries = empEntries.filter((e) => e.date.toISOString().slice(0, 10) === day);
        const totalMin = dayEntries.reduce((s, e) => s + (e.totalMinutes ?? 0), 0);
        const hasOpen = dayEntries.some((e) => !e.clockOut);
        return {
          date: day,
          hours: Math.round((totalMin / 60) * 10) / 10,
          entries: dayEntries.length,
          hasOpen,
          clockIn: dayEntries[0]?.clockIn?.toISOString().slice(11, 16) ?? null,
          clockOut: dayEntries[dayEntries.length - 1]?.clockOut?.toISOString().slice(11, 16) ?? null,
        };
      });
      const weekTotal = dailyHours.reduce((s, d) => s + d.hours, 0);
      const expectedHours = Number(emp.workingHours ?? 40);
      return {
        employee: { id: emp.id, name: `${emp.firstName} ${emp.lastName}`, schedule: emp.schedule },
        days: dailyHours,
        weekTotal: Math.round(weekTotal * 10) / 10,
        expectedHours,
        overtime: Math.round(Math.max(0, weekTotal - expectedHours) * 10) / 10,
      };
    });

    return { weekStart: start.toISOString().slice(0, 10), days, rows };
  }

  async getMissedClocks(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];

    const employees = await this.prisma.employee.findMany({
      where: { companyId, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, schedule: true },
    });

    const todayEntries = await this.prisma.timeEntry.findMany({
      where: { companyId, date: { gte: today } },
      select: { employeeId: true },
    });

    const employeesWithEntries = new Set(todayEntries.map((e) => e.employeeId));

    return employees
      .filter((emp) => !employeesWithEntries.has(emp.id))
      .map((emp) => ({
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
      }));
  }

  async generateQrToken(companyId: string) {
    const payload = { companyId, ts: Date.now(), type: "clock-qr" };
    const token = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return { token, expiresIn: "24h" };
  }

  async clockByQr(data: { token: string; employeeId: string; action: "in" | "out"; latitude?: number; longitude?: number }) {
    let payload: any;
    try {
      payload = JSON.parse(Buffer.from(data.token, "base64url").toString("utf8"));
    } catch {
      throw new NotFoundException("Token QR invalido");
    }
    if (payload.type !== "clock-qr" || !payload.companyId) {
      throw new NotFoundException("Token QR invalido");
    }
    const age = Date.now() - (payload.ts ?? 0);
    if (age > 24 * 60 * 60 * 1000) {
      throw new NotFoundException("Token QR expirado. Genera uno nuevo.");
    }

    if (data.action === "in") {
      return this.clockIn(payload.companyId, data.employeeId, {
        latitude: data.latitude,
        longitude: data.longitude,
        method: "QR",
      });
    } else {
      return this.clockOut(payload.companyId, data.employeeId, {
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }
  }

  async remove(companyId: string, id: string) {
    const entry = await this.prisma.timeEntry.findFirst({ where: { id, companyId } });
    if (!entry) throw new NotFoundException("Entrada no encontrada");
    return this.prisma.timeEntry.delete({ where: { id } });
  }
}
