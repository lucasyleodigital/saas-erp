import { IsString, IsOptional, MaxLength } from "class-validator";

export class CreateAccountDto {
  @IsString() @MaxLength(20) code: string;
  @IsString() @MaxLength(200) name: string;
  @IsString() @MaxLength(50) type: string;
  @IsOptional() @IsString() parentId?: string;
}
