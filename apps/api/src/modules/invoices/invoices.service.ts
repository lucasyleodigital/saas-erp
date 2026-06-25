import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PlansService } from "../plans/plans.service";
import { AutomationsService } from "../automations/automations.service";
import { EmailService } from "../email/email.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { VerifactuService } from "../verifactu/verifactu.service";
import type { PaginationParams } from "@saas/types";

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private plans: PlansService,
    private automations: AutomationsService,
    private email: EmailService,
    private verifactu: VerifactuService,
    private notifications: NotificationsService,
    private audit: AuditService,
  ) {}

  async findAll(companyId: string, params: PaginationParams & { status?: string; dateFrom?: string; dateTo?: string; amountMin?: string; amountMax?: string; clientId?: string }) {
    const { search, status, sortBy = "createdAt", sortOrder = "desc" } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      ...(status && { status }),
      ...(params.clientId && { clientId: params.clientId }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: "insensitive" } },
          { client: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };
    if (params.dateFrom || params.dateTo) {
      where.issueDate = {};
      if (params.dateFrom) where.issueDate.gte = new Date(params.dateFrom);
      if (params.dateTo) where.issueDate.lte = new Date(params.dateTo + "T23:59:59");
    }
    if (params.amountMin || params.amountMax) {
      where.total = {};
      if (params.amountMin) where.total.gte = Number(params.amountMin);
      if (params.amountMax) where.total.lte = Number(params.amountMax);
    }

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

  async findOne(companyId: string, id: string) {  // public — used by controller
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        company: {
        select: {
          id: true, name: true, legalName: true, cif: true,
          address: true, city: true, province: true, postalCode: true,
          email: true, phone: true, logo: true, website: true, settings: true,
          bankAccounts: { where: { isActive: true }, take: 1 },
        },
      },
        items: { include: { product: true }, orderBy: { order: "asc" } },
        taxes: { include: { tax: true } },
        payments: { orderBy: { paidAt: "desc" } },
        series: { select: { prefix: true } },
        verifactu: true,
      },
    });
    if (!invoice) throw new NotFoundException("Factura no encontrada");
    return invoice;
  }

  async create(companyId: string, dto: CreateInvoiceDto) {
    const monthCount = await this.plans.countInvoicesThisMonth(companyId);
    await this.plans.checkLimit(companyId, "maxInvoicesPerMonth", monthCount);

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

    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
    const settings = (company?.settings as any) ?? {};
    let rawTaxes = dto.taxes ?? [];

    // Resolve tax IDs - find or create Tax records for each tax entry
    const taxesToCreate: Array<{ taxId: string; rate: number; base: number }> = [];
    for (const t of rawTaxes) {
      let resolvedTaxId = t.taxId;
      const existingTax = await this.prisma.tax.findFirst({ where: { id: t.taxId, companyId } });
      if (!existingTax) {
        const taxName = t.rate > 0 ? `IVA ${t.rate}%` : `IRPF ${Math.abs(t.rate)}%`;
        const found = await this.prisma.tax.findFirst({
          where: { companyId, rate: t.rate },
        });
        if (found) {
          resolvedTaxId = found.id;
        } else {
          const created = await this.prisma.tax.create({
            data: { companyId, name: taxName, rate: t.rate, isDefault: t.rate > 0 },
          });
          resolvedTaxId = created.id;
        }
      }
      taxesToCreate.push({ taxId: resolvedTaxId, rate: t.rate, base: t.base ?? subtotal });
    }

    // Auto-apply IRPF for autonomos if not already included
    if (settings.autoApplyIrpf && settings.companyType === "AUTONOMO" && settings.irpfRate) {
      const hasIrpf = taxesToCreate.some((t) => t.rate < 0);
      if (!hasIrpf) {
        const irpfRate = Number(settings.irpfRate);
        let irpfTax = await this.prisma.tax.findFirst({
          where: { companyId, name: { contains: "IRPF", mode: "insensitive" } },
        });
        if (!irpfTax) {
          irpfTax = await this.prisma.tax.create({
            data: { companyId, name: `IRPF ${irpfRate}%`, rate: -irpfRate, isDefault: false },
          });
        }
        taxesToCreate.push({ taxId: irpfTax.id, rate: -irpfRate, base: subtotal });
      }
    }

    // If no taxes at all, create default IVA 21%
    if (taxesToCreate.length === 0) {
      let ivaTax = await this.prisma.tax.findFirst({
        where: { companyId, rate: 21 },
      });
      if (!ivaTax) {
        ivaTax = await this.prisma.tax.create({
          data: { companyId, name: "IVA 21%", rate: 21, isDefault: true },
        });
      }
      taxesToCreate.push({ taxId: ivaTax.id, rate: 21, base: subtotal });
    }

    const taxAmount = taxesToCreate.reduce((sum, t) => sum + t.base * (t.rate / 100), 0);
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
          taxes: taxesToCreate.length > 0
            ? {
                create: taxesToCreate.map((t) => ({
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

    this.automations.trigger(companyId, "INVOICE_CREATED", {
      invoiceNumber: invoice.number,
      clientEmail:   (invoice as any).client?.email ?? "",
      clientName:    (invoice as any).client?.name  ?? "",
      total:         String(invoice.total),
      currency:      invoice.currency,
    }).catch(() => {});

    this.notifications.create(companyId, {
      title: "Factura creada",
      body: `Factura ${invoice.number} creada para ${(invoice as any).client?.name ?? "cliente"} por ${Number(invoice.total).toFixed(2)} ${invoice.currency}`,
    }).catch(() => {});

    this.audit.log({
      companyId,
      action: "CREATE",
      entity: "Invoice",
      entityId: invoice.id,
      newData: { number: invoice.number, total: invoice.total, clientId: dto.clientId },
    }).catch(() => {});

    return invoice;
  }

  async updateStatus(companyId: string, id: string, status: string) {
    await this.findOne(companyId, id);
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: status as any },
    });
    if (status === "SENT" || status === "PAID") {
      this.verifactu.generateForInvoice(companyId, id, true).catch(() => {});
    }
    return updated;
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

    this.notifications.create(companyId, {
      title: newStatus === "PAID" ? "Factura cobrada" : "Pago parcial registrado",
      body: `${newStatus === "PAID" ? "Cobrada" : "Pago parcial en"} factura ${invoice.number} — ${amount.toFixed(2)} ${invoice.currency}`,
    }).catch(() => {});

    this.audit.log({
      companyId,
      action: "UPDATE",
      entity: "Invoice",
      entityId: id,
      oldData: { status: invoice.status, paidAmount: invoice.paidAmount },
      newData: { status: newStatus, paidAmount: newPaid },
    }).catch(() => {});

    if (newStatus === "PAID") {
      this.automations.trigger(companyId, "INVOICE_PAID", {
        invoiceNumber: invoice.number,
        clientEmail:   invoice.client?.email ?? "",
        clientName:    invoice.client?.name  ?? "",
        total:         String(invoice.total),
        currency:      invoice.currency,
      }).catch(() => {});
      this.verifactu.generateForInvoice(companyId, id, true).catch(() => {});
    }

    return payment;
  }

  async remove(companyId: string, id: string, role?: string) {
    const invoice = await this.findOne(companyId, id);

    if (role !== "SUPER_ADMIN") {
      const hasVerifactu = await this.prisma.verifactuRecord.count({ where: { invoiceId: id } });
      const canDelete = invoice.status === "DRAFT" || (invoice.status === "CANCELLED" && hasVerifactu === 0);

      if (!canDelete) {
        throw new BadRequestException(
          "No se puede eliminar una factura emitida (VeriFactu). Solo se pueden eliminar borradores o facturas canceladas sin registro fiscal."
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.verifactuRecord.deleteMany({ where: { invoiceId: id } }),
      this.prisma.invoiceTax.deleteMany({ where: { invoiceId: id } }),
      this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } }),
      this.prisma.payment.deleteMany({ where: { invoiceId: id } }),
      this.prisma.invoice.delete({ where: { id } }),
    ]);
    return { deleted: true };
  }

  async duplicate(companyId: string, id: string, newClientId?: string) {
    const src = await this.findOne(companyId, id);

    const series = src.seriesId
      ? await this.prisma.invoiceSeries.findFirst({ where: { id: src.seriesId } })
      : await this.prisma.invoiceSeries.findFirst({ where: { companyId, isDefault: true } });

    if (!series) throw new BadRequestException("Serie no encontrada");
    const number = `${series.prefix}${String(series.nextNumber).padStart(4, "0")}`;

    const srcIssue = new Date(src.issueDate);
    const srcDue = src.dueDate ? new Date(src.dueDate) : null;
    const daysDiff = srcDue ? Math.round((srcDue.getTime() - srcIssue.getTime()) / 86400000) : 0;
    const newDue = srcDue ? new Date(Date.now() + daysDiff * 86400000) : undefined;

    const validTaxes = (src.taxes ?? []).filter((t: any) => t.taxId);

    const [invoice] = await this.prisma.$transaction([
      this.prisma.invoice.create({
        data: {
          companyId,
          clientId: newClientId || src.clientId,
          seriesId: series.id,
          number,
          status: "DRAFT",
          issueDate: new Date(),
          dueDate: newDue,
          currency: src.currency,
          subtotal: Number(src.subtotal),
          taxAmount: Number(src.taxAmount),
          total: Number(src.total),
          notes: src.notes,
          terms: src.terms,
          items: {
            create: (src.items ?? []).map((item: any, i: number) => ({
              productId: item.productId,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              discount: Number(item.discount ?? 0),
              subtotal: Number(item.subtotal),
              order: i,
            })),
          },
          taxes: validTaxes.length > 0
            ? {
                create: validTaxes.map((t: any) => ({
                  taxId: t.taxId,
                  rate: Number(t.rate),
                  base: Number(t.base),
                  amount: Number(t.amount),
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

  async bulkUpdateStatus(companyId: string, ids: string[], status: string) {
    const valid = ["DRAFT", "SENT", "PAID", "CANCELLED"];
    if (!valid.includes(status)) throw new BadRequestException("Estado no valido");

    const result = await this.prisma.invoice.updateMany({
      where: { id: { in: ids }, companyId },
      data: { status: status as any },
    });
    return { updated: result.count };
  }

  async setRecurring(companyId: string, id: string, isRecurring: boolean, interval?: string) {
    await this.findOne(companyId, id);
    const valid = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];
    if (isRecurring && (!interval || !valid.includes(interval))) {
      throw new BadRequestException("Intervalo no valido. Usa: WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY");
    }
    return this.prisma.invoice.update({
      where: { id },
      data: {
        isRecurring,
        recurringCron: isRecurring ? interval : null,
      },
    });
  }

  async sendByEmail(companyId: string, id: string) {
    const invoice = await this.findOne(companyId, id);
    const clientEmail = invoice.client?.email;
    if (!clientEmail) throw new BadRequestException("El cliente no tiene email registrado");

    const { generateInvoicePdf } = await import("./invoice-pdf.generator");
    const pdfBuffer = await generateInvoicePdf(invoice);

    await this.email.sendInvoice(
      clientEmail,
      invoice.client!.name,
      invoice.number,
      Number(invoice.total),
      invoice.company?.name ?? "",
      pdfBuffer,
    );
    if (invoice.status === "DRAFT") {
      await this.prisma.invoice.update({ where: { id }, data: { status: "SENT" } });
    }
    this.verifactu.generateForInvoice(companyId, id, true).catch(() => {});
    return { sent: true, to: clientEmail };
  }
}
