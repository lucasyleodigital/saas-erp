import { Module } from "@nestjs/common";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";
import { EmailModule } from "../email/email.module";
import { AutomationsModule } from "../automations/automations.module";

@Module({
  imports: [EmailModule, AutomationsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
