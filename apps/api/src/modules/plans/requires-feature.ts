import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { PlanLimits } from "@saas/types";
import { PlansService } from "./plans.service";

type BooleanFeature = {
  [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never;
}[keyof PlanLimits];

const FEATURE_KEY = "plan:requiredFeature";

// En el controlador fija la función del plan requerida; en una ruta la sustituye (null = sin requisito).
export const RequiresFeature = (feature: BooleanFeature | null) => SetMetadata(FEATURE_KEY, feature);

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(private reflector: Reflector, private plans: PlansService) {}

  async canActivate(ctx: ExecutionContext) {
    const feature = this.reflector.getAllAndOverride<BooleanFeature | null | undefined>(FEATURE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!feature) return true;
    const companyId = ctx.switchToHttp().getRequest().user?.companyId;
    if (!companyId) return true;
    await this.plans.requireFeature(companyId, feature);
    return true;
  }
}
