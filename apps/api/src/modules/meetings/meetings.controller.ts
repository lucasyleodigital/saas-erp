import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { MeetingsService } from "./meetings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Meetings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("meetings")
export class MeetingsController {
  constructor(private meetingsService: MeetingsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() params: any) {
    return this.meetingsService.findAll(user.companyId, params);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.meetingsService.findOne(user.companyId, id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.meetingsService.create(user.companyId, user.sub, body);
  }

  @Put(":id")
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: any) {
    return this.meetingsService.update(user.companyId, id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.meetingsService.remove(user.companyId, id);
  }
}
