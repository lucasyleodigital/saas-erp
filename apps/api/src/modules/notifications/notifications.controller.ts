import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";
import type { JwtPayload } from "@saas/types";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: any) {
    return this.service.findAll(user.companyId, user.sub, query);
  }

  @Get("unread-count")
  countUnread(@CurrentUser() user: JwtPayload) {
    return this.service.countUnread(user.companyId, user.sub);
  }

  @Patch(":id/read")
  markRead(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.service.markRead(user.companyId, id);
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.service.markAllRead(user.companyId, user.sub);
  }

  @Delete("clear-read")
  deleteRead(@CurrentUser() user: JwtPayload) {
    return this.service.deleteRead(user.companyId);
  }
}
