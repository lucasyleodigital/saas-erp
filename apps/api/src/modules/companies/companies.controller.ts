import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CompaniesService } from "./companies.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import type { JwtPayload } from "@saas/types";

function requireAdminOrOwner(role: string) {
  if (!["OWNER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    throw new ForbiddenException("Se requiere rol de Administrador o Propietario");
  }
}

@ApiTags("Companies")
@UseGuards(JwtAuthGuard)
@Controller("companies")
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get("me")
  getMyCompany(@CurrentUser() user: JwtPayload) {
    return this.companiesService.findOne(user.companyId);
  }

  @Put("me")
  updateMyCompany(@CurrentUser() user: JwtPayload, @Body() body: UpdateCompanyDto) {
    requireAdminOrOwner(user.role);
    return this.companiesService.update(user.companyId, body);
  }

  // ─── TEAM ─────────────────────────────────────────────────────────

  @Get("members")
  getMembers(@CurrentUser() user: JwtPayload) {
    return this.companiesService.getMembers(user.companyId);
  }

  @Post("invite")
  inviteMember(@CurrentUser() user: JwtPayload, @Body() body: { email: string; role: string }) {
    requireAdminOrOwner(user.role);
    return this.companiesService.inviteMember(user.companyId, user.sub, body.email, body.role);
  }

  @Patch("members/:id/role")
  updateRole(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: { role: string },
  ) {
    requireAdminOrOwner(user.role);
    return this.companiesService.updateMemberRole(user.companyId, id, body.role, user.role);
  }

  @Delete("members/:id")
  removeMember(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    requireAdminOrOwner(user.role);
    return this.companiesService.removeMember(user.companyId, id);
  }

  @Delete("invitations/:id")
  cancelInvitation(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    requireAdminOrOwner(user.role);
    return this.companiesService.cancelInvitation(user.companyId, id);
  }
}
