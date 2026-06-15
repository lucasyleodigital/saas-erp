import { PartialType } from "@nestjs/swagger";
import { CreateWarehouseDto } from "./create-warehouse.dto";
import { IsOptional, IsBoolean } from "class-validator";

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {
  @IsOptional() @IsBoolean() isActive?: boolean;
}
