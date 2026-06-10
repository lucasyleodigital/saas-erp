import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./modules/auth/auth.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { UsersModule } from "./modules/users/users.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { ProductsModule } from "./modules/products/products.module";
import { DealsModule } from "./modules/deals/deals.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { VerifactuModule } from "./modules/verifactu/verifactu.module";
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
    AuthModule,
    CompaniesModule,
    UsersModule,
    ClientsModule,
    InvoicesModule,
    ProductsModule,
    DealsModule,
    DashboardModule,
    VerifactuModule,
  ],
})
export class AppModule {}
