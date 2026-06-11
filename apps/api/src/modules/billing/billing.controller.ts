import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Headers,
  RawBodyRequest,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { BillingService } from "./billing.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "@saas/types";

@ApiTags("Billing")
@Controller("billing")
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post("checkout")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  checkout(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      plan: "STARTER" | "PRO" | "ENTERPRISE";
      successUrl: string;
      cancelUrl: string;
    }
  ) {
    return this.billingService.createCheckoutSession(
      user.companyId,
      body.plan,
      body.successUrl,
      body.cancelUrl
    );
  }

  @Post("portal")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  portal(
    @CurrentUser() user: JwtPayload,
    @Body("returnUrl") returnUrl: string
  ) {
    return this.billingService.createPortalSession(user.companyId, returnUrl);
  }

  // Stripe sends raw body — must NOT be guarded or transformed
  @Post("webhook")
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") sig: string
  ) {
    return this.billingService.handleWebhook(req.rawBody!, sig);
  }
}
