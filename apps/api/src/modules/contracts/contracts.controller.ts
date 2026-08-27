import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { ContractsService } from "./contracts.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Contracts")
@Controller("contracts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.contractsService.listForCompany(user.companyId);
  }

  @Get(":id")
  getOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.contractsService.getOne(user.companyId, id);
  }

  @Get(":id/pdf")
  async getPdf(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const { buffer, filename } = await this.contractsService.getPdf(user.companyId, id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
