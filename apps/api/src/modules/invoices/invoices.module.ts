import { Module } from "@nestjs/common";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [EmailModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
