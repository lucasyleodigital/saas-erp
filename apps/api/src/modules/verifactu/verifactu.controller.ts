import {
  Controller, Post, Get, Delete, Param, Body,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { VerifactuService } from "./verifactu.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("VeriFactu")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("verifactu")
export class VerifactuController {
  constructor(private verifactuService: VerifactuService) {}

  @Get("records")
  getAll(@CurrentUser() user: JwtPayload) {
    return this.verifactuService.getAll(user.companyId);
  }

  @Post("invoices/:invoiceId/generate")
  generate(@CurrentUser() user: JwtPayload, @Param("invoiceId") invoiceId: string) {
    return this.verifactuService.generateForInvoice(user.companyId, invoiceId);
  }

  @Get("invoices/:invoiceId/status")
  getStatus(@CurrentUser() user: JwtPayload, @Param("invoiceId") invoiceId: string) {
    return this.verifactuService.getStatus(user.companyId, invoiceId);
  }

  // ── Certificate ──────────────────────────────────────────────────────────

  @Get("certificate")
  getCertificate(@CurrentUser() user: JwtPayload) {
    return this.verifactuService.getCertificateInfo(user.companyId);
  }

  @Post("certificate")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("cert", {
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      if (file.originalname.match(/\.(p12|pfx)$/i)) {
        cb(null, true);
      } else {
        cb(new BadRequestException("Solo se aceptan archivos .p12 o .pfx"), false);
      }
    },
  }))
  saveCertificate(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body("password") password: string,
  ) {
    if (!file) throw new BadRequestException("No se ha adjuntado ningún certificado");
    if (!password) throw new BadRequestException("La contraseña del certificado es obligatoria");
    return this.verifactuService.saveCertificate(user.companyId, file.buffer, password);
  }

  @Delete("certificate")
  deleteCertificate(@CurrentUser() user: JwtPayload) {
    return this.verifactuService.deleteCertificate(user.companyId);
  }

  // ── Send to AEAT ──────────────────────────────────────────────────────────

  @Post("records/:id/send")
  sendToAeat(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.verifactuService.sendToAeat(user.companyId, id);
  }
}
