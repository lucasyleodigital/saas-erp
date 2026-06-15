import { IsString, IsOptional, IsEnum, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export enum StockMovementType {
  PURCHASE = "PURCHASE", SALE = "SALE", ADJUSTMENT_IN = "ADJUSTMENT_IN",
  ADJUSTMENT_OUT = "ADJUSTMENT_OUT", RETURN = "RETURN", TRANSFER = "TRANSFER",
  TRANSFER_IN = "TRANSFER_IN", IN = "IN",
}

export class AddMovementDto {
  @IsString() productId: string;
  @IsString() warehouseId: string;
  @IsEnum(StockMovementType) type: StockMovementType;
  @IsNumber() @Min(0) @Type(() => Number) quantity: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) unitCost?: number;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() notes?: string;
}
