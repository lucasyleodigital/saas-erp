import { PartialType } from "@nestjs/mapped-types";
import { CreateWarehouseDto } from "./create-warehouse.dto";
import { IsOptional, IsBoolean } from "class-validator";

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {
  @IsOptional() @IsBoolean() isActive?: boolean;
}
