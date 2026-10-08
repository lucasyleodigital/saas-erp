import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ShipmentsService, CreateShipmentDto } from "./shipments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Shipments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("shipments")
export class ShipmentsController {
  constructor(private shipmentsService: ShipmentsService) {}

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() dto: CreateShipmentDto) {
    return this.shipmentsService.create(u.companyId, dto);
  }

  @Get()
  findAll(@CurrentUser() u: JwtPayload, @Query() params: any) {
    return this.shipmentsService.findAll(u.companyId, params);
  }

  @Get(":id")
  findOne(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.shipmentsService.findOne(u.companyId, id);
  }

  @Post(":id/anular")
  @HttpCode(HttpStatus.OK)
  anular(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.shipmentsService.anular(u.companyId, id);
  }
}
