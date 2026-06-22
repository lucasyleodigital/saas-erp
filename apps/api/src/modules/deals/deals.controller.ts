import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { DealsService } from "./deals.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateDealDto } from "./dto/create-deal.dto";
import { UpdateDealDto } from "./dto/update-deal.dto";
import type { JwtPayload } from "@saas/types";

class CreatePipelineDto {
  @IsOptional()
  @IsString()
  name?: string;
}

@ApiTags("Deals")
@UseGuards(JwtAuthGuard)
@Controller("deals")
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Get("pipeline")
  getPipeline(@CurrentUser() user: JwtPayload) {
    return this.dealsService.getPipelineView(user.companyId);
  }

  @Post("pipeline")
  createPipeline(@CurrentUser() user: JwtPayload, @Body() body: CreatePipelineDto) {
    return this.dealsService.createPipeline(user.companyId, body.name ?? "Pipeline de ventas");
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateDealDto) {
    return this.dealsService.create(user.companyId, body);
  }

  @Put(":id/stage")
  moveStage(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body("stageId") stageId: string) {
    return this.dealsService.moveStage(user.companyId, id, stageId);
  }

  @Put(":id")
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: UpdateDealDto) {
    return this.dealsService.update(user.companyId, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.dealsService.remove(user.companyId, id);
  }
}
