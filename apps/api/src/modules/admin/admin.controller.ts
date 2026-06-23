import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("admin")
export class AdminController {
  constructor(private svc: AdminService) {}

  @Get("dashboard")
  getDashboard(@CurrentUser() u: JwtPayload) {
    this.svc.assertSuperAdmin(u.role);
    return this.svc.getDashboard();
  }

  @Get("companies")
  listCompanies(@CurrentUser() u: JwtPayload, @Query() params: any) {
    this.svc.assertSuperAdmin(u.role);
    return this.svc.listCompanies({ page: Number(params.page) || 1, search: params.search });
  }

  @Get("companies/:id")
  getCompany(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    this.svc.assertSuperAdmin(u.role);
    return this.svc.getCompanyDetail(id);
  }

  @Post("companies/:id/impersonate")
  impersonate(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    this.svc.assertSuperAdmin(u.role);
    return this.svc.impersonate(id, u.sub);
  }

  @Patch("companies/:id/plan")
  updatePlan(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body("plan") plan: string) {
    this.svc.assertSuperAdmin(u.role);
    return this.svc.updateCompanyPlan(id, plan);
  }

  @Patch("companies/:id/toggle-active")
  toggleActive(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    this.svc.assertSuperAdmin(u.role);
    return this.svc.toggleCompanyActive(id);
  }
}
