import { IsNumber, IsPositive, IsIn } from "class-validator";
import { Type } from "class-transformer";

const PAYMENT_METHODS = ["BANK_TRANSFER", "CARD", "CASH", "STRIPE", "OTHER"] as const;

export class RegisterPaymentDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @IsIn(PAYMENT_METHODS)
  method!: (typeof PAYMENT_METHODS)[number];
}
