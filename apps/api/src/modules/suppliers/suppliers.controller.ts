import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, HttpCode,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SuppliersService } from "./suppliers.service";

@Controller("suppliers")
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Get("stats")
  stats(@Req() req: any) {
    return this.service.stats(req.user.companyId);
  }

  @Get()
  findAll(@Req() req: any, @Query() query: any) {
    return this.service.findAll(req.user.companyId, {
      search: query.search,
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
}
