import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Projects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("projects")
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll(@CurrentUser() u: JwtPayload, @Query() params: any) {
    return this.projectsService.findAll(u.companyId, params);
  }

  @Get(":id")
  findOne(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.projectsService.findOne(u.companyId, id);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() data: any) {
    return this.projectsService.create(u.companyId, data);
  }

  @Put(":id")
  update(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.projectsService.update(u.companyId, id, data);
  }

  @Delete(":id")
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.projectsService.remove(u.companyId, id);
  }

  @Get(":id/profitability")
  profitability(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.projectsService.profitability(u.companyId, id);
  }
}
