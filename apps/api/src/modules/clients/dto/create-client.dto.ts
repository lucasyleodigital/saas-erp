import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsEnum,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class CreateClientDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cifNif?: string;

  @IsOptional()
  @IsEnum(["EMPRESA", "AUTONOMO", "PARTICULAR"])
  clientType?: "EMPRESA" | "AUTONOMO" | "PARTICULAR";

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
