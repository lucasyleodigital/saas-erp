import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AutomationsService } from "../automations/automations.service";
import { FiscalService } from "../fiscal/fiscal.service";

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private automations: AutomationsService,
    private fiscal: FiscalService,
  ) {}

  private async nextPoNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseOrder.count({
      where: { companyId, number: { startsWith: `OC-${year}-` } },
    });
    const seq = String(count + 1).padStart(4, "0");
    return `OC-${year}-${seq}`;
  }

  async findAll(
    companyId: string,
    query: { search?: string; status?: string; supplierId?: string; page?: number; limit?: number },
  ) {
    const { search, status, supplierId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          supplier: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId },
      include: {
        supplier: { select: { id: true, name: true, email: true, phone: true, contactName: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    });
    if (!po) throw new NotFoundException("Orden de compra no encontrada");
    return po;
  }

  async create(companyId: string, dto: any) {
    const { items = [], ...poData } = dto;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: poData.supplierId, companyId },
    });
    if (!supplier) throw new NotFoundException("Proveedor no encontrado");

    const number = await this.nextPoNumber(companyId);
    const { subtotal, taxAmount, total } = this.calcTotals(items);

    return this.prisma.purchaseOrder.create({
      data: {
        ...poData,
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
            receivedQty: 0,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate ?? 0,
            subtotal: this.itemSubtotal(item),
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: true,
      },
    });
  }

  async update(companyId: string, id: string, dto: any) {
    await this.findOne(companyId, id);
    const { items, ...poData } = dto;

    if (items) {
      const { subtotal, taxAmount, total } = this.calcTotals(items);
      await this.prisma.$transaction([
        this.prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } }),
        this.prisma.purchaseOrder.update({
          where: { id },
          data: {
            ...poData,
            subtotal,
            taxAmount,
            total,
            items: {
              create: items.map((item: any) => ({
                productId: item.productId ?? null,
                description: item.description,
                quantity: item.quantity,
                receivedQty: item.receivedQty ?? 0,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate ?? 0,
                subtotal: this.itemSubtotal(item),
              })),
            },
          },
        }),
      ]);
      return this.findOne(companyId, id);
    }

    return this.prisma.purchaseOrder.update({ where: { id }, data: poData });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.purchaseOrder.delete({ where: { id } });
  }

  async receiveItems(companyId: string, id: string, itemUpdates: { itemId: string; receivedQty: number }[]) {
    const po = await this.findOne(companyId, id);
    if (po.status === "RECEIVED" || po.status === "CANCELLED") {
      throw new BadRequestException("No se puede modificar una orden en este estado");
    }

    await this.prisma.$transaction(async (tx) => {
      for (const upd of itemUpdates) {
        const item = po.items.find((i: any) => i.id === upd.itemId);
        if (!item) continue;

        await tx.purchaseOrderItem.update({
          where: { id: upd.itemId },
          data: { receivedQty: upd.receivedQty },
        });

        // Update stock if product linked
        if (item.productId) {
          const warehouse = await tx.warehouse.findFirst({
            where: { companyId, isDefault: true },
          });
          if (warehouse) {
            const delta = Number(upd.receivedQty) - Number(item.receivedQty);
            if (delta > 0) {
              await tx.stockMovement.create({
                data: {
                  warehouseId: warehouse.id,
                  productId: item.productId,
                  type: "IN",
                  quantity: delta,
                  notes: `Recepción OC ${po.number}`,
                },
              });
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: delta } },
              });
            }
          }
        }
      }

      // Recalculate overall status
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });
      const allReceived = updatedItems.every(
        (i: any) => Number(i.receivedQty) >= Number(i.quantity),
      );
      const anyReceived = updatedItems.some((i: any) => Number(i.receivedQty) > 0);
      const newStatus = allReceived ? "RECEIVED" : anyReceived ? "PARTIAL_RECEIVED" : "SENT";

      await tx.purchaseOrder.update({ where: { id }, data: { status: newStatus } });

      if (newStatus === "RECEIVED") {
        const updatedPo = await tx.purchaseOrder.findFirst({
          where: { id },
          include: {
            supplier: { select: { name: true, cifNif: true } },
            items: true,
          },
        });
        if (updatedPo) {
          this.automations.trigger(companyId, "PURCHASE_ORDER_RECEIVED", {
            orderNumber:  updatedPo.number,
            supplierName: (updatedPo as any).supplier?.name ?? "",
            total:        String(updatedPo.total),
          }).catch(() => {});

          // Auto-create fiscal expense from received PO
          const supplier = (updatedPo as any).supplier;
          const vatRate = (updatedPo as any).items[0]?.taxRate ?? 21;
          this.fiscal.createExpense(companyId, {
            date:        updatedPo.issueDate,
            description: `OC ${updatedPo.number} — ${supplier?.name ?? "Proveedor"}`,
            supplier:    supplier?.name ?? null,
            supplierNif: supplier?.cifNif ?? null,
            invoiceRef:  updatedPo.number,
            subtotal:    Number(updatedPo.subtotal),
            vatRate:     Number(vatRate),
            category:    "OTROS",
            isDeductible: true,
          }).catch((err: any) => console.error("[FISCAL] Auto-expense from PO failed:", err?.message));
        }
      }
    });

    return this.findOne(companyId, id);
  }

  async stats(companyId: string) {
    const [total, draft, sent, partial, received] = await Promise.all([
      this.prisma.purchaseOrder.count({ where: { companyId } }),
      this.prisma.purchaseOrder.count({ where: { companyId, status: "DRAFT" } }),
      this.prisma.purchaseOrder.count({ where: { companyId, status: "SENT" } }),
      this.prisma.purchaseOrder.count({ where: { companyId, status: "PARTIAL_RECEIVED" } }),
      this.prisma.purchaseOrder.count({ where: { companyId, status: "RECEIVED" } }),
    ]);
    return { total, draft, sent, partial, received };
  }

  private itemSubtotal(item: any): number {
    return Number(item.quantity) * Number(item.unitPrice);
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
