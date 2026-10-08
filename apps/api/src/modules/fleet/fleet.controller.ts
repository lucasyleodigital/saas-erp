import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { FleetService } from "./fleet.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Fleet")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("fleet")
export class FleetController {
  constructor(private fleetService: FleetService) {}

  @Get()
  findAll(@CurrentUser() u: JwtPayload, @Query() p: any) {
    return this.fleetService.findAll(u.companyId, p);
  }

  @Get(":id")
  findOne(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.fleetService.findOne(u.companyId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.fleetService.create(u.companyId, body);
  }

  @Patch(":id")
  update(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.fleetService.update(u.companyId, id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.fleetService.remove(u.companyId, id);
  }

  @Post(":vehicleId/maintenances")
  @HttpCode(HttpStatus.CREATED)
  createMaintenance(
    @CurrentUser() u: JwtPayload,
    @Param("vehicleId") vehicleId: string,
    @Body() body: any,
  ) {
    return this.fleetService.createMaintenance(u.companyId, vehicleId, body);
  }

  @Patch(":vehicleId/maintenances/:maintenanceId")
  updateMaintenance(
    @CurrentUser() u: JwtPayload,
    @Param("maintenanceId") maintenanceId: string,
    @Body() body: any,
  ) {
    return this.fleetService.updateMaintenance(u.companyId, maintenanceId, body);
  }

  @Delete(":vehicleId/maintenances/:maintenanceId")
  @HttpCode(HttpStatus.OK)
  removeMaintenance(
    @CurrentUser() u: JwtPayload,
    @Param("maintenanceId") maintenanceId: string,
  ) {
    return this.fleetService.removeMaintenance(u.companyId, maintenanceId);
  }
}
