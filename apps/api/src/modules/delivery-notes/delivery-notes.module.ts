import { Module } from "@nestjs/common";
import { DeliveryNotesService } from "./delivery-notes.service";
import { DeliveryNotesController } from "./delivery-notes.controller";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [InvoicesModule],
  controllers: [DeliveryNotesController],
  providers: [DeliveryNotesService],
  exports: [DeliveryNotesService],
})
export class DeliveryNotesModule {}
