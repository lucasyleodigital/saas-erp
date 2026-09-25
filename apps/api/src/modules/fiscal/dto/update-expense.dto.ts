import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Min, MinLength, MaxLength } from "class-validator";

export class UpdateExpenseDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  supplierId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceRef?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vatRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  withholdingRate?: number;

  @IsOptional()
  @IsBoolean()
  isDeductible?: boolean;
}
