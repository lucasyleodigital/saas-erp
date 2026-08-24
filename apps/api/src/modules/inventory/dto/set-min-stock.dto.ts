import { IsNumber, IsOptional, Min, ValidateIf } from "class-validator";
import { Type } from "class-transformer";

export class SetMinStockDto {
  @ValidateIf((o) => o.minStock !== null)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minStock!: number | null;
}
