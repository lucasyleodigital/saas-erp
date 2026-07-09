import { Controller, Get, Post, Delete, Query, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { FiscalService } from "./fiscal.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Fiscal")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("fiscal")
export class FiscalController {
  constructor(private fiscal: FiscalService) {}

  @Get("calendar")
  getCalendar(@Query("year") year: string) {
    return this.fiscal.getCalendar(Number(year) || new Date().getFullYear());
  }

  @Get("annual-summary")
  getAnnualSummary(@CurrentUser() u: JwtPayload, @Query("year") year: string) {
    return this.fiscal.getAnnualSummary(u.companyId, Number(year) || new Date().getFullYear());
  }

  @Get("m303")
  getM303(@CurrentUser() u: JwtPayload, @Query("year") year: string, @Query("quarter") quarter: string) {
    const y = Number(year) || new Date().getFullYear();
    const q = Number(quarter) || Math.floor(new Date().getMonth() / 3) + 1;
    return this.fiscal.getM303(u.companyId, y, q);
  }

  @Get("m130")
  getM130(@CurrentUser() u: JwtPayload, @Query("year") year: string, @Query("quarter") quarter: string) {
    const y = Number(year) || new Date().getFullYear();
    const q = Number(quarter) || Math.floor(new Date().getMonth() / 3) + 1;
    return this.fiscal.getM130(u.companyId, y, q);
  }

  @Get("periods")
  getPeriods(@CurrentUser() u: JwtPayload, @Query("year") year: string) {
    return this.fiscal.getFiscalPeriods(u.companyId, Number(year) || new Date().getFullYear());
  }

  @Post("periods/:year/:quarter/file")
  markFiled(
    @CurrentUser() u: JwtPayload,
    @Param("year") year: string,
    @Param("quarter") quarter: string,
    @Body() body: any,
  ) {
    return this.fiscal.markFiled(u.companyId, Number(year), Number(quarter), body);
  }

  @Get("expenses")
  getExpenses(@CurrentUser() u: JwtPayload, @Query() params: any) {
    return this.fiscal.getExpenses(u.companyId, params);
  }

  @Post("expenses")
  createExpense(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.fiscal.createExpense(u.companyId, body);
  }

  @Delete("expenses/:id")
  deleteExpense(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.fiscal.deleteExpense(u.companyId, id);
  }
}
