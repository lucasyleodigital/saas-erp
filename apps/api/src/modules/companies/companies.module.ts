import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CompaniesController } from "./companies.controller";
import { CompaniesService } from "./companies.service";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [EmailModule, ConfigModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
