import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
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
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PurchaseOrdersModule } from "./modules/purchase-orders/purchase-orders.module";
import { SearchModule } from "./modules/search/search.module";
import { ExportModule } from "./modules/export/export.module";
import { BankModule } from "./modules/bank/bank.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { AdminModule } from "./modules/admin/admin.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { CustomFieldsModule } from "./modules/custom-fields/custom-fields.module";
import { BackupModule } from "./modules/backup/backup.module";
import { AssistantModule } from "./modules/assistant/assistant.module";
import { CurrencyModule } from "./modules/currency/currency.module";
import { AuditModule } from "./modules/audit/audit.module";
import { DatabaseModule } from "./database/database.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
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
    SuppliersModule,
    OrdersModule,
    PurchaseOrdersModule,
    SearchModule,
    ExportModule,
    BankModule,
    WebhooksModule,
    AdminModule,
    ProjectsModule,
    CustomFieldsModule,
    BackupModule,
    AssistantModule,
    CurrencyModule,
    AuditModule,
  ],
  providers: [
    // Apply rate limiting globally to ALL routes
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
