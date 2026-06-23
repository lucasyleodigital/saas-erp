import { Module } from "@nestjs/common";
import { EmployeesService } from "./employees.service";
import { EmployeesController } from "./employees.controller";
import { TimeEntriesService } from "./time-entries.service";
import { TimeEntriesController } from "./time-entries.controller";

@Module({
  controllers: [EmployeesController, TimeEntriesController],
  providers: [EmployeesService, TimeEntriesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
