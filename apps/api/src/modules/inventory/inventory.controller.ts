import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { InventoryService } from "./inventory.service";
import { AddMovementDto } from "./dto/add-movement.dto";
import { TransferStockDto } from "./dto/transfer-stock.dto";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";
import type { JwtPayload } from "@saas/types";

@UseGuards(JwtAuthGuard)
@Controller("inventory")
export class InventoryController {
  constructor(private service: InventoryService) {}

  // ── Summary & Reports (static before /:id) ────────────────────────────────

  @Get("summary")
  getSummary(@CurrentUser() user: JwtPayload) {
    return this.service.getSummary(user.companyId);
  }

  @Get("alerts")
  getAlerts(@CurrentUser() user: JwtPayload) {
    return this.service.getAlerts(user.companyId);
  }

  @Get("valuation")
  getValuation(@CurrentUser() user: JwtPayload, @Query() query: any) {
    return this.service.getValuation(user.companyId, { warehouseId: query.warehouseId });
  }

  // ── Stock ─────────────────────────────────────────────────────────────────

  @Get("stock")
  getStock(@CurrentUser() user: JwtPayload, @Query() query: any) {
    return this.service.getStock(user.companyId, query);
  }

  @Get("stock/:productId/warehouses")
  getStockByWarehouse(@CurrentUser() user: JwtPayload, @Param("productId") productId: string) {
    return this.service.getStockByWarehouse(user.companyId, productId);
  }

  @Put("stock/:productId/min-stock")
  @HttpCode(200)
  setMinStock(
    @CurrentUser() user: JwtPayload,
    @Param("productId") productId: string,
    @Body() body: { minStock: number | null },
  ) {
    return this.service.setMinStock(user.companyId, productId, body.minStock);
  }

  // ── Movements ─────────────────────────────────────────────────────────────

  @Get("movements")
  getMovements(@CurrentUser() user: JwtPayload, @Query() query: any) {
    return this.service.getMovements(user.companyId, query);
  }

  @Post("movements")
  addMovement(@CurrentUser() user: JwtPayload, @Body() body: AddMovementDto) {
    return this.service.addMovement(user.companyId, body);
  }

  @Post("transfer")
  @HttpCode(200)
  transferStock(@CurrentUser() user: JwtPayload, @Body() body: TransferStockDto) {
    return this.service.transferStock(user.companyId, body);
  }

  @Post("physical")
  @HttpCode(200)
  physicalInventory(@CurrentUser() user: JwtPayload, @Body() body: { items: any[] }) {
    return this.service.physicalInventory(user.companyId, body.items);
  }

  // ── Warehouses ────────────────────────────────────────────────────────────

  @Get("warehouses")
  getWarehouses(@CurrentUser() user: JwtPayload) {
    return this.service.getWarehouses(user.companyId);
  }

  @Post("warehouses")
  createWarehouse(@CurrentUser() user: JwtPayload, @Body() body: CreateWarehouseDto) {
    return this.service.createWarehouse(user.companyId, body);
  }

  @Put("warehouses/:id")
  updateWarehouse(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: UpdateWarehouseDto) {
    return this.service.updateWarehouse(user.companyId, id, body);
  }

  @Delete("warehouses/:id")
  @HttpCode(204)
  deleteWarehouse(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.service.deleteWarehouse(user.companyId, id);
  }

  @Post("warehouses/:id/default")
  @HttpCode(200)
  setDefault(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.service.setDefaultWarehouse(user.companyId, id);
  }
}
