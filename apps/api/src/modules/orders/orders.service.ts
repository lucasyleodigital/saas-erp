import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AutomationsService } from "../automations/automations.service";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private automations: AutomationsService,
  ) {}

  private async nextOrderNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count({
      where: { companyId, number: { startsWith: `PED-${year}-` } },
    });
    const seq = String(count + 1).padStart(4, "0");
    return `PED-${year}-${seq}`;
  }

  async findAll(
    companyId: string,
    query: { search?: string; status?: string; clientId?: string; page?: number; limit?: number },
  ) {
    const { search, status, clientId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          client: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, companyId },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    return order;
  }

  async create(companyId: string, dto: any) {
    const { items = [], ...orderData } = dto;

    // Verify client belongs to company
    const client = await this.prisma.client.findFirst({
      where: { id: orderData.clientId, companyId },
    });
    if (!client) throw new NotFoundException("Cliente no encontrado");

    const number = await this.nextOrderNumber(companyId);
    const { subtotal, taxAmount, total } = this.calcTotals(items);

    const order = await this.prisma.order.create({
      data: {
        ...orderData,
        companyId,
        number,
        subtotal,
        taxAmount,
        total,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId ?? null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount ?? 0,
            taxRate: item.taxRate ?? 0,
            subtotal: this.itemSubtotal(item),
          })),
        },
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    this.automations.trigger(companyId, "ORDER_CREATED", {
      orderNumber: order.number,
      clientName:  (order as any).client?.name  ?? "",
      clientEmail: (order as any).client?.email ?? "",
      total:       String(order.total),
      currency:    order.currency,
    }).catch(() => {});

    return order;
  }

  async update(companyId: string, id: string, dto: any) {
    await this.findOne(companyId, id);
    const { items, ...orderData } = dto;

    if (items) {
      const { subtotal, taxAmount, total } = this.calcTotals(items);
      await this.prisma.$transaction([
        this.prisma.orderItem.deleteMany({ where: { orderId: id } }),
        this.prisma.order.update({
          where: { id },
          data: {
            ...orderData,
            subtotal,
            taxAmount,
            total,
            items: {
              create: items.map((item: any) => ({
                productId: item.productId ?? null,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount ?? 0,
                taxRate: item.taxRate ?? 0,
                subtotal: this.itemSubtotal(item),
              })),
            },
          },
        }),
      ]);
      return this.findOne(companyId, id);
    }

    return this.prisma.order.update({ where: { id }, data: orderData });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.order.delete({ where: { id } });
  }

  async convertToDeliveryNote(companyId: string, id: string) {
    const order = await this.findOne(companyId, id);
    if (order.convertedToDeliveryNoteId) {
      throw new BadRequestException("Este pedido ya ha sido convertido en albarán");
    }

    // Get next delivery note number
    const year = new Date().getFullYear();
    const dnCount = await this.prisma.deliveryNote.count({
      where: { companyId, number: { startsWith: `ALB-${year}-` } },
    });
    const dnNumber = `ALB-${year}-${String(dnCount + 1).padStart(4, "0")}`;

    const dn = await this.prisma.$transaction(async (tx) => {
      const deliveryNote = await tx.deliveryNote.create({
        data: {
          companyId,
          clientId: order.clientId,
          number: dnNumber,
          issueDate: new Date(),
          notes: order.notes ?? undefined,
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          total: order.total,
          items: {
            create: order.items.map((item: any) => ({
              productId: item.productId ?? null,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
              subtotal: item.subtotal,
            })),
          },
        },
        select: { id: true, number: true },
      });

      await tx.order.update({
        where: { id },
        data: { status: "CONFIRMED", convertedToDeliveryNoteId: deliveryNote.id },
      });

      return deliveryNote;
    });

    return dn;
  }

  async stats(companyId: string) {
    const [total, pending, confirmed, shipped] = await Promise.all([
      this.prisma.order.count({ where: { companyId } }),
      this.prisma.order.count({ where: { companyId, status: "PENDING" } }),
      this.prisma.order.count({ where: { companyId, status: "CONFIRMED" } }),
      this.prisma.order.count({ where: { companyId, status: "SHIPPED" } }),
    ]);
    return { total, pending, confirmed, shipped };
  }

  private itemSubtotal(item: any): number {
    const base = Number(item.quantity) * Number(item.unitPrice);
    const afterDiscount = base * (1 - (Number(item.discount ?? 0) / 100));
    return afterDiscount;
  }

  private calcTotals(items: any[]) {
    let subtotal = 0;
    let taxAmount = 0;
    for (const item of items) {
      const base = this.itemSubtotal(item);
      subtotal += base;
      taxAmount += base * (Number(item.taxRate ?? 0) / 100);
    }
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  }
}
