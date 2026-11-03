import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../database/prisma.service";
import type { JwtPayload } from "@saas/types";

// Cada petición comprueba que el usuario sigue activo; se guarda unos segundos para no ir a la BD cada vez
const ACTIVE_CACHE_MS = 30_000;
const activeUntil = new Map<string, number>();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>("JWT_SECRET") ?? "",
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    if ((activeUntil.get(payload.sub) ?? 0) > Date.now()) return payload;

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      activeUntil.delete(payload.sub);
      throw new UnauthorizedException();
    }

    activeUntil.set(payload.sub, Date.now() + ACTIVE_CACHE_MS);
    return payload;
  }
}
