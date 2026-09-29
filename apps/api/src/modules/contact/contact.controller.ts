import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ContactService } from "./contact.service";
import { ContactDto } from "./dto/contact.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Contact")
@Controller("contact")
export class ContactController {
  constructor(private contact: ContactService) {}

  // 3 messages per minute per IP — public unauthenticated endpoint, spam/abuse protection
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @Post()
  @HttpCode(HttpStatus.OK)
  submit(@Body() dto: ContactDto) {
    return this.contact.submit(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("feedback")
  @HttpCode(HttpStatus.OK)
  feedback(
    @CurrentUser() u: JwtPayload,
    @Body("rating") rating: number,
    @Body("comment") comment: string,
  ) {
    return this.contact.submitFeedback(rating, comment ?? "", u.email ?? "", u.companyId);
  }
}
