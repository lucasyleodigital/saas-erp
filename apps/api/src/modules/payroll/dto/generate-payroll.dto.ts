import { IsInt, IsOptional, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class GeneratePayrollDto {
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;
}
