import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PlansService } from "../plans/plans.service";

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private plans: PlansService,
  ) {}

  async findAll(companyId: string, params: any) {
    const { page = 1, limit = 50, search } = params;
    const where: any = {
      companyId,
      isActive: true,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { tax: true, category: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
      include: { tax: true, category: true },
    });
    if (!product) throw new NotFoundException("Producto no encontrado");
    return product;
  }

  async create(companyId: string, data: any) {
    const count = await this.plans.countProducts(companyId);
    await this.plans.checkLimit(companyId, "maxProducts", count);
    return this.prisma.product.create({ data: { ...data, companyId } });
  }

  async update(companyId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
