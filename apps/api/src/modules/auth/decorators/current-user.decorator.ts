import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "@saas/types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
