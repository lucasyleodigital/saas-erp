import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, MaxLength } from "class-validator";
import { Type } from "class-transformer";

export enum ProductType { SERVICE = "SERVICE", DIGITAL = "DIGITAL", PHYSICAL = "PHYSICAL" }

export class CreateProductDto {
  @IsString() @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MaxLength(100) sku?: string;
  @IsOptional() @IsString() @MaxLength(100) barcode?: string;
  @IsOptional() @IsEnum(ProductType) type?: ProductType;
  @IsNumber() @Min(0) @Type(() => Number) price: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) cost?: number;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsBoolean() trackStock?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) minStock?: number;
}
