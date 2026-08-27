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
import { CheckoutDto } from "./dto/checkout.dto";
import { PortalDto } from "./dto/portal.dto";
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
    @Body() body: CheckoutDto
  ) {
    return this.billingService.createCheckoutSession(
      user.companyId,
      user.sub,
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
    @Body() body: PortalDto
  ) {
    return this.billingService.createPortalSession(
      user.companyId,
      body.returnUrl,
      body.cancelSubscription
    );
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
