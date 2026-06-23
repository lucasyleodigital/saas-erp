import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Audit")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("audit")
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll(@CurrentUser() u: JwtPayload, @Query() params: any) {
    if (!["OWNER", "ADMIN", "SUPER_ADMIN"].includes(u.role)) {
      throw new ForbiddenException(
        "Solo administradores pueden ver el registro de auditoria",
      );
    }
    return this.auditService.findAll(u.companyId, params);
  }
}
