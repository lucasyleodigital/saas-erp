import {
  Controller, Get, Post, Delete, Param, Query, Body, UseGuards,
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

  @Post("accounts")
  createAccount(@CurrentUser() u: JwtPayload, @Body() body: { name: string; iban?: string; bic?: string }) {
    return this.bankService.createAccount(u.companyId, body);
  }

  @Delete("accounts/:accountId")
  deleteAccount(@CurrentUser() u: JwtPayload, @Param("accountId") accountId: string) {
    return this.bankService.deleteAccount(u.companyId, accountId);
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

  @Delete("accounts/:accountId/transactions/:txId")
  deleteTransaction(
    @CurrentUser() u: JwtPayload,
    @Param("accountId") accountId: string,
    @Param("txId") txId: string,
  ) {
    return this.bankService.deleteTransaction(u.companyId, accountId, txId);
  }

  @Delete("accounts/:accountId/transactions")
  clearTransactions(
    @CurrentUser() u: JwtPayload,
    @Param("accountId") accountId: string,
  ) {
    return this.bankService.clearTransactions(u.companyId, accountId);
  }
}
