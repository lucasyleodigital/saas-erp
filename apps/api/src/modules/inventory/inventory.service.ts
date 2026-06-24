import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AutomationsService } from "../automations/automations.service";

const IN_TYPES  = ["PURCHASE", "ADJUSTMENT_IN", "RETURN", "TRANSFER_IN", "IN"];
const OUT_TYPES = ["SALE", "ADJUSTMENT_OUT", "TRANSFER"];

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private automations: AutomationsService,
  ) {}

  // ─── Warehouses ──────────────────────────────────────────────────────────────

  async getWarehouses(companyId: string) {
    return this.prisma.warehouse.findMany({
      where: { companyId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }

  async createWarehouse(companyId: string, data: any) {
    const count = await this.prisma.warehouse.count({ where: { companyId } });
    return this.prisma.warehouse.create({
      data: { ...data, companyId, isDefault: count === 0 },
    });
  }

  async updateWarehouse(companyId: string, id: string, data: any) {
    const wh = await this.prisma.warehouse.findFirst({ where: { id, companyId } });
    if (!wh) throw new NotFoundException("Almacén no encontrado");
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  async deleteWarehouse(companyId: string, id: string) {
    const wh = await this.prisma.warehouse.findFirst({ where: { id, companyId } });
    if (!wh) throw new NotFoundException("Almacén no encontrado");
    if (wh.isDefault) throw new BadRequestException("No se puede eliminar el almacén por defecto");
    const hasMovements = await this.prisma.stockMovement.count({ where: { warehouseId: id } });
    if (hasMovements > 0) throw new BadRequestException("El almacén tiene movimientos registrados");
    return this.prisma.warehouse.delete({ where: { id } });
  }

  async setDefaultWarehouse(companyId: string, id: string) {
    const wh = await this.prisma.warehouse.findFirst({ where: { id, companyId } });
    if (!wh) throw new NotFoundException("Almacen no encontrado");
    await this.prisma.warehouse.updateMany({ where: { companyId }, data: { isDefault: false } });
    return this.prisma.warehouse.update({ where: { id }, data: { isDefault: true } });
  }

  // ─── Stock Levels ─────────────────────────────────────────────────────────────

  async getStock(companyId: string, params: any = {}) {
    const { warehouseId, search, trackStockOnly, lowStockOnly } = params;

    const products = await this.prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
        ...(trackStockOnly === "true" && { trackStock: true }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku:  { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { name: "asc" },
    });

    const stockData = await Promise.all(
      products.map(async (product) => {
        const movements = await this.prisma.stockMovement.groupBy({
          by: ["type"],
          where: {
            productId: product.id,
            ...(warehouseId && { warehouseId }),
          },
          _sum: { quantity: true },
        });

        const inQty  = movements.filter((m) => IN_TYPES.includes(m.type)).reduce((s, m) => s + Number(m._sum.quantity ?? 0), 0);
        const outQty = movements.filter((m) => OUT_TYPES.includes(m.type)).reduce((s, m) => s + Number(m._sum.quantity ?? 0), 0);
        const currentStock = inQty - outQty;
        const minStock = product.minStock != null ? Number(product.minStock) : null;
        const isLow = minStock != null && currentStock <= minStock;

        return {
          ...product,
          currentStock,
          minStock,
          isLow,
          price: Number(product.price),
          cost: product.cost ? Number(product.cost) : null,
          stockValue: product.cost ? currentStock * Number(product.cost) : null,
        };
      })
    );

    if (lowStockOnly === "true") {
      return stockData.filter((p) => p.isLow);
    }

    return stockData;
  }

  // Per-warehouse stock breakdown for one product
  async getStockByWarehouse(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, companyId } });
    if (!product) throw new NotFoundException("Producto no encontrado");

    const warehouses = await this.prisma.warehouse.findMany({ where: { companyId } });

    const result = await Promise.all(
      warehouses.map(async (wh) => {
        const movements = await this.prisma.stockMovement.groupBy({
          by: ["type"],
          where: { productId, warehouseId: wh.id },
          _sum: { quantity: true },
        });
        const inQty  = movements.filter((m) => IN_TYPES.includes(m.type)).reduce((s, m) => s + Number(m._sum.quantity ?? 0), 0);
        const outQty = movements.filter((m) => OUT_TYPES.includes(m.type)).reduce((s, m) => s + Number(m._sum.quantity ?? 0), 0);
        return { warehouse: wh, stock: inQty - outQty };
      })
    );

    return { product, warehouses: result };
  }

  // ─── Alerts ────────────────────────────────────────────────────────────────────

  async getAlerts(companyId: string) {
    const stock = await this.getStock(companyId, { trackStockOnly: "true" });
    return stock.filter((p) => p.isLow);
  }

  // ─── Stock Movements ──────────────────────────────────────────────────────────

  async getMovements(companyId: string, params: any = {}) {
    const { productId, warehouseId, type, page = 1, limit = 30 } = params;

    const warehouses = await this.prisma.warehouse.findMany({ where: { companyId } });
    const warehouseIds = warehouses.map((w) => w.id);

    const where: any = {
      warehouseId: warehouseId ? warehouseId : { in: warehouseIds },
      ...(productId && { productId }),
      ...(type && { type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product:   { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async addMovement(companyId: string, data: any) {
    const { productId, warehouseId, type, quantity, reference, notes } = data;

    const warehouse = await this.prisma.warehouse.findFirst({ where: { id: warehouseId, companyId } });
    if (!warehouse) throw new NotFoundException("Almacén no encontrado");

    const product = await this.prisma.product.findFirst({ where: { id: productId, companyId } });
    if (!product) throw new NotFoundException("Producto no encontrado");

    if (OUT_TYPES.includes(type)) {
      const stockData = await this.getStock(companyId, { warehouseId });
      const ps = stockData.find((p) => p.id === productId);
      if (ps && ps.currentStock < Number(quantity)) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${ps.currentStock}, requerido: ${quantity}`
        );
      }
    }

    const delta = IN_TYPES.includes(type) ? Number(quantity) : -Number(quantity);

    const [movement] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: { productId, warehouseId, type, quantity, reference, notes },
        include: {
          product:   { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
        },
      }),
      this.prisma.product.update({
        where: { id: productId },
        data: {
          stock: { increment: delta },
          ...((!product.trackStock) && { trackStock: true }),
        },
      }),
    ]);

    // Fire LOW_STOCK trigger if stock drops at/below minStock
    const newStock = Number(product.stock) + delta;
    const minStock = product.minStock != null ? Number(product.minStock) : null;
    if (delta < 0 && minStock !== null && newStock <= minStock) {
      this.automations.trigger(companyId, "LOW_STOCK", {
        productName:  product.name,
        sku:          product.sku ?? "",
        currentStock: newStock,
        minStock,
      }).catch(() => {});
    }

    return movement;
  }

  // ─── Transfer between warehouses ──────────────────────────────────────────────

  async transferStock(
    companyId: string,
    dto: { fromWarehouseId: string; toWarehouseId: string; productId: string; quantity: number; notes?: string },
  ) {
    const { fromWarehouseId, toWarehouseId, productId, quantity, notes } = dto;

    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException("El almacén origen y destino deben ser diferentes");
    }

    const [from, to, product] = await Promise.all([
      this.prisma.warehouse.findFirst({ where: { id: fromWarehouseId, companyId } }),
      this.prisma.warehouse.findFirst({ where: { id: toWarehouseId,   companyId } }),
      this.prisma.product.findFirst({   where: { id: productId,        companyId } }),
    ]);

    if (!from)    throw new NotFoundException("Almacén origen no encontrado");
    if (!to)      throw new NotFoundException("Almacén destino no encontrado");
    if (!product) throw new NotFoundException("Producto no encontrado");

    // Check origin stock
    const stockData = await this.getStock(companyId, { warehouseId: fromWarehouseId });
    const ps = stockData.find((p) => p.id === productId);
    if (!ps || ps.currentStock < Number(quantity)) {
      throw new BadRequestException(
        `Stock insuficiente en ${from.name}. Disponible: ${ps?.currentStock ?? 0}`
      );
    }

    const ref = `TRF-${Date.now()}`;
    const label = notes ?? `Transferencia ${from.name} → ${to.name}`;

    await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: { productId, warehouseId: fromWarehouseId, type: "TRANSFER", quantity, reference: ref, notes: label },
      }),
      this.prisma.stockMovement.create({
        data: { productId, warehouseId: toWarehouseId, type: "TRANSFER_IN", quantity, reference: ref, notes: label },
      }),
    ]);

    return { success: true, reference: ref, from: from.name, to: to.name, quantity };
  }

  // ─── Physical Inventory ────────────────────────────────────────────────────────

  async physicalInventory(
    companyId: string,
    items: { productId: string; warehouseId: string; actualQty: number }[],
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({ where: { id: items[0]?.warehouseId, companyId } });
    if (!warehouse) throw new NotFoundException("Almacén no encontrado");

    const results = [];

    for (const item of items) {
      const stockData = await this.getStock(companyId, { warehouseId: item.warehouseId });
      const ps = stockData.find((p) => p.id === item.productId);
      const current = ps?.currentStock ?? 0;
      const diff = Number(item.actualQty) - current;

      if (diff === 0) {
        results.push({ productId: item.productId, diff: 0, movement: null });
        continue;
      }

      const type = diff > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
      const qty = Math.abs(diff);
      const movement = await this.addMovement(companyId, {
        productId: item.productId,
        warehouseId: item.warehouseId,
        type,
        quantity: qty,
        reference: `FISICO-${Date.now()}`,
        notes: "Ajuste por inventario físico",
      });
      results.push({ productId: item.productId, diff, movement });
    }

    return results;
  }

  // ─── Valuation ────────────────────────────────────────────────────────────────

  async getValuation(companyId: string, params: { warehouseId?: string } = {}) {
    const stock = await this.getStock(companyId, { ...params, trackStockOnly: "true" });

    const items = stock
      .filter((p) => p.cost !== null)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.currentStock,
        cost: p.cost!,
        price: p.price,
        stockValue: p.stockValue!,
        margin: p.price > 0 ? ((p.price - p.cost!) / p.price) * 100 : 0,
      }));

    const totalValue   = items.reduce((s, i) => s + i.stockValue, 0);
    const totalRevenue = items.reduce((s, i) => s + i.currentStock * i.price, 0);

    return { items, totalValue, totalRevenue, totalMargin: totalRevenue > 0 ? ((totalRevenue - totalValue) / totalRevenue) * 100 : 0 };
  }

  // ─── Min-Stock ────────────────────────────────────────────────────────────────

  async setMinStock(companyId: string, productId: string, minStock: number | null) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, companyId } });
    if (!product) throw new NotFoundException("Producto no encontrado");
    return this.prisma.product.update({
      where: { id: productId },
      data: { minStock, trackStock: true },
      select: { id: true, name: true, minStock: true, trackStock: true },
    });
  }

  // ─── Summary ──────────────────────────────────────────────────────────────────

  async getSummary(companyId: string) {
    const stockData = await this.getStock(companyId, { trackStockOnly: "true" });
    const warehouses = await this.prisma.warehouse.count({ where: { companyId } });

    const totalProducts = stockData.length;
    const lowStock      = stockData.filter((p) => p.isLow).length;
    const outOfStock    = stockData.filter((p) => p.currentStock <= 0).length;
    const totalValue    = stockData.reduce((sum, p) => sum + (p.stockValue ?? 0), 0);

    return { totalProducts, lowStock, outOfStock, totalValue, warehouses };
  }
}
