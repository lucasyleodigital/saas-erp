import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import type { PaginationParams } from "@saas/types";

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, params: PaginationParams & { status?: string }) {
    const { page = 1, limit = 20, search, status, sortBy = "createdAt", sortOrder = "desc" } = params;
    const skip = (page - 1) * limit;

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
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          client: { select: { id: true, name: true, cifNif: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        items: { include: { product: true }, orderBy: { order: "asc" } },
        taxes: { include: { tax: true } },
        payments: { orderBy: { paidAt: "desc" } },
        verifactu: true,
      },
    });
    if (!invoice) throw new NotFoundException("Factura no encontrada");
    return invoice;
  }

  async create(companyId: string, dto: CreateInvoiceDto) {
    const series = dto.seriesId
      ? await this.prisma.invoiceSeries.findFirst({
          where: { id: dto.seriesId, companyId },
        })
      : await this.prisma.invoiceSeries.findFirst({
          where: { companyId, isDefault: true },
        });

    if (!series) throw new BadRequestException("Serie de factura no encontrada");

    const number = `${series.prefix}${String(series.nextNumber).padStart(4, "0")}`;

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * (1 - (item.discount ?? 0) / 100),
      0
    );
    const taxAmount = dto.taxes?.reduce((sum, t) => sum + t.base * (t.rate / 100), 0) ?? 0;
    const total = subtotal + taxAmount;

    const [invoice] = await this.prisma.$transaction([
      this.prisma.invoice.create({
        data: {
          companyId,
          clientId: dto.clientId,
          seriesId: series.id,
          number,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          currency: dto.currency ?? "EUR",
          subtotal,
          taxAmount,
          total,
          notes: dto.notes,
          terms: dto.terms,
          items: {
            create: dto.items.map((item, i) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount ?? 0,
              subtotal:
                item.quantity *
                item.unitPrice *
                (1 - (item.discount ?? 0) / 100),
              order: i,
            })),
          },
          taxes: dto.taxes
            ? {
                create: dto.taxes.map((t) => ({
                  taxId: t.taxId,
                  rate: t.rate,
                  base: t.base,
                  amount: t.base * (t.rate / 100),
                })),
              }
            : undefined,
        },
        include: { items: true, taxes: true, client: true },
      }),
      this.prisma.invoiceSeries.update({
        where: { id: series.id },
        data: { nextNumber: { increment: 1 } },
      }),
    ]);

    return invoice;
  }

  async updateStatus(companyId: string, id: string, status: string) {
    await this.findOne(companyId, id);
    return this.prisma.invoice.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async registerPayment(companyId: string, id: string, amount: number, method: string) {
    const invoice = await this.findOne(companyId, id);
    const newPaid = Number(invoice.paidAmount) + amount;
    const newStatus = newPaid >= Number(invoice.total) ? "PAID" : "PARTIAL";

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: { invoiceId: id, amount, method: method as any },
      }),
      this.prisma.invoice.update({
        where: { id },
        data: { paidAmount: newPaid, status: newStatus as any },
      }),
    ]);

    return payment;
  }
}
