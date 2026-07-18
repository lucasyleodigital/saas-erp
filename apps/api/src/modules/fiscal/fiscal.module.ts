import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FiscalController } from "./fiscal.controller";
import { FiscalService } from "./fiscal.service";
import { AccountingModule } from "../accounting/accounting.module";

@Module({
  imports: [ConfigModule, AccountingModule],
  controllers: [FiscalController],
  providers: [FiscalService],
  exports: [FiscalService],
})
export class FiscalModule {}
