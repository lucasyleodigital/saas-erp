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
import { RegisterDto } from "./dto/register.dto";
import type { JwtPayload, AuthTokens } from "@saas/types";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService
  ) {}

  async register(dto: RegisterDto) {
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

    const tokens = await this.generateTokens(user.id, user.email, company.id, "OWNER");

    // Send welcome email (fire-and-forget)
    this.email
      .sendWelcome(user.email, dto.firstName, dto.companyName)
      .catch((err) => console.error("[EMAIL] Welcome email failed:", err?.message ?? err));

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

  async login(userId: string, email: string, companyId?: string) {
    const userCompany = companyId
      ? await this.prisma.userCompany.findFirst({
          where: { userId, companyId },
        })
      : await this.prisma.userCompany.findFirst({
          where: { userId, isDefault: true },
        });

    if (!userCompany) throw new UnauthorizedException("Sin empresa asociada");

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
