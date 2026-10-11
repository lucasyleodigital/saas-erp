import { Module } from "@nestjs/common";
import { ExpenseClaimsController } from "./expense-claims.controller";
import { ExpenseClaimsService } from "./expense-claims.service";
import { AccountingModule } from "../accounting/accounting.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PayrollModule } from "../payroll/payroll.module";

@Module({
  imports: [AccountingModule, NotificationsModule, PayrollModule],
  controllers: [ExpenseClaimsController],
  providers: [ExpenseClaimsService],
})
export class ExpenseClaimsModule {}
