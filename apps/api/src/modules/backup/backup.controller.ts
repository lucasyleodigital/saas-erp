import {
  Controller,
  Get,
  Res,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { BackupService } from "./backup.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Backup")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("backup")
export class BackupController {
  constructor(private backupService: BackupService) {}

  @Get()
  async downloadBackup(
    @CurrentUser() u: JwtPayload,
    @Res() res: Response,
  ) {
    if (!["OWNER", "ADMIN", "SUPER_ADMIN"].includes(u.role)) {
      throw new ForbiddenException(
        "Solo administradores pueden descargar backups",
      );
    }

    const data = await this.backupService.generateBackup(u.companyId);
    const json = JSON.stringify(data, null, 2);

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="youwhole-backup-${new Date().toISOString().split("T")[0]}.json"`,
    );
    res.send(json);
  }
}
