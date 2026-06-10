import { Controller, Post, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { VerifactuService } from "./verifactu.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("VeriFactu")
@UseGuards(JwtAuthGuard)
@Controller("verifactu")
export class VerifactuController {
  constructor(private verifactuService: VerifactuService) {}

  @Post("invoices/:invoiceId/generate")
  generate(@CurrentUser() user: JwtPayload, @Param("invoiceId") invoiceId: string) {
    return this.verifactuService.generateForInvoice(user.companyId, invoiceId);
  }

  @Get("invoices/:invoiceId/status")
  getStatus(@CurrentUser() user: JwtPayload, @Param("invoiceId") invoiceId: string) {
    return this.verifactuService.getStatus(user.companyId, invoiceId);
  }
}
