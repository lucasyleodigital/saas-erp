import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Verify2FADto } from "./dto/verify-2fa.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { CompaniesService } from "../companies/companies.service";
import type { JwtPayload } from "@saas/types";

const REFRESH_COOKIE = "refresh_token";
const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  // SameSite=None required for cross-origin cookies (Railway API → Vercel frontend)
  sameSite: IS_PROD ? ("none" as const) : ("lax" as const),
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
};
// auth_session is readable by Next.js middleware to protect routes
const SESSION_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: IS_PROD,
  sameSite: IS_PROD ? ("none" as const) : ("lax" as const),
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
};

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private companiesService: CompaniesService,
  ) {}

  // 5 attempts per minute per IP — brute force protection
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.register(dto);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.cookie("auth_session", "1", SESSION_COOKIE_OPTIONS);
    return { accessToken: tokens.accessToken };
  }

  // 10 attempts per minute per IP — brute force protection
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard("local"))
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as any;
    const tokens = await this.authService.login(user.id, user.email);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.cookie("auth_session", "1", SESSION_COOKIE_OPTIONS);
    return { accessToken: tokens.accessToken };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    const tokens = await this.authService.refresh(token);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    return { accessToken: tokens.accessToken };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) await this.authService.revokeRefreshToken(token);
    res.clearCookie(REFRESH_COOKIE);
    res.clearCookie("auth_session");
    return { message: "Sesión cerrada" };
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @Post("2fa/setup")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  setup2FA(@CurrentUser() user: JwtPayload) {
    return this.authService.setup2FA(user.sub);
  }

  @Post("2fa/verify")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  verify2FA(@CurrentUser() user: JwtPayload, @Body() dto: Verify2FADto) {
    return this.authService.verify2FA(user.sub, dto.token);
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleAuth() {}

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const user = req.user as any;
    const tokens = await this.authService.login(user.id, user.email);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.cookie("auth_session", "1", SESSION_COOKIE_OPTIONS);
    // Fragment (#) is never sent to the server or in Referer headers — safer than query param
    res.redirect(`${process.env.CLIENT_URL}/auth/callback#access_token=${tokens.accessToken}`);
  }

  // ─── INVITATIONS ──────────────────────────────────────────────────

  @Get("invite/:token")
  @SkipThrottle()
  getInvitation(@Param("token") token: string) {
    return this.companiesService.getInvitation(token);
  }

  @Post("invite/:token/accept")
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(
    @Param("token") token: string,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.companiesService.acceptInvitation(token, user.sub);
    // Issue new tokens with the new company context
    const tokens = await this.authService.login(user.sub, user.email, result.companyId);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.cookie("auth_session", "1", SESSION_COOKIE_OPTIONS);
    return { accessToken: tokens.accessToken, companyId: result.companyId };
  }
}
