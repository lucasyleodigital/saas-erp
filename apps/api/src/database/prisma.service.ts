import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@saas/database";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const dbUrl = process.env.DATABASE_URL ?? "";
    const separator = dbUrl.includes("?") ? "&" : "?";
    // Limit pool to 5 connections — Supabase free tier allows 25 total
    super({
      datasources: { db: { url: `${dbUrl}${separator}connection_limit=5&pool_timeout=10` } },
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
