import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PlansService } from "../plans/plans.service";
import { AutomationsService } from "../automations/automations.service";
import { EmailService } from "../email/email.service";

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private plans: PlansService,
    private automations: AutomationsService,
    private email: EmailService,
  ) {}

  async findAll(companyId: string, params: any) {
    const { search, status, clientId, clientSearch, dateFrom, dateTo, amountMin, amountMax } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const where: any = {
      companyId,
      ...(status && { status }),
      ...(clientId && { clientId }),
      ...(clientSearch && { client: { name: { contains: clientSearch, mode: "insensitive" } } }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: "insensitive" } },
          { client: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };
    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) where.issueDate.lte = new Date(dateTo + "T23:59:59");
    }
    if (amountMin || amountMax) {
      where.total = {};
      if (amountMin) where.total.gte = Number(amountMin);
      if (amountMax) where.total.lte = Number(amountMax);
    }

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

    const taxes = dto.taxes ?? [{ rate: 21, base: subtotal }];
    const taxAmount = taxes.reduce(
      (sum: number, t: any) => sum + subtotal * (Number(t.rate) / 100),
      0,
    );

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

    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
    const settings = (company?.settings as any) ?? {};
    const client = await this.prisma.client.findFirst({ where: { id: quote.clientId, companyId }, select: { clientType: true } });

    let invoiceSubtotal = Number(quote.subtotal);
    let ivaTax = invoiceSubtotal * 0.21;
    let irpfTax = 0;
    const taxesCreate: any[] = [];

    const defaultIvaTax = await this.prisma.tax.findFirst({ where: { companyId, rate: 21 } });
    if (defaultIvaTax) {
      taxesCreate.push({ taxId: defaultIvaTax.id, rate: 21, base: invoiceSubtotal, amount: ivaTax });
    }

    if (settings.companyType === "AUTONOMO" && settings.autoApplyIrpf && settings.irpfRate && client?.clientType !== "PARTICULAR") {
      const irpfRate = Number(settings.irpfRate);
      irpfTax = invoiceSubtotal * (irpfRate / 100);
      let irpfTaxRecord = await this.prisma.tax.findFirst({ where: { companyId, name: { contains: "IRPF", mode: "insensitive" } } });
      if (!irpfTaxRecord) {
        irpfTaxRecord = await this.prisma.tax.create({ data: { companyId, name: `IRPF ${irpfRate}%`, rate: -irpfRate, isDefault: false } });
      }
      taxesCreate.push({ taxId: irpfTaxRecord.id, rate: -irpfRate, base: invoiceSubtotal, amount: -irpfTax });
    }

    const totalTaxAmount = ivaTax - irpfTax;
    const invoiceTotal = invoiceSubtotal + totalTaxAmount;

    const [invoice] = await this.prisma.$transaction([
      this.prisma.invoice.create({
        data: {
          companyId,
          clientId: quote.clientId,
          seriesId: series.id,
          number,
          subtotal: invoiceSubtotal,
          taxAmount: totalTaxAmount,
          total: invoiceTotal,
          ...(taxesCreate.length > 0 && { taxes: { create: taxesCreate } }),
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

  async sendByEmail(companyId: string, id: string) {
    const quote = await this.findOne(companyId, id);
    const clientEmail = (quote as any).client?.email;
    if (!clientEmail) throw new BadRequestException("El cliente no tiene email registrado");

    const validUntil = quote.validUntil
      ? new Date(quote.validUntil).toLocaleDateString("es-ES")
      : "Sin fecha de caducidad";

    await this.email.sendQuote(
      clientEmail,
      (quote as any).client!.name,
      quote.number,
      Number(quote.total),
      validUntil,
    );
    if (quote.status === "DRAFT") {
      await this.prisma.quote.update({ where: { id }, data: { status: "SENT" } });
    }
    return { sent: true, to: clientEmail };
  }

  async duplicate(companyId: string, id: string) {
    const src = await this.findOne(companyId, id);
    const count = await this.prisma.quote.count({ where: { companyId } });
    const year = new Date().getFullYear();
    const number = `P-${year}-${String(count + 1).padStart(4, "0")}`;

    return this.prisma.quote.create({
      data: {
        companyId,
        clientId: src.clientId,
        number,
        status: "DRAFT",
        issueDate: new Date(),
        validUntil: src.validUntil
          ? new Date(Date.now() + (src.validUntil.getTime() - src.issueDate.getTime()))
          : undefined,
        currency: src.currency,
        subtotal: src.subtotal,
        taxAmount: src.taxAmount,
        total: src.total,
        notes: src.notes,
        items: {
          create: (src.items ?? []).map((item: any, i: number) => ({
            productId: item.productId ?? undefined,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount ?? 0,
            subtotal: item.subtotal,
            order: i,
          })),
        },
      },
      include: { items: true, client: { select: { id: true, name: true } } },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.quote.delete({ where: { id } });
  }
}
