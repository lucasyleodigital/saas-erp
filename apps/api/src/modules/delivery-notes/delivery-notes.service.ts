import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class DeliveryNotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, params: any) {
    const { search, status } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const where: any = {
      companyId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: "insensitive" } },
          { client: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.deliveryNote.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: { client: { select: { id: true, name: true } } },
      }),
      this.prisma.deliveryNote.count({ where }),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(companyId: string, id: string) {
    const note = await this.prisma.deliveryNote.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        quote: { select: { id: true, number: true } },
        items: { orderBy: { order: "asc" } },
      },
    });
    if (!note) throw new NotFoundException("Albarán no encontrado");
    return note;
  }

  async create(companyId: string, dto: any) {
    const count = await this.prisma.deliveryNote.count({ where: { companyId } });
    const year = new Date().getFullYear();
    const number = `ALB-${year}-${String(count + 1).padStart(4, "0")}`;

    const subtotal = (dto.items ?? []).reduce(
      (s: number, i: any) =>
        s + Number(i.quantity) * Number(i.unitPrice) * (1 - Number(i.discount ?? 0) / 100),
      0,
    );
    const taxAmount = subtotal * 0.21;

    return this.prisma.deliveryNote.create({
      data: {
        companyId,
        clientId: dto.clientId,
        quoteId: dto.quoteId ?? undefined,
        number,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        notes: dto.notes,
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        items: {
          create: (dto.items ?? []).map((item: any, i: number) => ({
            productId: item.productId ?? undefined,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discount: Number(item.discount ?? 0),
            subtotal:
              Number(item.quantity) *
              Number(item.unitPrice) *
              (1 - Number(item.discount ?? 0) / 100),
            order: i,
          })),
        },
      },
      include: { items: true, client: { select: { id: true, name: true } } },
    });
  }

  async update(companyId: string, id: string, dto: any) {
    const note = await this.findOne(companyId, id);
    if (note.status === "INVOICED" || note.status === "CANCELLED") {
      throw new BadRequestException("No se puede modificar un albarán facturado o cancelado");
    }

    const subtotal = dto.items
      ? (dto.items ?? []).reduce(
          (s: number, i: any) =>
            s + Number(i.quantity) * Number(i.unitPrice) * (1 - Number(i.discount ?? 0) / 100),
          0,
        )
      : Number(note.subtotal);
    const taxAmount = dto.items ? subtotal * 0.21 : Number(note.taxAmount);

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        await tx.deliveryNoteItem.deleteMany({ where: { deliveryNoteId: id } });
      }
      return tx.deliveryNote.update({
        where: { id },
        data: {
          clientId: dto.clientId ?? undefined,
          deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
          notes: dto.notes ?? undefined,
          subtotal,
          taxAmount,
          total: subtotal + taxAmount,
          ...(dto.items && {
            items: {
              create: dto.items.map((item: any, i: number) => ({
                productId: item.productId ?? undefined,
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                discount: Number(item.discount ?? 0),
                subtotal:
                  Number(item.quantity) *
                  Number(item.unitPrice) *
                  (1 - Number(item.discount ?? 0) / 100),
                order: i,
              })),
            },
          }),
        },
        include: { items: true, client: { select: { id: true, name: true } } },
      });
    });
  }

  async updateStatus(companyId: string, id: string, status: string) {
    await this.findOne(companyId, id);
    return this.prisma.deliveryNote.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async convertToInvoice(companyId: string, id: string) {
    const note = await this.findOne(companyId, id);
    if (note.status === "INVOICED") {
      throw new BadRequestException("Este albarán ya ha sido facturado");
    }
    if (note.status === "CANCELLED") {
      throw new BadRequestException("No se puede facturar un albarán cancelado");
    }

    const series = await this.prisma.invoiceSeries.findFirst({
      where: { companyId, isDefault: true },
    });
    if (!series) throw new NotFoundException("Serie de facturas no encontrada");

    const number = `${series.prefix}${String(series.nextNumber).padStart(4, "0")}`;

    const [invoice] = await this.prisma.$transaction([
      this.prisma.invoice.create({
        data: {
          companyId,
          clientId: note.clientId,
          seriesId: series.id,
          number,
          subtotal: note.subtotal,
          taxAmount: note.taxAmount,
          total: note.total,
          notes: note.notes ?? undefined,
          items: {
            create: note.items.map((item: any, i: number) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal: item.subtotal,
              order: i,
            })),
          },
        },
      }),
      this.prisma.invoiceSeries.update({
        where: { id: series.id },
        data: { nextNumber: { increment: 1 } },
      }),
      this.prisma.deliveryNote.update({
        where: { id },
        data: { status: "INVOICED" },
      }),
    ]);

    await this.prisma.deliveryNote.update({
      where: { id },
      data: { convertedToInvoiceId: invoice.id },
    });

    return invoice;
  }

  async remove(companyId: string, id: string) {
    const note = await this.findOne(companyId, id);
    if (note.status === "INVOICED") {
      throw new BadRequestException("No se puede eliminar un albarán ya facturado");
    }
    return this.prisma.deliveryNote.delete({ where: { id } });
  }

  async createFromQuote(companyId: string, quoteId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, companyId },
      include: { items: true },
    });
    if (!quote) throw new NotFoundException("Presupuesto no encontrado");

    return this.create(companyId, {
      clientId: quote.clientId,
      quoteId: quote.id,
      notes: quote.notes,
      items: quote.items.map((i: any) => ({
        productId: i.productId,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
      })),
    });
  }
}
