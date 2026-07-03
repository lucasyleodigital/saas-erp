import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PlansService } from "../plans/plans.service";
import { AutomationsService } from "../automations/automations.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import type { PaginationParams } from "@saas/types";

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private plans: PlansService,
    private automations: AutomationsService,
    private notifications: NotificationsService,
    private audit: AuditService,
  ) {}

  async findAll(companyId: string, params: PaginationParams & { type?: string; isActive?: string }) {
    const { search, sortBy = "createdAt", sortOrder = "desc", type, isActive } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      // default: only active; if isActive=all show all; if isActive=false show inactive
      ...(isActive === "all" ? {} : isActive === "false" ? { isActive: false } : { isActive: true }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { cifNif: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { invoices: true } } },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId },
      include: {
        contacts: true,
        invoices: { orderBy: { createdAt: "desc" }, take: 5 },
        deals: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!client) throw new NotFoundException("Cliente no encontrado");
    return client;
  }

  async create(companyId: string, dto: CreateClientDto) {
    const count = await this.plans.countClients(companyId);
    await this.plans.checkLimit(companyId, "maxClients", count);
    const client = await this.prisma.client.create({ data: { ...dto, companyId } });
    this.automations.trigger(companyId, "CLIENT_CREATED", {
      clientId:    client.id,
      clientName:  client.name,
      clientEmail: client.email ?? "",
    }).catch(() => {});
    this.notifications.create(companyId, {
      title: "Nuevo cliente",
      body: `Cliente "${client.name}" creado`,
    }).catch(() => {});
    this.audit.log({
      companyId, action: "CREATE", entity: "Client", entityId: client.id,
      newData: { name: client.name, email: client.email },
    }).catch(() => {});
    return client;
  }

  async update(companyId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(companyId, id);
    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
