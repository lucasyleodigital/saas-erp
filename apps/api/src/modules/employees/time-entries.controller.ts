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

  @Delete(":id")
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.remove(u.companyId, id);
  }
}
