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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Expense claims")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("expense-claims")
export class ExpenseClaimsController {
  constructor(private service: ExpenseClaimsService) {}

  @Get("me")
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
}
