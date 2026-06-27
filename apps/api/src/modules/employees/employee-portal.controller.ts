import { Controller, Get, Post, Param, Body, NotFoundException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../database/prisma.service";
import { TimeEntriesService } from "./time-entries.service";

@ApiTags("Employee Portal")
@Controller("employee-portal")
export class EmployeePortalController {
  constructor(
    private prisma: PrismaService,
    private timeEntries: TimeEntriesService,
  ) {}

  @Get(":token")
  async getPortalData(@Param("token") token: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { clockToken: token },
      select: {
        id: true,
        companyId: true,
        firstName: true,
        lastName: true,
        position: true,
        department: true,
        avatar: true,
        status: true,
        company: { select: { name: true, logo: true } },
      },
    });
    if (!employee || employee.status !== "ACTIVE") {
      throw new NotFoundException("Enlace no valido o empleado inactivo");
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeEntry, todayEntries, monthEntries] = await Promise.all([
      this.prisma.timeEntry.findFirst({
        where: { employeeId: employee.id, clockOut: null },
        select: { id: true, clockIn: true },
      }),
      this.prisma.timeEntry.findMany({
        where: { employeeId: employee.id, date: { gte: todayStart }, clockOut: { not: null } },
        select: { totalMinutes: true },
      }),
      this.prisma.timeEntry.findMany({
        where: { employeeId: employee.id, date: { gte: monthStart }, clockOut: { not: null } },
        select: { totalMinutes: true, date: true, clockIn: true, clockOut: true },
      }),
    ]);

    const todayHours = todayEntries.reduce((s, e) => s + (e.totalMinutes ?? 0), 0) / 60;
    const monthHours = monthEntries.reduce((s, e) => s + (e.totalMinutes ?? 0), 0) / 60;

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        department: employee.department,
        avatar: employee.avatar,
      },
      company: employee.company,
      isClockedIn: !!activeEntry,
      activeEntry,
      todayHours: Math.round(todayHours * 10) / 10,
      monthHours: Math.round(monthHours * 10) / 10,
      recentEntries: monthEntries.slice(-10).reverse().map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        clockIn: e.clockIn.toISOString().slice(11, 16),
        clockOut: e.clockOut!.toISOString().slice(11, 16),
        hours: Math.round(((e.totalMinutes ?? 0) / 60) * 10) / 10,
      })),
    };
  }

  @Post(":token/clock-in")
  async clockIn(@Param("token") token: string, @Body() body: { latitude?: number; longitude?: number }) {
    const employee = await this.findEmployee(token);
    return this.timeEntries.clockIn(employee.companyId, employee.id, {
      latitude: body.latitude,
      longitude: body.longitude,
      method: "PORTAL",
    });
  }

  @Post(":token/clock-out")
  async clockOut(@Param("token") token: string, @Body() body: { breakMinutes?: number; latitude?: number; longitude?: number }) {
    const employee = await this.findEmployee(token);
    return this.timeEntries.clockOut(employee.companyId, employee.id, {
      breakMinutes: body.breakMinutes,
      latitude: body.latitude,
      longitude: body.longitude,
    });
  }

  private async findEmployee(token: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { clockToken: token },
      select: { id: true, companyId: true, status: true },
    });
    if (!employee || employee.status !== "ACTIVE") {
      throw new NotFoundException("Enlace no valido");
    }
    return employee;
  }
}
