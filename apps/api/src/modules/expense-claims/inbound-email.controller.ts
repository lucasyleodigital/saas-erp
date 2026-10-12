import { Body, Controller, Headers, HttpCode, HttpStatus, Post, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiExcludeController } from "@nestjs/swagger";
import { ExpenseClaimsService } from "./expense-claims.service";

// Llamado por el Email Worker de Cloudflare (apps/email-worker) con la clave compartida INBOUND_EMAIL_SECRET
@ApiExcludeController()
@Controller("inbound")
export class InboundEmailController {
  constructor(private service: ExpenseClaimsService) {}

  @Post("expense-email")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor("attachments", 5, { limits: { fileSize: 10 * 1024 * 1024 } }))
  receive(
    @Headers("x-inbound-secret") secret: string | undefined,
    @Body() body: { to?: string; from?: string; headerFrom?: string; subject?: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    this.service.verifyInboundSecret(secret);
    return this.service.processInboundEmail(body ?? {}, files ?? []);
  }
}
