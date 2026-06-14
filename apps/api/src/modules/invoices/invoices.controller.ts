import {
  Controller, Get, Post, Param, Body, Query, Patch,
  UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Invoices")
@UseGuards(JwtAuthGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(private svc: InvoicesService) {}

  @Get()
  findAll(@CurrentUser() u: JwtPayload, @Query() params: any) {
    return this.svc.findAll(u.companyId, params);
  }

  @Get(":id")
  findOne(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.findOne(u.companyId, id);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() dto: CreateInvoiceDto) {
    return this.svc.create(u.companyId, dto);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.svc.updateStatus(u.companyId, id, status);
  }

  @Post(":id/send-email")
  @HttpCode(HttpStatus.OK)
  sendByEmail(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.sendByEmail(u.companyId, id);
  }

  @Post(":id/payments")
  registerPayment(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() body: { amount: number; method: string },
  ) {
    return this.svc.registerPayment(u.companyId, id, body.amount, body.method);
  }
}
