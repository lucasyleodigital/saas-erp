import { IsUrl } from "class-validator";

export class PortalCheckoutDto {
  @IsUrl({ protocols: ["http", "https"], require_protocol: true, require_tld: false })
  successUrl!: string;

  @IsUrl({ protocols: ["http", "https"], require_protocol: true, require_tld: false })
  cancelUrl!: string;
}
