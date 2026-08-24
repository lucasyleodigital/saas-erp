import { IsString, MinLength } from "class-validator";

export class VerifyPaymentDto {
  @IsString()
  @MinLength(1)
  invoiceId!: string;

  @IsString()
  @MinLength(1)
  sessionId!: string;
}
