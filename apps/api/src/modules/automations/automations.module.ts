import { Module } from "@nestjs/common";
import { AutomationsController } from "./automations.controller";
import { AutomationsService } from "./automations.service";
import { EmailModule } from "../email/email.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [EmailModule, NotificationsModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
