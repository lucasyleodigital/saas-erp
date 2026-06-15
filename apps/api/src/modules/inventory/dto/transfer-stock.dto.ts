import { IsString, IsNumber, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";

export class TransferStockDto {
  @IsString() productId: string;
  @IsString() fromWarehouseId: string;
  @IsString() toWarehouseId: string;
  @IsNumber() @Min(0.001) @Type(() => Number) quantity: number;
  @IsOptional() @IsString() notes?: string;
}
