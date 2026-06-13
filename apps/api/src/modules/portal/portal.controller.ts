import {
  Controller, Get, Post, Param, Body, Query, UseGuards, Req, HttpCode,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PortalService } from "./portal.service";

@Controller("portal")
export class PortalController {
  constructor(private readonly service: PortalService) {}

  // ── Authenticated — static prefix "manage" avoids clashing with /:token ──

  @Post("manage/:clientId/token")
  @UseGuards(JwtAuthGuard)
  generateToken(@Req() req: any, @Param("clientId") clientId: string) {
    return this.service.generatePortalToken(req.user.companyId, clientId);
  }

  @Post("manage/:clientId/refresh")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  refreshToken(@Req() req: any, @Param("clientId") clientId: string) {
    return this.service.refreshPortalToken(req.user.companyId, clientId);
  }

  @Post("manage/:clientId/revoke")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  revokeToken(@Req() req: any, @Param("clientId") clientId: string) {
    return this.service.revokePortalToken(req.user.companyId, clientId);
  }

  // ── Public ────────────────────────────────────────────────────────────────

  @Get(":token")
  getPortalData(@Param("token") token: string) {
    return this.service.getPortalData(token);
  }

  @Post(":token/pay/:invoiceId")
  @HttpCode(200)
  createPayment(
    @Param("token") token: string,
    @Param("invoiceId") invoiceId: string,
    @Body() dto: { successUrl: string; cancelUrl: string },
  ) {
    return this.service.createPaymentSession(token, invoiceId, dto.successUrl, dto.cancelUrl);
  }

  @Post(":token/verify-payment")
  @HttpCode(200)
  verifyPayment(
    @Param("token") token: string,
    @Body() dto: { invoiceId: string; sessionId: string },
  ) {
    return this.service.verifyPayment(token, dto.invoiceId, dto.sessionId);
  }

  @Post(":token/quotes/:quoteId/accept")
  @HttpCode(200)
  acceptQuote(@Param("token") token: string, @Param("quoteId") quoteId: string) {
    return this.service.acceptQuote(token, quoteId);
  }

  @Post(":token/quotes/:quoteId/reject")
  @HttpCode(200)
  rejectQuote(@Param("token") token: string, @Param("quoteId") quoteId: string) {
    return this.service.rejectQuote(token, quoteId);
  }
}
