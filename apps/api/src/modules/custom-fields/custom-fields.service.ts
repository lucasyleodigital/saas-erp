import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class CustomFieldsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, entity?: string) {
    const where: any = { companyId };
    if (entity) where.entity = entity;

    return this.prisma.customField.findMany({
      where,
      orderBy: [{ entity: "asc" }, { order: "asc" }],
    });
  }

  async create(companyId: string, data: any) {
    return this.prisma.customField.create({
      data: {
        ...data,
        companyId,
        order: data.order ? Number(data.order) : 0,
      },
    });
  }

  async update(companyId: string, id: string, data: any) {
    const field = await this.prisma.customField.findFirst({
      where: { id, companyId },
    });
    if (!field) throw new NotFoundException("Campo personalizado no encontrado");

    return this.prisma.customField.update({
      where: { id },
      data: {
        ...data,
        order: data.order !== undefined ? Number(data.order) : undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    const field = await this.prisma.customField.findFirst({
      where: { id, companyId },
    });
    if (!field) throw new NotFoundException("Campo personalizado no encontrado");

    return this.prisma.customField.delete({ where: { id } });
  }
}
