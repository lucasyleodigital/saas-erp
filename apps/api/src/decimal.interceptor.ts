import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

function isDecimal(value: any): boolean {
  if (!value || typeof value !== "object") return false;
  const name = value.constructor?.name;
  if (name === "Decimal") return true;
  if (typeof value.toFixed === "function" && typeof value.d !== "undefined" && typeof value.s !== "undefined") return true;
  return false;
}

function toPlain(value: any, depth = 0): any {
  if (depth > 20) return value;
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (isDecimal(value)) return parseFloat(value.toString());
  if (Array.isArray(value)) return value.map((v) => toPlain(v, depth + 1));
  if (value instanceof Date) return value;
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "object") {
    const out: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      out[key] = toPlain(value[key], depth + 1);
    }
    return out;
  }
  return value;
}

@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  private readonly logger = new Logger("DecimalInterceptor");

  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        try {
          return toPlain(data);
        } catch (err) {
          this.logger.error("Failed to serialize response", (err as Error).stack);
          return data;
        }
      }),
    );
  }
}
