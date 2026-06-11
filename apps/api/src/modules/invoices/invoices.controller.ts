import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { EmailService } from "../email/email.service";
import type { JwtPayload } from "@saas/types";

@ApiTags("Invoices")
@UseGuards(JwtAuthGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private emailService: EmailService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() params: any) {
    return this.invoicesService.findAll(user.companyId, params);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.invoicesService.findOne(user.companyId, id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user.companyId, dto);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body("status") status: string
  ) {
    return this.invoicesService.updateStatus(user.companyId, id, status);
  }

  @Post(":id/send")
  @HttpCode(HttpStatus.OK)
  async sendByEmail(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body("to") to?: string,
  ) {
    const invoice = await this.invoicesService.findOne(user.companyId, id);
    const recipient = to ?? (invoice as any).client?.email;
    if (!recipient) return { sent: false, reason: "No hay email de cliente" };
    await this.emailService.sendInvoice(
      recipient,
      (invoice as any).client?.name ?? "Cliente",
      (invoice as any).number,
      Number((invoice as any).total ?? 0),
      user.companyId,
    );
    // Mark as SENT if still DRAFT
    if ((invoice as any).status === "DRAFT") {
      await this.invoicesService.updateStatus(user.companyId, id, "SENT");
    }
    return { sent: true, to: recipient };
  }

  @Post(":id/payments")
  registerPayment(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: { amount: number; method: string }
  ) {
    return this.invoicesService.registerPayment(
      user.companyId,
      id,
      body.amount,
      body.method
    );
  }
}
