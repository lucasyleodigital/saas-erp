import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { InventoryService } from "./inventory.service";
import type { JwtPayload } from "@saas/types";

@ApiTags("Inventory")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("inventory")
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Get("summary")
  getSummary(@CurrentUser() user: JwtPayload) {
    return this.service.getSummary(user.companyId);
  }

  @Get("stock")
  getStock(@CurrentUser() user: JwtPayload, @Query() query: any) {
    return this.service.getStock(user.companyId, query);
  }

  @Get("movements")
  getMovements(@CurrentUser() user: JwtPayload, @Query() query: any) {
    return this.service.getMovements(user.companyId, query);
  }

  @Post("movements")
  addMovement(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.service.addMovement(user.companyId, body);
  }

  @Get("warehouses")
  getWarehouses(@CurrentUser() user: JwtPayload) {
    return this.service.getWarehouses(user.companyId);
  }

  @Post("warehouses")
  createWarehouse(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.service.createWarehouse(user.companyId, body);
  }

  @Put("warehouses/:id")
  updateWarehouse(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.service.updateWarehouse(user.companyId, id, body);
  }
}
