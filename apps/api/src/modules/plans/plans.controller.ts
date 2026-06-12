import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PlansService } from "./plans.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { SkipThrottle } from "@nestjs/throttler";
import type { JwtPayload } from "@saas/types";
import { PLAN_LIMITS, PLAN_PRICES } from "@saas/types";

@ApiTags("Plans")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("plans")
export class PlansController {
  constructor(private plansService: PlansService) {}

  /** Returns usage + limits for the current company */
  @Get("usage")
  getUsage(@CurrentUser() user: JwtPayload) {
    return this.plansService.getPlanInfo(user.companyId);
  }

  /** Returns all plan definitions (public pricing page data) */
  @SkipThrottle()
  @Get()
  getPlans() {
    return Object.entries(PLAN_LIMITS).map(([plan, limits]) => ({
      plan,
      ...PLAN_PRICES[plan as keyof typeof PLAN_PRICES],
      limits,
    }));
  }
}
