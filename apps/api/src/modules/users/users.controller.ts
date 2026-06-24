import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import type { JwtPayload } from "@saas/types";

@ApiTags("Users")
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.usersService.findAllInCompany(user.companyId);
  }

  @Put("profile")
  updateProfile(@CurrentUser() user: JwtPayload, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, body);
  }

  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Put("password")
  changePassword(@CurrentUser() user: JwtPayload, @Body() body: ChangePasswordDto) {
    return this.usersService.changePassword(user.sub, body.currentPassword, body.newPassword);
  }
}
