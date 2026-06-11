import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ─── Warehouses ──────────────────────────────────────────────────────────────

  async getWarehouses(companyId: string) {
    return this.prisma.warehouse.findMany({
      where: { companyId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }

  async createWarehouse(companyId: string, data: any) {
    // If first warehouse, set as default
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

  // ─── Stock Levels ─────────────────────────────────────────────────────────────

  async getStock(companyId: string, params: any = {}) {
    const { warehouseId, search, trackStockOnly } = params;

    const products = await this.prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
        ...(trackStockOnly === "true" && { trackStock: true }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { name: "asc" },
    });

    // For each product, calculate stock from movements
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

        const inQty = movements
          .filter((m) => ["PURCHASE", "ADJUSTMENT_IN", "RETURN"].includes(m.type))
          .reduce((sum, m) => sum + Number(m._sum.quantity ?? 0), 0);

        const outQty = movements
          .filter((m) => ["SALE", "ADJUSTMENT_OUT", "TRANSFER"].includes(m.type))
          .reduce((sum, m) => sum + Number(m._sum.quantity ?? 0), 0);

        const currentStock = inQty - outQty;

        return {
          ...product,
          currentStock,
          price: Number(product.price),
          cost: product.cost ? Number(product.cost) : null,
          stockValue: product.cost ? currentStock * Number(product.cost) : null,
        };
      })
    );

    return stockData;
  }

  // ─── Stock Movements ──────────────────────────────────────────────────────────

  async getMovements(companyId: string, params: any = {}) {
    const { productId, warehouseId, page = 1, limit = 30 } = params;

    const warehouses = await this.prisma.warehouse.findMany({ where: { companyId } });
    const warehouseIds = warehouses.map((w) => w.id);

    const where: any = {
      warehouseId: warehouseId ? warehouseId : { in: warehouseIds },
      ...(productId && { productId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: Number(limit),
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { data, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  }

  async addMovement(companyId: string, data: any) {
    const { productId, warehouseId, type, quantity, reference, notes } = data;

    // Validate warehouse belongs to company
    const warehouse = await this.prisma.warehouse.findFirst({ where: { id: warehouseId, companyId } });
    if (!warehouse) throw new NotFoundException("Almacén no encontrado");

    // Validate product belongs to company
    const product = await this.prisma.product.findFirst({ where: { id: productId, companyId } });
    if (!product) throw new NotFoundException("Producto no encontrado");

    // Check for negative stock on outbound movements
    if (["SALE", "ADJUSTMENT_OUT", "TRANSFER"].includes(type)) {
      const stockData = await this.getStock(companyId, { warehouseId });
      const productStock = stockData.find((p) => p.id === productId);
      if (productStock && productStock.currentStock < Number(quantity)) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${productStock.currentStock}, requerido: ${quantity}`
        );
      }
    }

    // Enable trackStock on product if not already
    if (!product.trackStock) {
      await this.prisma.product.update({ where: { id: productId }, data: { trackStock: true } });
    }

    return this.prisma.stockMovement.create({
      data: { productId, warehouseId, type, quantity, reference, notes },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });
  }

  async getSummary(companyId: string) {
    const stockData = await this.getStock(companyId, { trackStockOnly: "true" });
    const warehouses = await this.prisma.warehouse.count({ where: { companyId } });

    const totalProducts = stockData.length;
    const lowStock = stockData.filter((p) => p.currentStock > 0 && p.currentStock <= 5).length;
    const outOfStock = stockData.filter((p) => p.currentStock <= 0).length;
    const totalValue = stockData.reduce((sum, p) => sum + (p.stockValue ?? 0), 0);

    return { totalProducts, lowStock, outOfStock, totalValue, warehouses };
  }
}
