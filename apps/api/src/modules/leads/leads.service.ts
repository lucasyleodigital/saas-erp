import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, params: any) {
    const { page = 1, limit = 20, search } = params;
    const where: any = {
      companyId,
      isConverted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
  }

  async create(companyId: string, data: any) {
    return this.prisma.lead.create({ data: { ...data, companyId } });
  }

  async update(companyId: string, id: string, data: any) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new NotFoundException("Lead no encontrado");
    return this.prisma.lead.update({ where: { id }, data });
  }

  async convert(companyId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new NotFoundException("Lead no encontrado");

    const client = await this.prisma.client.create({
      data: {
        companyId,
        name: lead.name,
        ...(lead.email && { email: lead.email }),
        ...(lead.phone && { phone: lead.phone }),
        ...(lead.notes && { notes: lead.notes }),
      },
    });

    await this.prisma.lead.update({
      where: { id },
      data: { isConverted: true, clientId: client.id },
    });

    return client;
  }

  async remove(companyId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new NotFoundException("Lead no encontrado");
    return this.prisma.lead.delete({ where: { id } });
  }
}
