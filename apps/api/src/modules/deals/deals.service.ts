import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

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

  async create(companyId: string, data: any) {
    return this.prisma.deal.create({ data: { ...data, companyId } });
  }

  async moveStage(companyId: string, id: string, stageId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id, companyId } });
    if (!deal) throw new NotFoundException("Deal no encontrado");
    return this.prisma.deal.update({ where: { id }, data: { stageId } });
  }

  async update(companyId: string, id: string, data: any) {
    const deal = await this.prisma.deal.findFirst({ where: { id, companyId } });
    if (!deal) throw new NotFoundException("Deal no encontrado");
    return this.prisma.deal.update({ where: { id }, data });
  }
}
