import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

function toPlain(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  // Prisma Decimal (decimal.js) has a toFixed method and a constructor name "Decimal"
  if (typeof value === "object" && value.constructor?.name === "Decimal") {
    return parseFloat(value.toString());
  }
  if (Array.isArray(value)) return value.map(toPlain);
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    const out: Record<string, any> = {};
    for (const key of Object.keys(value)) out[key] = toPlain(value[key]);
    return out;
  }
  return value;
}

@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(toPlain));
  }
}
