import { IsBoolean, IsOptional, IsUrl } from "class-validator";

export class PortalDto {
  @IsUrl({ protocols: ["http", "https"], require_protocol: true, require_tld: false })
  returnUrl!: string;

  @IsOptional()
  @IsBoolean()
  cancelSubscription?: boolean;
}
