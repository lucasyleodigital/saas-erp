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

  // ─── Values ──────────────────────────────────────────────────────────────

  /** Devuelve los valores de campos personalizados para una entidad concreta */
  async getValues(companyId: string, entity: string, entityId: string) {
    const fields = await this.prisma.customField.findMany({
      where: { companyId, entity, isActive: true },
      include: {
        values: { where: { entityId } },
      },
      orderBy: [{ order: "asc" }],
    });
    return fields.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      options: f.options,
      required: f.required,
      value: f.values[0]?.value ?? null,
    }));
  }

  /** Guarda (upsert) los valores de campos personalizados para una entidad */
  async saveValues(companyId: string, entity: string, entityId: string, values: Record<string, string>) {
    const fields = await this.prisma.customField.findMany({
      where: { companyId, entity, isActive: true },
    });

    await Promise.all(
      fields.map((f) => {
        const value = values[f.id];
        if (value === undefined) return;
        return this.prisma.customFieldValue.upsert({
          where: { customFieldId_entityId: { customFieldId: f.id, entityId } },
          create: { customFieldId: f.id, entityId, value: String(value) },
          update: { value: String(value) },
        });
      })
    );
  }
}
