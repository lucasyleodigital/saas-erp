import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Dashboard")
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("stats")
  getStats(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getStats(user.companyId);
  }

  @Get("revenue-chart")
  getRevenueChart(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getRevenueChart(user.companyId);
  }

  @Get("recent-invoices")
  getRecentInvoices(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getRecentInvoices(user.companyId);
  }

  @Get("top-clients")
  getTopClients(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getTopClients(user.companyId);
  }
}
