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
import { EmployeesService } from "./employees.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Employees")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("employees")
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  // ─── Employees ─────────────────────────────────────────────

  @Get("stats")
  getStats(@CurrentUser() u: JwtPayload) {
    return this.employeesService.getStats(u.companyId);
  }

  @Get()
  findAll(@CurrentUser() u: JwtPayload, @Query() p: any) {
    return this.employeesService.findAll(u.companyId, p);
  }

  @Get(":id")
  findOne(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.employeesService.findOne(u.companyId, id);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() b: any) {
    return this.employeesService.create(u.companyId, b);
  }

  @Patch(":id")
  update(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.employeesService.update(u.companyId, id, b);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.employeesService.remove(u.companyId, id);
  }

  // ─── Time Entries ───────────────────────────────────────────

  @Get(":id/time-entries")
  getTimeEntries(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Query() p: any,
  ) {
    return this.employeesService.getTimeEntries(u.companyId, id, p);
  }

  @Post(":id/clock-in")
  @HttpCode(HttpStatus.CREATED)
  clockIn(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.employeesService.clockIn(u.companyId, id, b);
  }

  @Patch("time-entries/:entryId/clock-out")
  clockOut(
    @CurrentUser() u: JwtPayload,
    @Param("entryId") entryId: string,
    @Body() b: any,
  ) {
    return this.employeesService.clockOut(u.companyId, entryId, b);
  }

  // ─── Leave Requests ─────────────────────────────────────────

  @Get("leave-requests/all")
  getLeaveRequests(@CurrentUser() u: JwtPayload, @Query() p: any) {
    return this.employeesService.getLeaveRequests(u.companyId, p);
  }

  @Post(":id/leave-requests")
  @HttpCode(HttpStatus.CREATED)
  createLeaveRequest(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.employeesService.createLeaveRequest(u.companyId, id, b);
  }

  @Patch("leave-requests/:requestId/approve")
  approveLeave(
    @CurrentUser() u: JwtPayload,
    @Param("requestId") requestId: string,
  ) {
    return this.employeesService.updateLeaveStatus(u.companyId, requestId, "APPROVED", u.sub);
  }

  @Patch("leave-requests/:requestId/reject")
  rejectLeave(
    @CurrentUser() u: JwtPayload,
    @Param("requestId") requestId: string,
  ) {
    return this.employeesService.updateLeaveStatus(u.companyId, requestId, "REJECTED", u.sub);
  }

  @Delete("leave-requests/:requestId")
  @HttpCode(HttpStatus.OK)
  deleteLeaveRequest(
    @CurrentUser() u: JwtPayload,
    @Param("requestId") requestId: string,
  ) {
    return this.employeesService.deleteLeaveRequest(u.companyId, requestId);
  }

  @Post(":id/generate-clock-token")
  async generateClockToken(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.employeesService.generateClockToken(u.companyId, id);
  }

  @Post(":id/activate-portal")
  async activatePortal(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body("password") password: string,
  ) {
    if (!password || password.length < 8) {
      throw new (require("@nestjs/common").BadRequestException)("La contrasena debe tener minimo 8 caracteres");
    }
    return this.employeesService.activatePortalAccess(u.companyId, id, password);
  }

  @Get(":id/portal-credentials")
  getPortalCredentials(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.employeesService.getPortalCredentials(u.companyId, id);
  }

  @Post(":id/reset-portal-password")
  resetPortalPassword(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body("password") password: string) {
    if (!password || password.length < 8) {
      throw new (require("@nestjs/common").BadRequestException)("Minimo 8 caracteres");
    }
    return this.employeesService.resetPortalPassword(u.companyId, id, password);
  }
}
