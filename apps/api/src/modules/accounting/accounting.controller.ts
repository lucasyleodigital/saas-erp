import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AccountingService } from "./accounting.service";
import { PlansService } from "../plans/plans.service";
import { CreateJournalEntryDto } from "./dto/create-journal-entry.dto";
import { CreateAccountDto } from "./dto/create-account.dto";
import type { JwtPayload } from "@saas/types";

@ApiTags("Accounting")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounting")
export class AccountingController {
  constructor(
    private service: AccountingService,
    private plans: PlansService,
  ) {}

  @Get("profit-loss")
  async getProfitAndLoss(@CurrentUser() user: JwtPayload, @Query("year") year: string) {
    await this.plans.requireFeature(user.companyId, "hasAccounting");
    return this.service.getProfitAndLoss(user.companyId, Number(year) || new Date().getFullYear());
  }

  @Get("vat-report")
  getVatReport(@CurrentUser() user: JwtPayload, @Query("year") year: string) {
    return this.service.getVatReport(user.companyId, Number(year) || new Date().getFullYear());
  }

  @Get("modelo-347")
  getModelo347(@CurrentUser() user: JwtPayload, @Query("year") year: string) {
    return this.service.getModelo347(user.companyId, Number(year) || new Date().getFullYear());
  }

  @Get("retenciones")
  getRetenciones(@CurrentUser() user: JwtPayload, @Query("year") year: string) {
    return this.service.getRetencionesReport(user.companyId, Number(year) || new Date().getFullYear());
  }

  @Get("journal-entries")
  getJournalEntries(@CurrentUser() user: JwtPayload, @Query() query: any) {
    return this.service.getJournalEntries(user.companyId, query);
  }

  @Post("journal-entries")
  createJournalEntry(@CurrentUser() user: JwtPayload, @Body() body: CreateJournalEntryDto) {
    return this.service.createJournalEntry(user.companyId, body);
  }

  @Delete("journal-entries/:id")
  deleteJournalEntry(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.service.deleteJournalEntry(user.companyId, id);
  }

  @Get("accounts")
  getAccounts(@CurrentUser() user: JwtPayload) {
    return this.service.getAccounts(user.companyId);
  }

  @Post("accounts")
  createAccount(@CurrentUser() user: JwtPayload, @Body() body: CreateAccountDto) {
    return this.service.createAccount(user.companyId, body);
  }
}
