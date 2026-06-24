import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateDealDto } from "./dto/create-deal.dto";

const DEFAULT_STAGES = [
  { name: "Lead",         order: 0, color: "#3b82f6" },
  { name: "Cualificado",  order: 1, color: "#6366f1" },
  { name: "Propuesta",    order: 2, color: "#8b5cf6" },
  { name: "Negociación",  order: 3, color: "#a855f7" },
  { name: "Ganado",       order: 4, color: "#10b981" },
  { name: "Perdido",      order: 5, color: "#6b7280" },
];

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async getPipelineView(companyId: string) {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { companyId },
      include: {
        stages: {
          include: {
            deals: {
              where: { companyId },
              include: {
                client: { select: { id: true, name: true } },
              },
              orderBy: { updatedAt: "desc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });
    return pipelines;
  }

  async createPipeline(companyId: string, name: string) {
    return this.prisma.pipeline.create({
      data: {
        companyId,
        name,
        isDefault: true,
        stages: {
          create: DEFAULT_STAGES,
        },
      },
      include: {
        stages: { orderBy: { order: "asc" } },
      },
    });
  }

  async createDefaultPipeline(companyId: string) {
    const existing = await this.prisma.pipeline.findFirst({ where: { companyId } });
    if (existing) return existing;
    return this.createPipeline(companyId, "Pipeline de ventas");
  }

  async create(companyId: string, data: CreateDealDto) {
    return this.prisma.deal.create({ data: { ...data, companyId } });
  }

  async moveStage(companyId: string, id: string, stageId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id, companyId } });
    if (!deal) throw new NotFoundException("Deal no encontrado");
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, pipeline: { companyId } },
    });
    if (!stage) throw new NotFoundException("Etapa no encontrada");
    return this.prisma.deal.update({ where: { id }, data: { stageId } });
  }

  async update(companyId: string, id: string, data: Partial<CreateDealDto>) {
    const deal = await this.prisma.deal.findFirst({ where: { id, companyId } });
    if (!deal) throw new NotFoundException("Lead no encontrado");
    return this.prisma.deal.update({ where: { id }, data });
  }

  async remove(companyId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id, companyId } });
    if (!deal) throw new NotFoundException("Lead no encontrado");
    await this.prisma.deal.delete({ where: { id } });
    return { deleted: true };
  }
}
