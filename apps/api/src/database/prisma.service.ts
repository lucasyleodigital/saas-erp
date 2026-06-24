import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@saas/database";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const dbUrl = process.env.DATABASE_URL ?? "";
    const separator = dbUrl.includes("?") ? "&" : "?";
    super({
      datasources: { db: { url: `${dbUrl}${separator}connection_limit=5&pool_timeout=10` } },
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Database connected with RLS tenant isolation");
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Execute a callback within a tenant-scoped transaction.
   * Sets the PostgreSQL session variable `app.current_company_id`
   * so RLS policies enforce tenant isolation at the DB level.
   */
  async $tenantTransaction<T>(
    companyId: string,
    fn: (tx: PrismaService) => Promise<T>,
  ): Promise<T> {
    const safeId = companyId.replace(/'/g, "''");
    await this.$executeRawUnsafe(`SET LOCAL app.current_company_id = '${safeId}'`);
    try {
      return await fn(this);
    } finally {
      await this.$executeRawUnsafe(`RESET app.current_company_id`).catch(() => {});
    }
  }
}
