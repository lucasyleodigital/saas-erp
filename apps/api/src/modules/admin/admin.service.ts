import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  assertSuperAdmin(role: string) {
    if (role !== "SUPER_ADMIN") throw new ForbiddenException("Acceso restringido a administradores de plataforma");
  }

  async getDashboard() {
    const [totalCompanies, totalUsers, totalInvoices, planCounts] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count(),
      this.prisma.invoice.count(),
      this.prisma.company.groupBy({ by: ["plan"], _count: true }),
    ]);

    const recentCompanies = await this.prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, plan: true, email: true, createdAt: true, isActive: true },
    });

    const plans: Record<string, number> = {};
    for (const p of planCounts) plans[p.plan] = p._count;

    return {
      totalCompanies,
      totalUsers,
      totalInvoices,
      plans,
      recentCompanies,
    };
  }

  async listCompanies(params: { page?: number; search?: string }) {
    const page = Number(params.page) || 1;
    const limit = 20;
    const where: any = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { cif: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          users: { select: { user: { select: { email: true, firstName: true, lastName: true } }, role: true } },
          _count: { select: { invoices: true, clients: true, products: true } },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getCompanyDetail(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true, lastLoginAt: true } } },
        },
        _count: { select: { invoices: true, clients: true, products: true, quotes: true, leads: true } },
        bankAccounts: { where: { isActive: true } },
      },
    });
    if (!company) throw new NotFoundException("Empresa no encontrada");

    const invoiceStats = await this.prisma.invoice.aggregate({
      where: { companyId },
      _sum: { total: true, paidAmount: true },
      _count: true,
    });

    return { ...company, invoiceStats };
  }

  async impersonate(companyId: string, superAdminUserId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException("Empresa no encontrada");

    const ownerMembership = await this.prisma.userCompany.findFirst({
      where: { companyId, role: "OWNER" },
      include: { user: true },
    });
    if (!ownerMembership) throw new NotFoundException("No hay propietario en esta empresa");

    const payload = {
      sub: ownerMembership.user.id,
      email: ownerMembership.user.email,
      companyId,
      role: "OWNER" as const,
      impersonatedBy: superAdminUserId,
    };

    const accessToken = this.jwt.sign(payload, { expiresIn: "2h" });

    return {
      accessToken,
      companyName: company.name,
      ownerEmail: ownerMembership.user.email,
      expiresIn: "2h",
    };
  }

  async updateCompanyPlan(companyId: string, plan: string) {
    const valid = ["FREE", "STARTER", "PRO", "ENTERPRISE"];
    if (!valid.includes(plan)) throw new ForbiddenException("Plan no valido");
    return this.prisma.company.update({
      where: { id: companyId },
      data: { plan: plan as any },
    });
  }

  async toggleCompanyActive(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException("Empresa no encontrada");
    return this.prisma.company.update({
      where: { id: companyId },
      data: { isActive: !company.isActive },
    });
  }

  async deleteCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException("Empresa no encontrada");

    // Delete user memberships and then orphan users
    const memberships = await this.prisma.userCompany.findMany({ where: { companyId } });
    const userIds = memberships.map((m) => m.userId);

    await this.prisma.company.delete({ where: { id: companyId } });

    // Delete users that have no other company memberships
    for (const userId of userIds) {
      const remaining = await this.prisma.userCompany.count({ where: { userId } });
      if (remaining === 0) {
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
        await this.prisma.user.delete({ where: { id: userId } });
      }
    }

    return { deleted: true, companyName: company.name };
  }
}
