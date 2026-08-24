import { IsString, IsNumber, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from "class-validator";
import { Type } from "class-transformer";

class PhysicalInventoryItemDto {
  @IsString()
  productId!: string;

  @IsString()
  warehouseId!: string;

  @IsNumber()
  @Type(() => Number)
  actualQty!: number;
}

export class PhysicalInventoryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => PhysicalInventoryItemDto)
  items!: PhysicalInventoryItemDto[];
}
