import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AutomationsService } from "./automations.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Automations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("automations")
export class AutomationsController {
  constructor(private svc: AutomationsService) {}

  @Get()
  findAll(@CurrentUser() u: JwtPayload) {
    return this.svc.findAll(u.companyId);
  }

  @Get("stats")
  stats(@CurrentUser() u: JwtPayload) {
    return this.svc.getStats(u.companyId);
  }

  @Get("logs")
  getLogs(@CurrentUser() u: JwtPayload, @Query("automationId") automationId?: string) {
    return this.svc.getLogs(u.companyId, automationId);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.svc.create(u.companyId, body);
  }

  @Post(":id/test")
  @HttpCode(HttpStatus.OK)
  test(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.testAutomation(u.companyId, id);
  }

  @Patch(":id")
  update(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.svc.update(u.companyId, id, body);
  }

  @Patch(":id/toggle")
  toggle(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.toggle(u.companyId, id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.remove(u.companyId, id);
  }
}
