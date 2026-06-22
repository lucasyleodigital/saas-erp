import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AutomationsService } from "../automations/automations.service";

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private automations: AutomationsService,
  ) {}

  async findAll(companyId: string, params: any) {
    const { search } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
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
    const lead = await this.prisma.lead.create({ data: { ...data, companyId } });
    this.automations.trigger(companyId, "LEAD_CREATED", {
      leadName:  lead.name,
      leadEmail: lead.email ?? "",
      source:    lead.source ?? "",
    }).catch(() => {});
    return lead;
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
