import {
  Controller, Get, Post, Delete, Param, Body, Query, Patch,
  UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
import { BillingService } from "../billing/billing.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Invoices")
@UseGuards(JwtAuthGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(
    private svc: InvoicesService,
    private billing: BillingService,
  ) {}

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

  @Delete(":id")
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.remove(u.companyId, id, u.role);
  }

  @Patch(":id/recurring")
  setRecurring(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() body: { isRecurring: boolean; interval?: string },
  ) {
    return this.svc.setRecurring(u.companyId, id, body.isRecurring, body.interval);
  }

  @Post(":id/payment-link")
  @HttpCode(HttpStatus.OK)
  createPaymentLink(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() body: { successUrl: string; cancelUrl: string },
  ) {
    return this.billing.createInvoicePaymentLink(u.companyId, id, body.successUrl, body.cancelUrl);
  }

  @Post(":id/duplicate")
  duplicate(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() body?: { clientId?: string },
  ) {
    return this.svc.duplicate(u.companyId, id, body?.clientId);
  }

  @Post("bulk/status")
  @HttpCode(HttpStatus.OK)
  bulkUpdateStatus(
    @CurrentUser() u: JwtPayload,
    @Body() body: { ids: string[]; status: string },
  ) {
    return this.svc.bulkUpdateStatus(u.companyId, body.ids, body.status);
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
