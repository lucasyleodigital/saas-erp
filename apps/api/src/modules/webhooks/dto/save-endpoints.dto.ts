import { IsUrl, IsArray, IsBoolean, IsIn, ValidateNested, ArrayMaxSize } from "class-validator";
import { Type } from "class-transformer";

const AVAILABLE_EVENTS = [
  "*",
  "invoice.created",
  "invoice.paid",
  "invoice.overdue",
  "invoice.cancelled",
  "client.created",
  "client.updated",
  "quote.created",
  "quote.accepted",
  "payment.received",
  "deal.stage_changed",
] as const;

class WebhookEndpointDto {
  // Format validation only — the actual SSRF check (block localhost/private IPs)
  // still happens at dispatch time in WebhooksService.isSafeUrl().
  @IsUrl({ protocols: ["http", "https"], require_protocol: true, require_tld: false })
  url!: string;

  @IsArray()
  @IsIn(AVAILABLE_EVENTS, { each: true })
  events!: string[];

  @IsBoolean()
  active!: boolean;
}

export class SaveEndpointsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => WebhookEndpointDto)
  webhooks!: WebhookEndpointDto[];
}
