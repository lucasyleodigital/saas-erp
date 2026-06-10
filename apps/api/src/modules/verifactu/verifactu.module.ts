import { Module } from "@nestjs/common";
import { VerifactuController } from "./verifactu.controller";
import { VerifactuService } from "./verifactu.service";

@Module({
  controllers: [VerifactuController],
  providers: [VerifactuService],
  exports: [VerifactuService],
})
export class VerifactuModule {}
