import { IsString, IsOptional, MaxLength, MinLength } from "class-validator";

export class CreateBankAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(34) // max IBAN length per ISO 13616
  iban?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11) // BIC/SWIFT is 8 or 11 chars
  bic?: string;
}
