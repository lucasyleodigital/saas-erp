import { Module } from "@nestjs/common";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";
import { RecurringService } from "./recurring.service";
import { EmailModule } from "../email/email.module";
import { AutomationsModule } from "../automations/automations.module";
import { VerifactuModule } from "../verifactu/verifactu.module";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [EmailModule, AutomationsModule, VerifactuModule, BillingModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, RecurringService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
