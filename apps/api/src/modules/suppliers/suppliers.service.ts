import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, query: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { cifNif: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: {
          _count: { select: { purchaseOrders: true } },
        },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
      include: {
        purchaseOrders: {
          orderBy: { issueDate: "desc" },
          take: 10,
          select: { id: true, number: true, status: true, issueDate: true, total: true },
        },
        _count: { select: { purchaseOrders: true } },
      },
    });
    if (!supplier) throw new NotFoundException("Proveedor no encontrado");
    return supplier;
  }

  async create(companyId: string, dto: any) {
    return this.prisma.supplier.create({
      data: { ...dto, companyId },
    });
  }

  async update(companyId: string, id: string, dto: any) {
    await this.findOne(companyId, id);
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.supplier.delete({ where: { id } });
  }

  async stats(companyId: string) {
    const [total, active] = await Promise.all([
      this.prisma.supplier.count({ where: { companyId } }),
      this.prisma.supplier.count({ where: { companyId, isActive: true } }),
    ]);
    return { total, active, inactive: total - active };
  }
}
