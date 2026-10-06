import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as speakeasy from "speakeasy";
import { PrismaService } from "../../database/prisma.service";
import { EmailService } from "../email/email.service";
import { ContractsService } from "../contracts/contracts.service";
import { RegisterDto } from "./dto/register.dto";
import type { JwtPayload, AuthTokens } from "@saas/types";

export type LoginResult =
  | (AuthTokens & { requires2FA?: false })
  | { requires2FA: true; pendingToken: string };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
    private contracts: ContractsService
  ) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  async verifyRecaptcha(token: string | undefined): Promise<void> {
    const secret = this.config.get<string>("RECAPTCHA_SECRET_KEY");
    if (!secret || !token) return; // graceful skip in dev / no key configured
    try {
      const res = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
        { method: "POST" }
      );
      const json = (await res.json()) as { success: boolean; score?: number };
      if (!json.success || (json.score !== undefined && json.score < 0.5)) {
        throw new BadRequestException("Verificación reCAPTCHA fallida. Inténtalo de nuevo.");
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      // Network issues → allow through rather than block legitimate users
    }
  }

  async register(dto: RegisterDto, ipAddress: string | null, recaptchaToken?: string) {
    await this.verifyRecaptcha(recaptchaToken);

    if (!dto.acceptTerms) {
      throw new BadRequestException("Debes aceptar los Términos y Condiciones para registrarte");
    }

    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException("El email ya está registrado");

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        email: dto.email,
        users: {
          create: { userId: user.id, role: "OWNER", isDefault: true },
        },
      },
    });

    // Every company needs a default invoice series to ever create an
    // invoice — there is no endpoint to create one later, so this must
    // happen at signup. Awaited: a company with no series is unusable.
    const seriesYear = new Date().getFullYear();
    await this.prisma.invoiceSeries.create({
      data: {
        companyId: company.id,
        name: `Facturas ${seriesYear}`,
        prefix: `F-${seriesYear}-`,
        nextNumber: 1,
        isDefault: true,
      },
    });

    // Seed default pipeline for new companies (fire-and-forget, non-blocking)
    this.prisma.pipeline.create({
      data: {
        companyId: company.id,
        name: "Pipeline de ventas",
        isDefault: true,
        stages: {
          create: [
            { name: "Lead",         order: 0, color: "#3b82f6" },
            { name: "Cualificado",  order: 1, color: "#6366f1" },
            { name: "Propuesta",    order: 2, color: "#8b5cf6" },
            { name: "Negociación",  order: 3, color: "#a855f7" },
            { name: "Ganado",       order: 4, color: "#10b981" },
            { name: "Perdido",      order: 5, color: "#6b7280" },
          ],
        },
      },
    }).catch(() => {});

    // Contract acceptance is the legal record of signup — awaited, not
    // fire-and-forget, so a failure here surfaces instead of silently
    // leaving a customer without a stored/emailed contract.
    await this.contracts.recordAcceptance({
      companyId: company.id,
      userId: user.id,
      plan: "FREE",
      price: 0,
      ipAddress,
    });

    const tokens = await this.generateTokens(user.id, user.email, company.id, "OWNER");

    // Send welcome email (fire-and-forget)
    this.email
      .sendWelcome(user.email, dto.firstName, dto.companyName)
      .catch((err) => console.error("[EMAIL] Welcome email failed:", err?.message ?? err));

    // Notify YouWhole team of new signup (fire-and-forget)
    this.email
      .sendNewSignupAlert(dto.email, dto.firstName, dto.lastName, dto.companyName)
      .catch((err) => console.error("[EMAIL] Signup alert failed:", err?.message ?? err));

    return tokens;
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return null;

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;

    return user;
  }

  private get platformAdmins(): string[] {
    const raw = this.config.get<string>("PLATFORM_ADMIN_EMAILS", "");
    return raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }

  async loginOrRequire2FA(userId: string, email: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.twoFactorEnabled) {
      const pendingToken = this.jwt.sign(
        { sub: userId, scope: "2fa_pending" },
        { expiresIn: "5m" }
      );
      return { requires2FA: true, pendingToken };
    }
    return this.login(userId, email);
  }

  async complete2FALogin(pendingToken: string, code: string): Promise<AuthTokens> {
    let payload: { sub: string; scope: string };
    try {
      payload = this.jwt.verify(pendingToken) as any;
    } catch {
      throw new UnauthorizedException("Token 2FA expirado o inválido");
    }
    if (payload.scope !== "2fa_pending") throw new UnauthorizedException("Token inválido");

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    if (!user.twoFactorSecret) throw new BadRequestException("2FA no configurado");

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!valid) throw new UnauthorizedException("Código 2FA incorrecto");

    return this.login(user.id, user.email);
  }

  async disable2FA(userId: string, code: string): Promise<{ disabled: boolean }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException("2FA no está activo");
    }
    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!valid) throw new UnauthorizedException("Código 2FA incorrecto");

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { disabled: true };
  }

  async login(userId: string, email: string, companyId?: string): Promise<AuthTokens> {
    const userCompany = companyId
      ? await this.prisma.userCompany.findFirst({
          where: { userId, companyId },
        })
      : await this.prisma.userCompany.findFirst({
          where: { userId, isDefault: true },
        });

    if (!userCompany) {
      const anyMembership = await this.prisma.userCompany.findFirst({ where: { userId } });
      if (anyMembership) {
        await this.prisma.userCompany.update({ where: { id: anyMembership.id }, data: { isDefault: true } });
        return this.login(userId, email);
      }
      throw new UnauthorizedException("Sin empresa asociada");
    }

    let role = userCompany.role;
    if (this.platformAdmins.includes(email.toLowerCase()) && role !== "SUPER_ADMIN") {
      await this.prisma.userCompany.update({
        where: { id: userCompany.id },
        data: { role: "SUPER_ADMIN" },
      });
      role = "SUPER_ADMIN";
    }

    return this.generateTokens(userId, email, userCompany.companyId, role);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Token de refresco inválido");
    }

    // Revoke old, issue new (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const userCompany = await this.prisma.userCompany.findFirst({
      where: { userId: stored.userId, isDefault: true },
    });

    if (!userCompany) throw new UnauthorizedException();

    return this.generateTokens(
      stored.userId,
      stored.user.email,
      userCompany.companyId,
      userCompany.role
    );
  }

  async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true },
    });
  }

  async setup2FA(userId: string) {
    const secret = speakeasy.generateSecret({ name: "YouWhole" });
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });
    return { secret: secret.base32, otpauthUrl: secret.otpauth_url };
  }

  async verify2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.twoFactorSecret) throw new BadRequestException("2FA no configurado");

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!valid) throw new UnauthorizedException("Código 2FA inválido");

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { enabled: true };
  }

  private async generateTokens(
    userId: string,
    email: string,
    companyId: string,
    role: string
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, companyId, role: role as any };

    const accessToken = this.jwt.sign(payload);

    const refreshTokenStr = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.refreshToken.create({
      data: { token: refreshTokenStr, userId, expiresAt },
    });

    return { accessToken, refreshToken: refreshTokenStr };
  }
}
