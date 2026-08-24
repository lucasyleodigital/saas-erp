import { IsEmail, IsString, IsOptional, MaxLength, MinLength } from "class-validator";

export class ContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;
}
