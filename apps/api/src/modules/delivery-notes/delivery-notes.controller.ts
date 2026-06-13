import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { DeliveryNotesService } from "./delivery-notes.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("DeliveryNotes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("delivery-notes")
export class DeliveryNotesController {
  constructor(private deliveryNotesService: DeliveryNotesService) {}

  @Get()
  findAll(@CurrentUser() u: JwtPayload, @Query() p: any) {
    return this.deliveryNotesService.findAll(u.companyId, p);
  }

  @Get(":id")
  findOne(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.deliveryNotesService.findOne(u.companyId, id);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() b: any) {
    return this.deliveryNotesService.create(u.companyId, b);
  }

  @Patch(":id")
  update(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.deliveryNotesService.update(u.companyId, id, b);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() u: JwtPayload,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.deliveryNotesService.updateStatus(u.companyId, id, status);
  }

  @Post(":id/convert-to-invoice")
  @HttpCode(HttpStatus.CREATED)
  convertToInvoice(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.deliveryNotesService.convertToInvoice(u.companyId, id);
  }

  @Post("from-quote/:quoteId")
  @HttpCode(HttpStatus.CREATED)
  createFromQuote(
    @CurrentUser() u: JwtPayload,
    @Param("quoteId") quoteId: string,
  ) {
    return this.deliveryNotesService.createFromQuote(u.companyId, quoteId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.deliveryNotesService.remove(u.companyId, id);
  }
}
