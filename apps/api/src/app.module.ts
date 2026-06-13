import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { PlansModule } from "./modules/plans/plans.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { UsersModule } from "./modules/users/users.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { ProductsModule } from "./modules/products/products.module";
import { DealsModule } from "./modules/deals/deals.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { VerifactuModule } from "./modules/verifactu/verifactu.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { QuotesModule } from "./modules/quotes/quotes.module";
import { DeliveryNotesModule } from "./modules/delivery-notes/delivery-notes.module";
import { ImportModule } from "./modules/import/import.module";
import { EmployeesModule } from "./modules/employees/employees.module";
import { PayrollModule } from "./modules/payroll/payroll.module";
import { PortalModule } from "./modules/portal/portal.module";
import { BillingModule } from "./modules/billing/billing.module";
import { EmailModule } from "./modules/email/email.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { AccountingModule } from "./modules/accounting/accounting.module";
import { AutomationsModule } from "./modules/automations/automations.module";
import { DatabaseModule } from "./database/database.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      { name: "short", ttl: 1000, limit: 20 },
      { name: "medium", ttl: 60000, limit: 200 },
    ]),
    DatabaseModule,
    PlansModule,
    AuthModule,
    CompaniesModule,
    UsersModule,
    ClientsModule,
    InvoicesModule,
    ProductsModule,
    DealsModule,
    DashboardModule,
    VerifactuModule,
    LeadsModule,
    QuotesModule,
    DeliveryNotesModule,
    ImportModule,
    EmployeesModule,
    PayrollModule,
    PortalModule,
    BillingModule,
    EmailModule,
    NotificationsModule,
    InventoryModule,
    AccountingModule,
    AutomationsModule,
  ],
  providers: [
    // Apply rate limiting globally to ALL routes
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
