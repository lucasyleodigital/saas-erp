import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FiscalController } from "./fiscal.controller";
import { FiscalService } from "./fiscal.service";

@Module({
  imports: [ConfigModule],
  controllers: [FiscalController],
  providers: [FiscalService],
  exports: [FiscalService],
})
export class FiscalModule {}
