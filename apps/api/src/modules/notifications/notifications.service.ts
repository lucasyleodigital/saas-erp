import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, userId?: string, params: any = {}) {
    const { page = 1, limit = 30, unreadOnly } = params;
    const where: any = {
      companyId,
      ...(userId && { OR: [{ userId }, { userId: null }] }),
      ...(unreadOnly === "true" && { isRead: false }),
    };

    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return { data, total, unread, page: Number(page), totalPages: Math.ceil(total / limit) };
  }

  async countUnread(companyId: string, userId?: string) {
    return this.prisma.notification.count({
      where: {
        companyId,
        isRead: false,
        ...(userId && { OR: [{ userId }, { userId: null }] }),
      },
    });
  }

  async markRead(companyId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, companyId },
      data: { isRead: true },
    });
  }

  async markAllRead(companyId: string, userId?: string) {
    return this.prisma.notification.updateMany({
      where: {
        companyId,
        isRead: false,
        ...(userId && { OR: [{ userId }, { userId: null }] }),
      },
      data: { isRead: true },
    });
  }

  async create(companyId: string, data: { title: string; body: string; userId?: string; data?: any }) {
    return this.prisma.notification.create({
      data: { companyId, ...data },
    });
  }

  async deleteRead(companyId: string) {
    return this.prisma.notification.deleteMany({
      where: { companyId, isRead: true },
    });
  }
}
