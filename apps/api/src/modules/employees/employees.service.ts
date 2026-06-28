import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  // ─── Employees ─────────────────────────────────────────────

  async findAll(companyId: string, params: any) {
    const { search, status, department } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const where: any = {
      companyId,
      ...(status && { status }),
      ...(department && { department }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName:  { contains: search, mode: "insensitive" } },
          { email:     { contains: search, mode: "insensitive" } },
          { position:  { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: [{ status: "asc" }, { lastName: "asc" }],
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        timeEntries: { orderBy: { date: "desc" }, take: 10 },
        leaveRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!employee) throw new NotFoundException("Empleado no encontrado");
    return employee;
  }

  async create(companyId: string, dto: any) {
    if (!dto.firstName || !dto.lastName) throw new BadRequestException("Nombre y apellidos obligatorios");
    if (!dto.startDate) throw new BadRequestException("Fecha de alta obligatoria");
    if (dto.salary === undefined || dto.salary === null) throw new BadRequestException("Salario obligatorio");

    return this.prisma.employee.create({
      data: {
        companyId,
        firstName: dto.firstName.trim(),
        lastName:  dto.lastName.trim(),
        email:     dto.email?.trim() || undefined,
        phone:     dto.phone?.trim() || undefined,
        nif:       dto.nif?.trim() || undefined,
        socialSecurityNumber: dto.socialSecurityNumber?.trim() || undefined,
        position:  dto.position?.trim() || undefined,
        department: dto.department?.trim() || undefined,
        contractType: dto.contractType ?? "INDEFINIDO",
        startDate: new Date(dto.startDate),
        endDate:   dto.endDate ? new Date(dto.endDate) : undefined,
        salary:    Number(dto.salary),
        bankAccount: dto.bankAccount?.trim() || undefined,
        bankHolder:  dto.bankHolder?.trim() || undefined,
        address:   dto.address?.trim() || undefined,
        city:      dto.city?.trim() || undefined,
        province:  dto.province?.trim() || undefined,
        postalCode: dto.postalCode?.trim() || undefined,
        workingHours: dto.workingHours ? Number(dto.workingHours) : 40,
        notes:     dto.notes?.trim() || undefined,
      },
    });
  }

  async update(companyId: string, id: string, dto: any) {
    await this.findOne(companyId, id);
    const { ...data } = dto;
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate)   data.endDate   = new Date(data.endDate);
    if (data.salary !== undefined) data.salary = Number(data.salary);
    if (data.workingHours !== undefined) data.workingHours = Number(data.workingHours);
    return this.prisma.employee.update({ where: { id }, data });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.employee.delete({ where: { id } });
  }

  // ─── Time Entries ───────────────────────────────────────────

  async getTimeEntries(companyId: string, employeeId: string, params: any) {
    const { month, year } = params;
    const where: any = { companyId, employeeId };

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end   = new Date(Number(year), Number(month), 0, 23, 59, 59);
      where.date  = { gte: start, lte: end };
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      orderBy: { date: "desc" },
      take: 100,
    });

    const totalMinutes = entries.reduce((s, e) => s + (e.totalMinutes ?? 0), 0);
    const totalHours   = Math.floor(totalMinutes / 60);
    const remainingMin = totalMinutes % 60;

    return { entries, totalMinutes, summary: `${totalHours}h ${remainingMin}m` };
  }

  async clockIn(companyId: string, employeeId: string, dto: any) {
    await this.findOne(companyId, employeeId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.timeEntry.findFirst({
      where: { companyId, employeeId, date: today, clockOut: null },
    });
    if (existing) throw new BadRequestException("El empleado ya tiene un fichaje abierto hoy");

    return this.prisma.timeEntry.create({
      data: {
        companyId,
        employeeId,
        date:  today,
        clockIn: dto.clockIn ? new Date(dto.clockIn) : new Date(),
        notes: dto.notes?.trim() || undefined,
      },
    });
  }

  async clockOut(companyId: string, entryId: string, dto: any) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id: entryId, companyId },
    });
    if (!entry) throw new NotFoundException("Fichaje no encontrado");
    if (entry.clockOut) throw new BadRequestException("Este fichaje ya está cerrado");

    const clockOut = dto.clockOut ? new Date(dto.clockOut) : new Date();
    const breakMinutes = dto.breakMinutes ? Number(dto.breakMinutes) : entry.breakMinutes;
    const diff = Math.floor((clockOut.getTime() - entry.clockIn.getTime()) / 60000) - breakMinutes;
    const totalMinutes = Math.max(0, diff);

    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: { clockOut, breakMinutes, totalMinutes },
    });
  }

  // ─── Leave Requests ─────────────────────────────────────────

  async getLeaveRequests(companyId: string, params: any) {
    const { employeeId, status, year } = params;
    const where: any = { companyId };
    if (employeeId) where.employeeId = employeeId;
    if (status)     where.status = status;
    if (year) {
      where.startDate = {
        gte: new Date(Number(year), 0, 1),
        lte: new Date(Number(year), 11, 31),
      };
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, position: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createLeaveRequest(companyId: string, employeeId: string, dto: any) {
    await this.findOne(companyId, employeeId);

    const start = new Date(dto.startDate);
    const end   = new Date(dto.endDate);
    if (end < start) throw new BadRequestException("La fecha de fin debe ser posterior a la de inicio");

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return this.prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId,
        type:      dto.type ?? "VACATION",
        startDate: start,
        endDate:   end,
        days,
        reason:    dto.reason?.trim() || undefined,
      },
    });
  }

  async updateLeaveStatus(companyId: string, requestId: string, status: "APPROVED" | "REJECTED", approvedBy?: string) {
    const req = await this.prisma.leaveRequest.findFirst({ where: { id: requestId, companyId } });
    if (!req) throw new NotFoundException("Solicitud no encontrada");

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status,
        approvedBy: approvedBy ?? undefined,
        approvedAt: new Date(),
        ...(status === "APPROVED" && {
          employee: {
            update: {
              where: { id: req.employeeId },
              data:  { status: req.type === "SICK" || req.type === "OTHER" ? "ACTIVE" : "ACTIVE" },
            },
          },
        }),
      },
    });
  }

  async deleteLeaveRequest(companyId: string, requestId: string) {
    const req = await this.prisma.leaveRequest.findFirst({ where: { id: requestId, companyId } });
    if (!req) throw new NotFoundException("Solicitud no encontrada");
    if (req.status === "APPROVED") throw new BadRequestException("No se puede eliminar una solicitud aprobada");
    return this.prisma.leaveRequest.delete({ where: { id: requestId } });
  }

  // ─── Stats ──────────────────────────────────────────────────

  async getStats(companyId: string) {
    const [total, active, onLeave, inactive] = await Promise.all([
      this.prisma.employee.count({ where: { companyId } }),
      this.prisma.employee.count({ where: { companyId, status: "ACTIVE" } }),
      this.prisma.employee.count({ where: { companyId, status: "ON_LEAVE" } }),
      this.prisma.employee.count({ where: { companyId, status: "INACTIVE" } }),
    ]);

    const pendingLeaves = await this.prisma.leaveRequest.count({
      where: { companyId, status: "PENDING" },
    });

    const currentYear = new Date().getFullYear();
    const salarySum = await this.prisma.employee.aggregate({
      where: { companyId, status: { in: ["ACTIVE", "ON_LEAVE"] } },
      _sum: { salary: true },
    });

    return {
      total, active, onLeave, inactive,
      pendingLeaves,
      annualSalaryCost: Number(salarySum._sum.salary ?? 0),
      monthlySalaryCost: Number(salarySum._sum.salary ?? 0) / 12,
    };
  }

  async generateClockToken(companyId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId } });
    if (!employee) throw new NotFoundException("Empleado no encontrado");

    const token = employee.clockToken ?? crypto.randomUUID();
    if (!employee.clockToken) {
      await this.prisma.employee.update({ where: { id: employeeId }, data: { clockToken: token } });
    }

    return { token, employeeName: `${employee.firstName} ${employee.lastName}` };
  }

  async activatePortalAccess(companyId: string, employeeId: string, password: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId } });
    if (!employee) throw new NotFoundException("Empleado no encontrado");
    if (!employee.email) throw new BadRequestException("El empleado necesita un email para activar el portal");

    const existingUser = await this.prisma.user.findUnique({ where: { email: employee.email } });
    if (existingUser) {
      const membership = await this.prisma.userCompany.findFirst({
        where: { userId: existingUser.id, companyId },
      });
      if (membership) {
        if (!membership.isDefault) {
          await this.prisma.userCompany.update({ where: { id: membership.id }, data: { isDefault: true } });
        }
        throw new ConflictException("Este empleado ya tiene acceso al portal");
      }

      await this.prisma.userCompany.create({
        data: { userId: existingUser.id, companyId, role: "EMPLOYEE", isDefault: true },
      });
      return { activated: true, email: employee.email, existing: true };
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: employee.email,
        password: hashed,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
    });

    await this.prisma.userCompany.create({
      data: { userId: user.id, companyId, role: "EMPLOYEE", isDefault: true },
    });

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { portalPassword: password, portalActivatedAt: new Date() },
    });

    return { activated: true, email: employee.email, password };
  }

  async getPortalCredentials(companyId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      select: { email: true, portalPassword: true, portalActivatedAt: true },
    });
    if (!employee) throw new NotFoundException("Empleado no encontrado");

    let isActive = !!employee.portalActivatedAt;

    if (!isActive && employee.email) {
      const user = await this.prisma.user.findUnique({ where: { email: employee.email } });
      if (user) {
        const membership = await this.prisma.userCompany.findFirst({
          where: { userId: user.id, companyId, role: "EMPLOYEE" },
        });
        if (membership) {
          isActive = true;
          if (!membership.isDefault) {
            await this.prisma.userCompany.update({ where: { id: membership.id }, data: { isDefault: true } });
          }
          await this.prisma.employee.update({
            where: { id: employeeId },
            data: { portalActivatedAt: membership.createdAt },
          });
        }
      }
    }

    return {
      email: employee.email,
      password: employee.portalPassword,
      activatedAt: employee.portalActivatedAt,
      isActive,
    };
  }

  async resetPortalPassword(companyId: string, employeeId: string, newPassword: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId } });
    if (!employee) throw new NotFoundException("Empleado no encontrado");
    if (!employee.email) throw new BadRequestException("El empleado no tiene email");

    const hashed = await bcrypt.hash(newPassword, 12);
    const user = await this.prisma.user.findUnique({ where: { email: employee.email } });
    if (user) {
      await this.prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    }
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { portalPassword: newPassword },
    });
    return { reset: true, email: employee.email };
  }
}
