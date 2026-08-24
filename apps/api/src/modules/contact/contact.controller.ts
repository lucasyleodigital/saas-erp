import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import { ContactService } from "./contact.service";
import { ContactDto } from "./dto/contact.dto";

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
}
