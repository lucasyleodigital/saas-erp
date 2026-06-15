import { IsString, IsOptional, IsEmail, MaxLength } from "class-validator";

export class CreateWarehouseDto {
  @IsString() @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEmail() email?: string;
}
