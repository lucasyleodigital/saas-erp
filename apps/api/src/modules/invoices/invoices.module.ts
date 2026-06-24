import { Module } from "@nestjs/common";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";
import { RecurringService } from "./recurring.service";
import { OverdueService } from "./overdue.service";
import { CalendarController } from "./calendar.controller";
import { EmailModule } from "../email/email.module";
import { AutomationsModule } from "../automations/automations.module";
import { VerifactuModule } from "../verifactu/verifactu.module";
import { BillingModule } from "../billing/billing.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [EmailModule, AutomationsModule, VerifactuModule, BillingModule, NotificationsModule, AuditModule],
  controllers: [InvoicesController, CalendarController],
  providers: [InvoicesService, RecurringService, OverdueService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
