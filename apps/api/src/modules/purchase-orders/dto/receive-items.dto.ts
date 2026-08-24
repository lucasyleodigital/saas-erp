import { IsString, IsNumber, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize, Min } from "class-validator";
import { Type } from "class-transformer";

class ReceiveItemDto {
  @IsString()
  itemId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  receivedQty!: number;
}

export class ReceiveItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items!: ReceiveItemDto[];
}
