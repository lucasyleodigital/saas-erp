import { IsIn, IsUrl } from "class-validator";

const PLANS = ["STARTER", "PRO", "ENTERPRISE"] as const;

export class CheckoutDto {
  @IsIn(PLANS)
  plan!: (typeof PLANS)[number];

  @IsUrl({ protocols: ["http", "https"], require_protocol: true, require_tld: false })
  successUrl!: string;

  @IsUrl({ protocols: ["http", "https"], require_protocol: true, require_tld: false })
  cancelUrl!: string;
}
