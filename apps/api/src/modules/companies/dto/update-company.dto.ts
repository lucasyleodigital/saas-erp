import { IsString, IsOptional, IsEmail, Allow, MaxLength } from "class-validator";

export class UpdateCompanyDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(200) legalName?: string;
  @IsOptional() @IsString() @MaxLength(20) cif?: string;
  @IsOptional() @IsString() @MaxLength(20) vatNumber?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) province?: string;
  @IsOptional() @IsString() @MaxLength(10) postalCode?: string;
  @IsOptional() @IsString() @MaxLength(2) country?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @Allow() settings?: Record<string, any>;
}
