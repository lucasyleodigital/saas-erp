import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CompaniesService } from "./companies.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Companies")
@UseGuards(JwtAuthGuard)
@Controller("companies")
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get("me")
  getMyCompany(@CurrentUser() user: JwtPayload) {
    return this.companiesService.findOne(user.companyId);
  }

  @Put("me")
  updateMyCompany(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.companiesService.update(user.companyId, body);
  }
}
