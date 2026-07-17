import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, HttpCode,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Controller("purchase-orders")
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Get("stats")
  stats(@Req() req: any) {
    return this.service.stats(req.user.companyId);
  }

  @Get()
  findAll(@Req() req: any, @Query() query: any) {
    return this.service.findAll(req.user.companyId, {
      search: query.search,
      status: query.status,
      supplierId: query.supplierId,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    });
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    return this.service.create(req.user.companyId, dto);
  }

  @Put(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return this.service.update(req.user.companyId, id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Req() req: any, @Param("id") id: string) {
    return this.service.remove(req.user.companyId, id);
  }

  @Post(":id/receive")
  @HttpCode(200)
  receive(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: { items: { itemId: string; receivedQty: number }[] },
  ) {
    return this.service.receiveItems(req.user.companyId, id, dto.items);
  }

  @Post(":id/receive-all")
  @HttpCode(200)
  receiveAll(@Req() req: any, @Param("id") id: string) {
    return this.service.receiveAll(req.user.companyId, id);
  }
}
