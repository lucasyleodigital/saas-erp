import { Module } from "@nestjs/common";
import { DeliveryNotesService } from "./delivery-notes.service";
import { DeliveryNotesController, DeliveryNotesWebhookController } from "./delivery-notes.controller";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [InvoicesModule],
  controllers: [DeliveryNotesController, DeliveryNotesWebhookController],
  providers: [DeliveryNotesService],
  exports: [DeliveryNotesService],
})
export class DeliveryNotesModule {}
