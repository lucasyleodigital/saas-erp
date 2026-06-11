import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { QuotesService } from "./quotes.service";
import { EmailService } from "../email/email.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Quotes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("quotes")
export class QuotesController {
  constructor(
    private quotesService: QuotesService,
    private emailService: EmailService,
  ) {}

  @Get()
  findAll(@CurrentUser() u: JwtPayload, @Query() p: any) {
    return this.quotesService.findAll(u.companyId, p);
  }

  @Get(":id")
  findOne(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.quotesService.findOne(u.companyId, id);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() b: any) {
    return this.quotesService.create(u.companyId, b);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body("status") status: string
  ) {
    return this.quotesService.updateStatus(u.companyId, id, status);
  }

  @Post(":id/send")
  @HttpCode(HttpStatus.OK)
  async sendByEmail(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body("to") to?: string,
  ) {
    const quote = await this.quotesService.findOne(u.companyId, id);
    const recipient = to ?? (quote as any).client?.email;
    if (!recipient) return { sent: false, reason: "No hay email de cliente" };
    await this.emailService.sendQuote(
      recipient,
      (quote as any).client?.name ?? "Cliente",
      (quote as any).number ?? id,
      Number((quote as any).total ?? 0),
      new Date((quote as any).validUntil ?? Date.now()).toLocaleDateString("es-ES"),
    );
    if ((quote as any).status === "DRAFT") {
      await this.quotesService.updateStatus(u.companyId, id, "SENT");
    }
    return { sent: true, to: recipient };
  }

  @Post(":id/convert")
  @HttpCode(HttpStatus.CREATED)
  convertToInvoice(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.quotesService.convertToInvoice(u.companyId, id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.quotesService.remove(u.companyId, id);
  }
}
