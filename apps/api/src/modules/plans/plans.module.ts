import { Module, Global } from "@nestjs/common";
import { PlansService } from "./plans.service";
import { PlansController } from "./plans.controller";

@Global() // Available everywhere without re-importing
@Module({
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
