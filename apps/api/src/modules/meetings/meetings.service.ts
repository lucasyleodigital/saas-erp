import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class MeetingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, params: any) {
    const { search, status, dateFrom, dateTo } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;

    const where: any = {
      companyId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
          { diagnosis: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo + "T23:59:59");
    }

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "desc" },
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, companyId } });
    if (!meeting) throw new NotFoundException("Reunión no encontrada");
    return meeting;
  }

  async create(companyId: string, userId: string, data: any) {
    return this.prisma.meeting.create({
      data: {
        ...data,
        companyId,
        createdById: userId,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        participants: data.participants ?? [],
        sharedWith: data.sharedWith ?? [],
      },
    });
  }

  async update(companyId: string, id: string, data: any) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, companyId } });
    if (!meeting) throw new NotFoundException("Reunión no encontrada");

    return this.prisma.meeting.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, companyId } });
    if (!meeting) throw new NotFoundException("Reunión no encontrada");
    await this.prisma.meeting.delete({ where: { id } });
    return { ok: true };
  }
}
