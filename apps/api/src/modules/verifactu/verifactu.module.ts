import { Module } from "@nestjs/common";
import { VerifactuController } from "./verifactu.controller";
import { VerifactuService } from "./verifactu.service";
import { VerifactuQueueService } from "./verifactu-queue.service";

@Module({
  controllers: [VerifactuController],
  providers: [VerifactuService, VerifactuQueueService],
  exports: [VerifactuService],
})
export class VerifactuModule {}
