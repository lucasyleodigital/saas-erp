import { Controller, Get, Post, Body, Query, UseGuards, ForbiddenException } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { PrismaService } from "../../database/prisma.service";
import { TimeEntriesService } from "./time-entries.service";
import type { JwtPayload } from "@saas/types";

@ApiTags("Employee Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("my")
export class EmployeeDashboardController {
  constructor(
    private prisma: PrismaService,
    private timeEntries: TimeEntriesService,
  ) {}

  private async getEmployeeId(user: JwtPayload) {
    const employee = await this.prisma.employee.findFirst({
      where: { companyId: user.companyId, email: user.email },
    });
    if (!employee) throw new ForbiddenException("No tienes un perfil de empleado vinculado");
    return employee;
  }

  @Get("profile")
  async getProfile(@CurrentUser() u: JwtPayload) {
    const emp = await this.getEmployeeId(u);
    const employee = await this.prisma.employee.findUnique({
      where: { id: emp.id },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        position: true, department: true, contractType: true, startDate: true,
        salary: true, workingHours: true, schedule: true, status: true, avatar: true,
      },
    });
    const company = await this.prisma.company.findUnique({
      where: { id: u.companyId },
      select: { name: true, logo: true },
    });
    return { employee, company };
  }

  @Get("dashboard")
  async getDashboard(@CurrentUser() u: JwtPayload) {
    const emp = await this.getEmployeeId(u);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

    const [activeEntry, summary, pendingLeaves, upcomingLeaves] = await Promise.all([
      this.prisma.timeEntry.findFirst({
        where: { employeeId: emp.id, clockOut: null },
      }),
      this.timeEntries.getSummary(u.companyId, emp.id),
      this.prisma.leaveRequest.count({
        where: { employeeId: emp.id, status: "PENDING" },
      }),
      this.prisma.leaveRequest.findMany({
        where: { employeeId: emp.id, startDate: { gte: todayStart }, status: "APPROVED" },
        orderBy: { startDate: "asc" },
        take: 3,
      }),
    ]);

    const recentEntries = await this.prisma.timeEntry.findMany({
      where: { employeeId: emp.id, date: { gte: weekStart }, clockOut: { not: null } },
      orderBy: { date: "desc" },
      take: 7,
      select: { date: true, clockIn: true, clockOut: true, totalMinutes: true, breakMinutes: true },
    });

    return {
      employee: { id: emp.id, firstName: emp.firstName, lastName: emp.lastName, position: emp.position },
      isClockedIn: !!activeEntry,
      activeEntry: activeEntry ? { id: activeEntry.id, clockIn: activeEntry.clockIn } : null,
      summary,
      pendingLeaves,
      upcomingLeaves: upcomingLeaves.map((l) => ({
        type: l.type,
        startDate: l.startDate.toISOString().slice(0, 10),
        endDate: l.endDate.toISOString().slice(0, 10),
        days: l.days,
      })),
      recentEntries: recentEntries.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        clockIn: e.clockIn.toISOString().slice(11, 16),
        clockOut: e.clockOut!.toISOString().slice(11, 16),
        hours: Math.round(((e.totalMinutes ?? 0) / 60) * 10) / 10,
        breakMinutes: e.breakMinutes ?? 0,
      })),
    };
  }

  @Get("leaves")
  async getLeaves(@CurrentUser() u: JwtPayload) {
    const emp = await this.getEmployeeId(u);
    return this.prisma.leaveRequest.findMany({
      where: { employeeId: emp.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  @Post("leaves")
  async requestLeave(@CurrentUser() u: JwtPayload, @Body() body: { type: string; startDate: string; endDate: string; reason?: string }) {
    const emp = await this.getEmployeeId(u);
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;

    return this.prisma.leaveRequest.create({
      data: {
        companyId: u.companyId,
        employeeId: emp.id,
        type: body.type as any,
        startDate: start,
        endDate: end,
        days,
        reason: body.reason,
      },
    });
  }

  @Get("payslips")
  async getPayslips(@CurrentUser() u: JwtPayload) {
    const emp = await this.getEmployeeId(u);
    return this.prisma.payroll.findMany({
      where: { employeeId: emp.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
      select: {
        id: true, year: true, month: true, baseSalary: true,
        ssEmployee: true, irpfAmount: true, netSalary: true, status: true,
      },
    });
  }

  @Post("clock-in")
  async clockIn(@CurrentUser() u: JwtPayload, @Body() body: { latitude?: number; longitude?: number }) {
    const emp = await this.getEmployeeId(u);
    return this.timeEntries.clockIn(u.companyId, emp.id, {
      latitude: body.latitude,
      longitude: body.longitude,
      method: "PORTAL",
    });
  }

  @Post("clock-out")
  async clockOut(@CurrentUser() u: JwtPayload, @Body() body: { breakMinutes?: number; latitude?: number; longitude?: number }) {
    const emp = await this.getEmployeeId(u);
    return this.timeEntries.clockOut(u.companyId, emp.id, {
      breakMinutes: body.breakMinutes,
      latitude: body.latitude,
      longitude: body.longitude,
    });
  }
}
