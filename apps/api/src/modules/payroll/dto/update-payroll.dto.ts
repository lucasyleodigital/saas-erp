import { IsNumber, IsOptional, IsString, Min, MaxLength } from "class-validator";
import { Type } from "class-transformer";

export class UpdatePayrollDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  overtimePay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bonuses?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  otherDeductions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  irpfRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
