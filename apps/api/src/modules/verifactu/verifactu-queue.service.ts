import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { VerifactuService } from "./verifactu.service";

// Envía a la AEAT, cada pocos segundos, los registros pendientes de las empresas con VERI*FACTU activado
@Injectable()
export class VerifactuQueueService {
  constructor(private verifactu: VerifactuService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async tick() {
    if (process.env.VERIFACTU_QUEUE === "off") return;
    await this.verifactu.processQueue();
  }
}
