import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { WebhooksService } from "./webhooks.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Webhooks")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("webhooks")
export class WebhooksController {
  constructor(private svc: WebhooksService) {}

  @Get()
  getEndpoints(@CurrentUser() u: JwtPayload) {
    return this.svc.getEndpoints(u.companyId);
  }

  @Put()
  saveEndpoints(@CurrentUser() u: JwtPayload, @Body() body: { webhooks: Array<{ url: string; events: string[]; active: boolean }> }) {
    return this.svc.saveEndpoints(u.companyId, body.webhooks);
  }

  @Get("events")
  getEvents() {
    return this.svc.getAvailableEvents();
  }
}
