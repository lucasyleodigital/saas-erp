import { Module } from "@nestjs/common";
import { EmployeesService } from "./employees.service";
import { EmployeesController } from "./employees.controller";
import { TimeEntriesService } from "./time-entries.service";
import { TimeEntriesController } from "./time-entries.controller";
import { EmployeePortalController } from "./employee-portal.controller";
import { EmployeeDashboardController } from "./employee-dashboard.controller";

@Module({
  controllers: [EmployeesController, TimeEntriesController, EmployeePortalController, EmployeeDashboardController],
  providers: [EmployeesService, TimeEntriesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
