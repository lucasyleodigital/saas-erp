import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { TimeEntriesService } from "./time-entries.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Time Entries")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("time-entries")
export class TimeEntriesController {
  constructor(private svc: TimeEntriesService) {}

  @Get()
  findAll(@CurrentUser() u: JwtPayload, @Query() q: any) {
    return this.svc.findAll(u.companyId, q);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.svc.create(u.companyId, body);
  }

  @Post("clock-in")
  clockIn(@CurrentUser() u: JwtPayload, @Body() body: { employeeId: string; projectId?: string; latitude?: number; longitude?: number; method?: string }) {
    return this.svc.clockIn(u.companyId, body.employeeId, body);
  }

  @Post("clock-out")
  clockOut(@CurrentUser() u: JwtPayload, @Body() body: { employeeId: string; breakMinutes?: number; latitude?: number; longitude?: number }) {
    return this.svc.clockOut(u.companyId, body.employeeId, body);
  }

  @Get("active")
  getActiveClocks(@CurrentUser() u: JwtPayload) {
    return this.svc.getActiveClocks(u.companyId);
  }

  @Get("summary")
  getSummary(@CurrentUser() u: JwtPayload, @Query("employeeId") employeeId?: string) {
    return this.svc.getSummary(u.companyId, employeeId);
  }

  @Get("report")
  getMonthlyReport(@CurrentUser() u: JwtPayload, @Query("year") year: string, @Query("month") month: string) {
    return this.svc.getMonthlyReport(u.companyId, Number(year) || new Date().getFullYear(), Number(month) || new Date().getMonth() + 1);
  }

  @Get("weekly")
  getWeeklyView(@CurrentUser() u: JwtPayload, @Query("weekStart") weekStart: string) {
    return this.svc.getWeeklyView(u.companyId, weekStart);
  }

  @Get("missed")
  getMissedClocks(@CurrentUser() u: JwtPayload) {
    return this.svc.getMissedClocks(u.companyId);
  }

  @Get("qr-token")
  getQrToken(@CurrentUser() u: JwtPayload) {
    return this.svc.generateQrToken(u.companyId);
  }

  @Post("clock-qr")
  clockByQr(@Body() body: { token: string; employeeId: string; action: "in" | "out"; latitude?: number; longitude?: number }) {
    return this.svc.clockByQr(body);
  }

  @Delete(":id")
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.remove(u.companyId, id);
  }
}
