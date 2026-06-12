import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../database/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      clientID: config.get<string>("GOOGLE_CLIENT_ID") || "google-oauth-not-configured",
      clientSecret: config.get<string>("GOOGLE_CLIENT_SECRET") || "google-oauth-not-configured",
      // Must point to the API server (Railway), NOT the web frontend (Vercel)
      callbackURL: `${config.get("API_URL", "http://localhost:3001")}/api/v1/auth/google/callback`,
      scope: ["email", "profile"],
      // Allow user to pick which Google account to use
      prompt: "select_account",
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback
  ) {
    const { id, emails, name } = profile;
    const email = emails[0].value;

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: id }, { email }] },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          googleId: id,
          firstName: name.givenName ?? "",
          lastName: name.familyName ?? "",
          password: await bcrypt.hash(crypto.randomUUID(), 12),
          emailVerified: true,
          companies: {
            create: {
              company: {
                create: {
                  name: `${name.givenName}'s Company`,
                  email,
                },
              },
              role: "OWNER",
              isDefault: true,
            },
          },
        },
      });
    } else if (!user.googleId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: id },
      });
    }

    done(null, user);
  }
}
