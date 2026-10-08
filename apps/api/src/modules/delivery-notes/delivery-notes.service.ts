import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { InvoicesService } from "../invoices/invoices.service";
import { createHmac } from "crypto";

@Injectable()
export class DeliveryNotesService {
  constructor(private prisma: PrismaService, private invoicesService: InvoicesService) {}

  async findAll(companyId: string, params: any) {
    const { search, status, clientId, dateFrom, dateTo, amountMin, amountMax } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const where: any = {
      companyId,
      ...(status && { status }),
      ...(clientId && { clientId }),
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
    if (note.status === "INVOICED")
      throw new BadRequestException("Este albarán ya ha sido facturado");
    if (note.status === "CANCELLED")
      throw new BadRequestException("No se puede facturar un albarán cancelado");

    // Delegate to InvoicesService so IRPF auto-apply and plan limits run correctly
    const invoice = await this.invoicesService.create(companyId, {
      clientId: note.clientId,
      notes: note.notes ?? undefined,
      items: (note.items as any[]).map((item) => ({
        description: item.description,
        quantity:    Number(item.quantity),
        unitPrice:   Number(item.unitPrice),
        discount:    item.discount ? Number(item.discount) : 0,
      })),
      taxes: [],  // InvoicesService will auto-apply IVA + IRPF based on company settings
    } as any);

    await this.prisma.deliveryNote.update({
      where: { id },
      data: { status: "INVOICED", convertedToInvoiceId: invoice.id },
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

  async generateDeca(companyId: string, id: string, matricula: string) {
    const note = await this.prisma.deliveryNote.findFirst({
      where: { id, companyId },
      include: { client: true, items: true, company: true },
    });
    if (!note) throw new NotFoundException("Albarán no encontrado");
    if (note.decaflyId) throw new BadRequestException("Este albarán ya tiene un DeCA generado");

    const company = note.company as any;
    const apiKey = company.decaflyApiKey;
    if (!apiKey) throw new BadRequestException("La empresa no tiene configurada la clave API de Decafly");

    const baseUrl = company.decaflyTestMode
      ? "https://porteo-pi.vercel.app/api/test"
      : "https://porteo-pi.vercel.app/api";

    const body = {
      cargador: {
        nombre: company.legalName ?? company.name,
        nif: company.cif ?? company.vatNumber ?? "",
      },
      destino: (note.client as any)?.address ?? "",
      naturalezaCarga: note.items.map((i: any) => i.description).join(", "),
      pesoKg: note.items.reduce((sum: number, i: any) => sum + Number(i.quantity), 0),
      matricula,
      referencia: note.number,
    };

    const res = await fetch(`${baseUrl}/v1/documentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": note.id,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Error Decafly: ${err}`);
    }

    const data = await res.json() as any;

    return this.prisma.deliveryNote.update({
      where: { id },
      data: {
        matricula,
        decaflyId: data.id,
        decaflyVerifyUrl: data.verifyUrl,
        decaflyPdfUrl: data.pdfUrl,
        decaflyHash: data.hash ?? null,
        decaflyEstado: data.estado ?? "vigente",
      },
    });
  }

  async anularDeca(companyId: string, id: string) {
    const note = await this.prisma.deliveryNote.findFirst({
      where: { id, companyId },
      include: { company: true },
    });
    if (!note) throw new NotFoundException("Albarán no encontrado");
    if (!note.decaflyId) throw new BadRequestException("Este albarán no tiene un DeCA activo");
    if (note.decaflyEstado === "anulado") throw new BadRequestException("El DeCA ya está anulado");

    const company = note.company as any;
    const apiKey = company.decaflyApiKey;
    if (!apiKey) throw new BadRequestException("La empresa no tiene configurada la clave API de Decafly");

    const baseUrl = company.decaflyTestMode
      ? "https://porteo-pi.vercel.app/api/test"
      : "https://porteo-pi.vercel.app/api";

    const res = await fetch(`${baseUrl}/v1/documentos/${note.decaflyId}/anular`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": `anular-${note.id}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Error Decafly al anular: ${err}`);
    }

    return this.prisma.deliveryNote.update({
      where: { id },
      data: { decaflyEstado: "anulado" },
    });
  }

  async handleDecaflyWebhook(companyId: string, payload: any, signature: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } }) as any;
    if (!company?.decaflyWebhookSecret) return;

    const expected = createHmac("sha256", company.decaflyWebhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");
    if (signature !== expected) throw new BadRequestException("Firma inválida");

    const { documentoId, estado } = payload;
    if (documentoId && estado) {
      await this.prisma.deliveryNote.updateMany({
        where: { companyId, decaflyId: documentoId },
        data: { decaflyEstado: estado },
      });
    }
  }
}
