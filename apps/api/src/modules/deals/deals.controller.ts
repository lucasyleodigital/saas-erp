import { Controller, Get, Post, Put, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DealsService } from "./deals.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Deals")
@UseGuards(JwtAuthGuard)
@Controller("deals")
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Get("pipeline")
  getPipeline(@CurrentUser() user: JwtPayload) {
    return this.dealsService.getPipelineView(user.companyId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.dealsService.create(user.companyId, body);
  }

  @Put(":id/stage")
  moveStage(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body("stageId") stageId: string) {
    return this.dealsService.moveStage(user.companyId, id, stageId);
  }

  @Put(":id")
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.dealsService.update(user.companyId, id, body);
  }
}
