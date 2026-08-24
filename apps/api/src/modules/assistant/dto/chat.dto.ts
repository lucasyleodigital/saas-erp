import { IsString, MinLength, MaxLength } from "class-validator";

export class ChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
}
