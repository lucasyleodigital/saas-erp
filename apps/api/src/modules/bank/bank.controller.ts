import {
  Controller, Get, Post, Param, Query, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { BankService } from "./bank.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Bank")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("bank")
export class BankController {
  constructor(private bankService: BankService) {}

  @Get("accounts")
  getAccounts(@CurrentUser() u: JwtPayload) {
    return this.bankService.getAccounts(u.companyId);
  }

  @Get("accounts/:accountId/transactions")
  getTransactions(
    @CurrentUser() u: JwtPayload,
    @Param("accountId") accountId: string,
    @Query() params: any,
  ) {
    return this.bankService.getTransactions(u.companyId, accountId, params);
  }

  @Post("accounts/:accountId/import")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  importStatement(
    @CurrentUser() u: JwtPayload,
    @Param("accountId") accountId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No se ha adjuntado archivo");
    return this.bankService.importStatement(u.companyId, accountId, file.buffer);
  }
}
