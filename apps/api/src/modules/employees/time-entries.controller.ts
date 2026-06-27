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
  clockIn(@CurrentUser() u: JwtPayload, @Body() body: { employeeId: string; projectId?: string }) {
    return this.svc.clockIn(u.companyId, body.employeeId, body.projectId);
  }

  @Post("clock-out")
  clockOut(@CurrentUser() u: JwtPayload, @Body() body: { employeeId: string; breakMinutes?: number }) {
    return this.svc.clockOut(u.companyId, body.employeeId, body.breakMinutes ?? 0);
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

  @Delete(":id")
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.remove(u.companyId, id);
  }
}
