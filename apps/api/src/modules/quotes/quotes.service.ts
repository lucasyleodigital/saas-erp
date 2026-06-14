import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PlansService } from "../plans/plans.service";
import { AutomationsService } from "../automations/automations.service";

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private plans: PlansService,
    private automations: AutomationsService,
  ) {}

  async findAll(companyId: string, params: any) {
    const { page = 1, limit = 20, search, status } = params;
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
      this.prisma.quote.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: { client: { select: { id: true, name: true } } },
      }),
      this.prisma.quote.count({ where }),
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
    const quote = await this.prisma.quote.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        items: { orderBy: { order: "asc" } },
      },
    });
    if (!quote) throw new NotFoundException("Presupuesto no encontrado");
    return quote;
  }

  async create(companyId: string, dto: any) {
    const monthCount = await this.plans.countQuotesThisMonth(companyId);
    await this.plans.checkLimit(companyId, "maxQuotesPerMonth", monthCount);

    const count = await this.prisma.quote.count({ where: { companyId } });
    const year = new Date().getFullYear();
    const number = `P-${year}-${String(count + 1).padStart(4, "0")}`;

    const subtotal = (dto.items ?? []).reduce(
      (s: number, i: any) =>
        s + Number(i.quantity) * Number(i.unitPrice) * (1 - (Number(i.discount ?? 0) / 100)),
      0
    );
    const taxAmount = subtotal * 0.21;

    const newQuote = await this.prisma.quote.create({
      data: {
        companyId,
        clientId: dto.clientId,
        number,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        currency: dto.currency ?? "EUR",
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        notes: dto.notes,
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
      include: { items: true, client: { select: { id: true, name: true, email: true } } },
    });

    this.automations.trigger(companyId, "QUOTE_CREATED", {
      quoteNumber: newQuote.number,
      clientName:  (newQuote as any).client?.name  ?? "",
      clientEmail: (newQuote as any).client?.email ?? "",
      total:       String(newQuote.total),
    }).catch(() => {});

    return newQuote;
  }

  async updateStatus(companyId: string, id: string, status: string) {
    await this.findOne(companyId, id);
    return this.prisma.quote.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async convertToInvoice(companyId: string, id: string) {
    const quote = await this.findOne(companyId, id);
    const series = await this.prisma.invoiceSeries.findFirst({
      where: { companyId, isDefault: true },
    });
    if (!series) throw new NotFoundException("Serie de facturas no encontrada");

    const number = `${series.prefix}${String(series.nextNumber).padStart(4, "0")}`;

    const [invoice] = await this.prisma.$transaction([
      this.prisma.invoice.create({
        data: {
          companyId,
          clientId: quote.clientId,
          seriesId: series.id,
          number,
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          total: quote.total,
          notes: quote.notes ?? undefined,
          items: {
            create: quote.items.map((item: any, i: number) => ({
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
      this.prisma.quote.update({
        where: { id },
        data: { status: "ACCEPTED" },
      }),
    ]);

    this.automations.trigger(companyId, "QUOTE_ACCEPTED", {
      quoteNumber: quote.number,
      clientName:  quote.client?.name  ?? "",
      clientEmail: quote.client?.email ?? "",
      total:       String(quote.total),
    }).catch(() => {});

    return invoice;
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.quote.delete({ where: { id } });
  }
}
