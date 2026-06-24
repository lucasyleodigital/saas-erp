import { PipeTransform, Injectable, ArgumentMetadata } from "@nestjs/common";

/**
 * Strips HTML tags and trims whitespace from all string fields in DTOs.
 * Prevents stored XSS from user inputs reaching the database.
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  private static readonly HTML_TAG_RE = /<[^>]*>/g;
  private static readonly CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== "body" && metadata.type !== "query") return value;
    if (value === null || value === undefined) return value;
    if (typeof value === "string") return this.sanitizeString(value);
    if (typeof value === "object") return this.sanitizeObject(value);
    return value;
  }

  private sanitizeString(val: string): string {
    return val
      .replace(SanitizePipe.HTML_TAG_RE, "")
      .replace(SanitizePipe.CONTROL_CHAR_RE, "")
      .trim();
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        typeof item === "string"
          ? this.sanitizeString(item)
          : typeof item === "object" && item !== null
            ? this.sanitizeObject(item)
            : item
      );
    }

    const sanitized: any = {};
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === "string") {
        sanitized[key] = this.sanitizeString(val);
      } else if (typeof val === "object" && val !== null) {
        sanitized[key] = this.sanitizeObject(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }
}
