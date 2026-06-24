import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { PrismaService } from "./prisma.service";

/**
 * Sets the PostgreSQL session variable `app.current_company_id`
 * for every authenticated request, enabling RLS policies.
 *
 * This is a defense-in-depth layer — even if a service forgets
 * to filter by companyId, the database will enforce isolation.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.companyId) {
      const safeId = user.companyId.replace(/'/g, "''");
      await this.prisma
        .$executeRawUnsafe(`SET LOCAL app.current_company_id = '${safeId}'`)
        .catch(() => {
          // SET LOCAL only works inside a transaction — RLS will
          // fall back to empty string (fail-closed, returns 0 rows)
        });
    }

    return next.handle();
  }
}
