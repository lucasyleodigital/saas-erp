import { Module } from "@nestjs/common";
import { QuotesController } from "./quotes.controller";
import { QuotesService } from "./quotes.service";
import { EmailModule } from "../email/email.module";
import { AutomationsModule } from "../automations/automations.module";

@Module({
  imports: [EmailModule, AutomationsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
