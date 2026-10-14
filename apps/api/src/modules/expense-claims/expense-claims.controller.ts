import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ExpenseClaimsService } from "./expense-claims.service";
import { PlanFeatureGuard, RequiresFeature } from "../plans/requires-feature";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Expense claims")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlanFeatureGuard)
@RequiresFeature("hasExpenseClaims")
@Controller("expense-claims")
export class ExpenseClaimsController {
  constructor(private service: ExpenseClaimsService) {}

  @Get("me")
  @RequiresFeature(null)
  me(@CurrentUser() u: JwtPayload) {
    return this.service.me(u);
  }

  @Patch("settings")
  updateSettings(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.service.updateSettings(u, body);
  }

  @Get("policies")
  getPolicies(@CurrentUser() u: JwtPayload) {
    return this.service.getPolicies(u.companyId);
  }

  @Put("policies")
  savePolicies(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.service.savePolicies(u, body);
  }

  @Get("analytics")
  analytics(@CurrentUser() u: JwtPayload, @Query() q: any) {
    return this.service.analytics(u, q);
  }

  @Get("claims")
  listClaims(@CurrentUser() u: JwtPayload, @Query() q: any) {
    return this.service.listClaims(u, q);
  }

  @Post("claims")
  @HttpCode(HttpStatus.CREATED)
  createClaim(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.service.createClaim(u, body);
  }

  @Patch("claims/:id")
  updateClaim(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.service.updateClaim(u, id, body);
  }

  @Delete("claims/:id")
  @HttpCode(HttpStatus.OK)
  removeClaim(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.service.removeClaim(u, id);
  }

  @Get("reports")
  listReports(@CurrentUser() u: JwtPayload, @Query() q: any) {
    return this.service.listReports(u, q);
  }

  @Get("reports/:id")
  getReport(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.service.getReport(u, id);
  }

  @Post("reports")
  @HttpCode(HttpStatus.CREATED)
  createReport(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.service.createReport(u, body);
  }

  @Post("reports/:id/withdraw")
  withdrawReport(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.service.withdrawReport(u, id);
  }

  @Post("reports/:id/approve")
  approveReport(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.service.approveReport(u, id, body);
  }

  @Post("reports/:id/reject")
  rejectReport(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.service.rejectReport(u, id, body);
  }

  @Post("reports/:id/reopen")
  reopenReport(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.service.reopenReport(u, id);
  }

  @Post("reports/:id/reimburse")
  reimburseReport(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.service.reimburseReport(u, id, body);
  }

  @Get("cards")
  @RequiresFeature("hasExpenseAdvanced")
  listCards(@CurrentUser() u: JwtPayload) {
    return this.service.listCards(u);
  }

  @Post("cards")
  @RequiresFeature("hasExpenseAdvanced")
  @HttpCode(HttpStatus.CREATED)
  createCard(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.service.createCard(u, body);
  }

  @Get("cards/reconciliation")
  @RequiresFeature("hasExpenseAdvanced")
  reconciliation(@CurrentUser() u: JwtPayload, @Query() q: any) {
    return this.service.reconciliation(u, q);
  }

  @Post("cards/auto-match")
  @RequiresFeature("hasExpenseAdvanced")
  autoMatch(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.service.autoMatchCardCharges(u, body);
  }

  @Post("cards/charges/:txId/request-receipt")
  @RequiresFeature("hasExpenseAdvanced")
  requestReceipt(@CurrentUser() u: JwtPayload, @Param("txId") txId: string) {
    return this.service.requestReceiptForCharge(u, txId);
  }

  @Patch("cards/:id")
  @RequiresFeature("hasExpenseAdvanced")
  updateCard(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.service.updateCard(u, id, body);
  }

  @Delete("cards/:id")
  @RequiresFeature("hasExpenseAdvanced")
  @HttpCode(HttpStatus.OK)
  removeCard(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.service.removeCard(u, id);
  }

  @Post("claims/:id/link-transaction")
  @RequiresFeature("hasExpenseAdvanced")
  linkTransaction(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.service.linkTransaction(u, id, body);
  }

  @Delete("claims/:id/link-transaction")
  @RequiresFeature("hasExpenseAdvanced")
  @HttpCode(HttpStatus.OK)
  unlinkTransaction(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.service.unlinkTransaction(u, id);
  }

  @Get("email-address")
  @RequiresFeature("hasExpenseAdvanced")
  emailAddress(@CurrentUser() u: JwtPayload) {
    return this.service.getEmailAddress(u);
  }

  @Post("email-address/regenerate")
  @RequiresFeature("hasExpenseAdvanced")
  regenerateEmailAddress(@CurrentUser() u: JwtPayload) {
    return this.service.getEmailAddress(u, true);
  }
}
