import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CustomFieldsService } from "./custom-fields.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Custom Fields")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("custom-fields")
export class CustomFieldsController {
  constructor(private customFieldsService: CustomFieldsService) {}

  @Get()
  findAll(
    @CurrentUser() u: JwtPayload,
    @Query("entity") entity?: string,
  ) {
    return this.customFieldsService.findAll(u.companyId, entity);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() data: any) {
    return this.customFieldsService.create(u.companyId, data);
  }

  @Put(":id")
  update(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.customFieldsService.update(u.companyId, id, data);
  }

  @Delete(":id")
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.customFieldsService.remove(u.companyId, id);
  }
}
