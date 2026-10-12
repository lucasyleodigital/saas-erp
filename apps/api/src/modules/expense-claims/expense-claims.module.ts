import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ExpenseClaimsController } from "./expense-claims.controller";
import { InboundEmailController } from "./inbound-email.controller";
import { ExpenseClaimsService } from "./expense-claims.service";
import { AccountingModule } from "../accounting/accounting.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PayrollModule } from "../payroll/payroll.module";
import { FiscalModule } from "../fiscal/fiscal.module";

@Module({
  imports: [ConfigModule, AccountingModule, NotificationsModule, PayrollModule, FiscalModule],
  controllers: [ExpenseClaimsController, InboundEmailController],
  providers: [ExpenseClaimsService],
})
export class ExpenseClaimsModule {}
