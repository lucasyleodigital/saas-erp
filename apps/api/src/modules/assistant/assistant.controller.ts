import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AssistantService } from "./assistant.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Assistant")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("assistant")
export class AssistantController {
  constructor(private assistantService: AssistantService) {}

  @Post("chat")
  chat(
    @CurrentUser() u: JwtPayload,
    @Body() body: { message: string },
  ) {
    return this.assistantService.chat(u.companyId, body.message);
  }
}
